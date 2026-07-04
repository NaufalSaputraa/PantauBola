import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import time
from pipeline.config import SUPPORTED_LEAGUES, API_DELAY_SECONDS
from pipeline.football_api import FootballAPI
from pipeline.supabase_db import SupabaseDB
from pipeline.poisson import calculate_poisson_probabilities
from pipeline.gemini import GeminiClient
from pipeline.understat_scraper import UnderstatScraper
from pipeline.telegram_notifier import send_telegram_message

def get_team_form_string(team_id, recent_matches):
    """
    Mengubah list pertandingan terakhir menjadi string form, misal: 'W-D-L-W-W'
    """
    form_list = []
    # Urutkan dari terlama ke terbaru
    for match in reversed(recent_matches):
        home_id = match.get("home_team_id")
        away_id = match.get("away_team_id")
        home_score = match.get("home_score")
        away_score = match.get("away_score")
        
        # Lewati jika skor belum ada
        if home_score is None or away_score is None:
            continue
            
        if home_id == team_id:
            if home_score > away_score:
                form_list.append("W")
            elif home_score == away_score:
                form_list.append("D")
            else:
                form_list.append("L")
        elif away_id == team_id:
            if away_score > home_score:
                form_list.append("W")
            elif away_score == home_score:
                form_list.append("D")
            else:
                form_list.append("L")
                
    return "-".join(form_list) if form_list else "N/A"

