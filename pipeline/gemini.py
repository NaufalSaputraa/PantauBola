import json
import time
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List
from pipeline.config import GEMINI_API_KEY

# Pydantic Schema untuk Output Terstruktur Gemini (JSON Mode)
class SkorPrediksi(BaseModel):
    home: int
    away: int

class GeminiAnalysis(BaseModel):
    prediksi_skor: SkorPrediksi
    ulasan_analisis: str = Field(description="Maksimal 3 kalimat ulasan taktis mengenai jalannya pertandingan.")
    faktor_kunci: List[str] = Field(description="Maksimal 3 poin faktor utama yang mempengaruhi hasil pertandingan.")

# Konfigurasi model cascade: dari yang tercepat ke yang paling ringan
MODEL_CASCADE = [
    {
        "name": "gemini-3.5-flash",
        "label": "Gemini 3.5 Flash",
        "desc": "Model utama — cepat dan cerdas untuk analisis taktis",
    },
    {
        "name": "gemini-2.5-pro",
        "label": "Gemini 2.5 Pro",
        "desc": "Fallback pertama - model Pro dengan reasoning mendalam",
    },
    {
        "name": "gemini-3.1-flash-lite",
        "label": "Gemini 3.1 Flash Lite",
        "desc": "Fallback terakhir — model ringan dengan kuota tinggi",
    },
]

# Delay (detik) sebelum retry ke model berikutnya
RETRY_DELAY_SECONDS = 2


class GeminiClient:
    def __init__(self):
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY harus dikonfigurasi di env.")

        # Inisialisasi client baru google-genai
        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.models = MODEL_CASCADE

        # Konfigurasi system instruction
        self.system_instruction = (
            "Kamu adalah analis sepak bola profesional yang objektif dan berbasis data. "
            "Tugasmu adalah memberikan analisis singkat mengenai pertandingan mendatang berdasarkan data statistik yang diberikan. "
            "Gunakan gaya bahasa kasual, taktis, dan populer di kalangan pecinta sepak bola Indonesia (contoh: 'on-fire', 'clean sheet', 'counter-attack'). "
            "Hindari kalimat pembuka atau penutup yang tidak perlu. Langsung berikan analisis pada poin yang diminta."
        )

    def _call_model(self, model_name: str, prompt: str) -> dict | None:
        """Panggil satu model. Return dict jika sukses, None jika gagal."""
        try:
            response = self.client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=self.system_instruction,
                    response_mime_type="application/json",
                    response_schema=GeminiAnalysis,
                    temperature=0.2
                )
            )
            data = json.loads(response.text)
            return data
        except Exception as e:
            error_str = str(e)
            # Deteksi jenis error untuk logging yang lebih jelas
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                print(f"  [WARN] [{model_name}] Kuota habis (429). Cascading ke model berikutnya...")
            elif "404" in error_str or "NOT_FOUND" in error_str:
                print(f"  [WARN] [{model_name}] Model tidak ditemukan (404). Cascading ke model berikutnya...")
            else:
                print(f"  [WARN] [{model_name}] Error: {e}")
            return None

    def generate_match_analysis(self, match_info):
        """
        Menghasilkan ulasan AI taktis dengan sistem fallback multi-model.
        Cascade: gemini-3.5-flash → gemini-3.1-pro → gemini-3.1-flash-lite → fallback statis.
        """
        home_xg_str = f"{match_info['home_avg_xg']:.2f}" if match_info.get("home_avg_xg") is not None else "N/A"
        away_xg_str = f"{match_info['away_avg_xg']:.2f}" if match_info.get("away_avg_xg") is not None else "N/A"

        prompt = f"""
        Buat analisis taktis pertandingan berikut:
        Liga: {match_info['league']}
        Pertandingan: {match_info['home_team']} (Kandang) vs {match_info['away_team']} (Tandang)
        
        Statistik Tim Kandang:
        - Posisi Klasemen: {match_info['home_rank']}
        - Tren 5 Laga Terakhir: {match_info['home_form']}
        - Rata-rata Expected Goals (xG) Historis: {home_xg_str}
        
        Statistik Tim Tandang:
        - Posisi Klasemen: {match_info['away_rank']}
        - Tren 5 Laga Terakhir: {match_info['away_form']}
        - Rata-rata Expected Goals (xG) Historis: {away_xg_str}
        
        Kalkulasi Matematis Poisson Win-Probability:
        - Peluang {match_info['home_team']} Menang: {match_info['home_prob']}%
        - Peluang Seri: {match_info['draw_prob']}%
        - Peluang {match_info['away_team']} Menang: {match_info['away_prob']}%
        - Estimasi Skor Poisson: {match_info['poisson_home_score']} - {match_info['poisson_away_score']}
        
        Instruksi Penting:
        - Analisis taktis harus menyelaraskan kalkulasi Poisson dengan tren terbaru tim dan performa penciptaan peluang (xG).
        - Tulis ulasan analisis maksimal 3 kalimat dalam bahasa Indonesia kasual gaul bola.
        - Tentukan 3 faktor kunci kemenangan.
        """

        # Coba setiap model secara berurutan (cascade)
        for i, model in enumerate(self.models):
            result = self._call_model(model["name"], prompt)
            if result is not None:
                if i > 0:
                    # Jika bukan model utama, informasikan model mana yang berhasil
                    print(f"  [OK] Berhasil menggunakan fallback: {model['label']}")
                return result

            # Delay sebelum mencoba model berikutnya
            if i < len(self.models) - 1:
                time.sleep(RETRY_DELAY_SECONDS)

        # Fallback statis terakhir jika SEMUA model gagal
        print(f"  [FAIL] Semua model gagal. Menggunakan fallback statis berbasis Poisson.")
        return {
            "prediksi_skor": {
                "home": match_info["poisson_home_score"],
                "away": match_info["poisson_away_score"]
            },
            "ulasan_analisis": f"Pertandingan ketat di {match_info['league']}. {match_info['home_team']} memiliki tren performa {match_info['home_form']} sedangkan {match_info['away_team']} berada di tren {match_info['away_form']}.",
            "faktor_kunci": [
                "Efisiensi serangan di lini depan.",
                "Konsistensi pertahanan kedua tim.",
                "Faktor mental bermain di kandang."
            ]
        }
