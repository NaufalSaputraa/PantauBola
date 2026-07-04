import unittest
from unittest.mock import MagicMock, patch
import os

# Set environment variable dummy untuk inisialisasi GeminiClient tanpa error
os.environ["GEMINI_API_KEY"] = "dummy_api_key"

from pipeline.gemini import GeminiClient

class TestGeminiClient(unittest.TestCase):
    @patch('pipeline.gemini.genai.Client')
    def test_client_initialization(self, mock_genai_client):
        # Cek apakah inisialisasi client memanggil genai.Client
        client = GeminiClient()
        mock_genai_client.assert_called_once_with(api_key="dummy_api_key")
        self.assertEqual(len(client.models), 3)

    @patch('pipeline.gemini.genai.Client')
    def test_model_cascade_fallback_mechanism(self, mock_genai_client):
        # Test skenario: Model pertama (3.5-flash) gagal (error), model kedua (2.5-pro) berhasil
        client = GeminiClient()
        
        # Buat mock response
        mock_response = MagicMock()
        mock_response.text = '{"prediksi_skor": {"home": 2, "away": 1}, "ulasan_analisis": "Laga ketat dimenangkan Arsenal.", "faktor_kunci": ["Faktor X"]}'
        
        # Panggilan pertama memicu Exception (Flash kuota habis), panggilan kedua sukses (Pro)
        mock_generate = MagicMock(side_effect=[
            Exception("429 Resource Exhausted"),
            mock_response
        ])
        
        client.client.models.generate_content = mock_generate
        
        match_payload = {
            "league": "Premier League",
            "home_team": "Arsenal",
            "away_team": "Chelsea",
            "home_rank": 1,
            "away_rank": 10,
            "home_form": "W-W-W",
            "away_form": "L-D-L",
            "home_prob": 60.0,
            "draw_prob": 25.0,
            "away_prob": 15.0,
            "poisson_home_score": 2,
            "poisson_away_score": 0,
            "home_avg_xg": 2.1,
            "away_avg_xg": 1.1
        }
        
        result = client.generate_match_analysis(match_payload)
        
        # Verifikasi hasil parsing dari model yang sukses
        self.assertEqual(result["prediksi_skor"]["home"], 2)
        self.assertEqual(result["prediksi_skor"]["away"], 1)
        self.assertEqual(result["ulasan_analisis"], "Laga ketat dimenangkan Arsenal.")
        
        # Model generate_content harus dipanggil 2 kali karena flash pertama gagal
        self.assertEqual(mock_generate.call_count, 2)

    @patch('pipeline.gemini.genai.Client')
    def test_static_fallback_when_all_models_fail(self, mock_genai_client):
        # Skenario: Semua model AI gagal (misal internet down), harus return static fallback
        client = GeminiClient()
        
        # Semua panggilan generate_content melempar exception
        mock_generate = MagicMock(side_effect=Exception("API Error"))
        client.client.models.generate_content = mock_generate
        
        match_payload = {
            "league": "Premier League",
            "home_team": "Arsenal",
            "away_team": "Chelsea",
            "home_rank": 1,
            "away_rank": 10,
            "home_form": "W-W-W",
            "away_form": "L-D-L",
            "home_prob": 60.0,
            "draw_prob": 25.0,
            "away_prob": 15.0,
            "poisson_home_score": 2,
            "poisson_away_score": 0,
            "home_avg_xg": 2.1,
            "away_avg_xg": 1.1
        }
        
        result = client.generate_match_analysis(match_payload)
        
        # Harus mengembalikan static fallback dengan benar
        self.assertEqual(result["prediksi_skor"]["home"], 2)
        self.assertEqual(result["prediksi_skor"]["away"], 0)
        self.assertIn("Pertandingan ketat", result["ulasan_analisis"])
        self.assertEqual(len(result["faktor_kunci"]), 3)

if __name__ == "__main__":
    unittest.main()