def run_pipeline():
    print("=== MEMULAI PIPELINE DATA PANTAUBOLA ===")
    send_telegram_message("⏳ <b>[PantauBola Pipeline]</b> Memulai sinkronisasi data dan pembuatan prediksi AI...")
    
    # Inisialisasi API, DB, dan Gemini
    try:
        api = FootballAPI()
        db = SupabaseDB()
        gemini = GeminiClient()
    except Exception as e:
        err_msg = f"❌ <b>[PantauBola Pipeline - CRITICAL]</b> Gagal inisialisasi client: {e}"
        print(err_msg)
        send_telegram_message(err_msg)
        return

    processed_leagues = []
    total_predictions_made = 0

    for league_code, league_name in SUPPORTED_LEAGUES.items():
        print(f"\nProcessing {league_name} ({league_code})...")
        
        # 1. Tarik Data Tim & Klasemen dari API
        try:
            teams, standings = api.get_standings_and_teams(league_code)
            print(f"Berhasil menarik {len(teams)} tim dan data klasemen.")
            
            # Simpan ke Database
            db.upsert_teams(teams)
            db.upsert_standings(standings)
            print("Data tim dan klasemen berhasil di-upsert ke Supabase.")
        except Exception as e:
            err_msg = f"⚠️ <b>[PantauBola Pipeline]</b> Gagal memproses data tim & klasemen liga {league_name}: {e}"
            print(err_msg)
            send_telegram_message(err_msg)
            continue
            
        # 2. Tarik Seluruh Matchday Liga dari API
        try:
            matches, season_year = api.get_matches(league_code)
            print(f"Berhasil menarik {len(matches)} data pertandingan musim ini (Tahun Musim: {season_year}).")
            
            # Ambil semua id tim unik dari matches untuk mencegah foreign key violation
            match_team_ids = set()
            for m in matches:
                if m.get("home_team_id"):
                    match_team_ids.add(m["home_team_id"])
                if m.get("away_team_id"):
                    match_team_ids.add(m["away_team_id"])
            
            # Cari id tim yang sudah di-upsert tadi
            existing_team_ids = {t["id"] for t in teams}
            
            # Cari id tim baru yang tidak ada di standings tetapi ada di matches
            missing_team_ids = match_team_ids - existing_team_ids
            if missing_team_ids:
                print(f"Menemukan {len(missing_team_ids)} tim dari jadwal matches yang tidak ada di standings. Menarik detail dari API...")
                fetched_teams = []
                for tid in missing_team_ids:
                    team_details = api.get_team_details(tid)
                    fetched_teams.append({
                        "id": tid,
                        "name": team_details["name"],
                        "logo_url": team_details["logo_url"] or "https://crests.football-data.org/placeholder.png",
                        "league": league_code
                     })
                    # Jeda singkat agar tidak terkena rate limit
                    time.sleep(1.5)
                db.upsert_teams(fetched_teams)
            
            # Simpan ke Database
            db.upsert_matches(matches)
            print("Data pertandingan berhasil di-upsert ke Supabase.")

            # 2.5 Tarik Data xG Tim dari Understat & Update ke Database
            try:
                scraper = UnderstatScraper(db)
                scraper.scrape_and_update_xg(league_code, season_year)
            except Exception as e:
                print(f"Gagal melakukan scraping xG untuk liga {league_code}: {e}")
        except Exception as e:
            err_msg = f"⚠️ <b>[PantauBola Pipeline]</b> Gagal memproses matches liga {league_name}: {e}"
            print(err_msg)
            send_telegram_message(err_msg)
            continue

        # 3. Proses Prediksi AI untuk Laga Mendatang (SCHEDULED / POSTPONED)
        try:
            # Ambil matches yang belum selesai
            upcoming = db.get_upcoming_matches(league_code, limit=10) # Ambil 10 laga terdekat per liga
            finished = db.get_finished_matches(league_code, limit=150) # Ambil laga historis untuk hitung Poisson
            
            # Cari rank klasemen untuk pemetaan cepat
            standings_db = db.client.table("standings").select("team_id, position").eq("league", league_code).execute().data
            ranks = {item["team_id"]: item["position"] for item in standings_db}
            
            print(f"Menghitung prediksi untuk {len(upcoming)} pertandingan mendatang...")
            
            batch_payloads = []
            
            for match in upcoming:
                match_id = match["id"]
                home_id = match["home_team_id"]
                away_id = match["away_team_id"]
                home_name = match.get("home_team", {}).get("name", "Home Team")
                away_name = match.get("away_team", {}).get("name", "Away Team")
                
                # A. Hitung Poisson
                poisson_results = calculate_poisson_probabilities(home_id, away_id, finished)
                
                # B. Dapatkan tren form 5 laga terakhir
                home_recent = db.get_team_recent_matches(home_id, limit=5)
                away_recent = db.get_team_recent_matches(away_id, limit=5)
                home_form = get_team_form_string(home_id, home_recent)
                away_form = get_team_form_string(away_id, away_recent)
                
                # Hitung rata-rata xG historis tim kandang/tandang
                home_xg_list = [m.get("home_xg") for m in finished if m.get("home_team_id") == home_id and m.get("home_xg") is not None]
                away_xg_list = [m.get("away_xg") for m in finished if m.get("away_team_id") == away_id and m.get("away_xg") is not None]
                
                home_avg_xg = round(sum(home_xg_list) / len(home_xg_list), 2) if home_xg_list else None
                away_avg_xg = round(sum(away_xg_list) / len(away_xg_list), 2) if away_xg_list else None
                
                # Rank default jika klasemen kosong
                home_rank = ranks.get(home_id, 10)
                away_rank = ranks.get(away_id, 10)
                
                # C. Siapkan payload parameter untuk Gemini
                batch_payloads.append({
                    "match_id": match_id,
                    "home_team": home_name,
                    "away_team": away_name,
                    "league": league_name,
                    "home_rank": home_rank,
                    "away_rank": away_rank,
                    "home_form": home_form,
                    "away_form": away_form,
                    "home_prob": poisson_results["home_prob"],
                    "draw_prob": poisson_results["draw_prob"],
                    "away_prob": poisson_results["away_prob"],
                    "poisson_home_score": poisson_results["predicted_home_score"],
                    "poisson_away_score": poisson_results["predicted_away_score"],
                    "home_avg_xg": home_avg_xg,
                    "away_avg_xg": away_avg_xg
                })
            
            if batch_payloads:
                print(f"  -> Mengirim {len(batch_payloads)} pertandingan ke Gemini untuk dianalisis sekaligus...")
                # D. Picu analisis taktis AI Gemini (Batching)
                batch_analyses = gemini.generate_batch_match_analysis(batch_payloads)
                
                # E. Simpan hasil prediksi dan ulasan AI ke database
                for analysis in batch_analyses:
                    m_id = analysis["match_id"]
                    # Cari info payload asli untuk probabilitas Poisson
                    original_payload = next((item for item in batch_payloads if item["match_id"] == m_id), None)
                    if not original_payload:
                        continue
                        
                    prediction_record = {
                        "match_id": m_id,
                        "home_prob": original_payload["home_prob"],
                        "draw_prob": original_payload["draw_prob"],
                        "away_prob": original_payload["away_prob"],
                        "predicted_home_score": analysis["prediksi_skor"]["home"],
                        "predicted_away_score": analysis["prediksi_skor"]["away"],
                        "analysis_text": analysis["ulasan_analisis"],
                        "key_factors": analysis["faktor_kunci"]
                    }
                    
                    db.upsert_prediction(prediction_record)
                    total_predictions_made += 1
                    print(f"     [OK] Prediksi untuk Match ID {m_id} disimpan. Skor AI: {analysis['prediksi_skor']['home']} - {analysis['prediksi_skor']['away']}.")
                
                # Delay singkat antar pemanggilan Gemini API untuk keselamatan rate limit
                time.sleep(1.5)
                
        except Exception as e:
            err_msg = f"⚠️ <b>[PantauBola Pipeline]</b> Gagal kalkulasi prediksi liga {league_name}: {e}"
            print(err_msg)
            send_telegram_message(err_msg)
            continue
            
        processed_leagues.append(league_name)

    # Kirim status sukses akhir ke Telegram
    success_summary = (
        f"✅ <b>[PantauBola Pipeline - Sukses]</b>\n"
        f"- Liga diproses: {', '.join(processed_leagues)}\n"
        f"- Prediksi AI Baru: {total_predictions_made} laga\n"
        f"- Status: OK"
    )
    print("\n=== PIPELINE SELESAI DENGAN SUKSES ===")
    send_telegram_message(success_summary)

if __name__ == "__main__":
    run_pipeline()
