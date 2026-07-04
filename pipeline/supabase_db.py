from supabase import create_client, Client
from pipeline.config import SUPABASE_URL, SUPABASE_SERVICE_KEY

class SupabaseDB:
    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise ValueError("SUPABASE_URL dan SUPABASE_SERVICE_KEY harus dikonfigurasi.")
        self.client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    def upsert_teams(self, teams_list):
        """
        Upsert data tim ke dalam tabel teams.
        teams_list: list of dict berisi {id, name, logo_url, league}
        """
        if not teams_list:
            return
        # Bulk upsert ke tabel teams
        response = self.client.table("teams").upsert(teams_list).execute()
        return response.data

    def upsert_standings(self, standings_list):
        """
        Upsert data klasemen ke dalam tabel standings.
        standings_list: list of dict berisi {team_id, league, position, played, won, drawn, lost, goals_for, goals_against, points}
        """
        if not standings_list:
            return
        response = self.client.table("standings").upsert(standings_list, on_conflict="team_id").execute()
        return response.data

    def upsert_matches(self, matches_list):
        """
        Upsert data jadwal & hasil pertandingan ke dalam tabel matches.
        matches_list: list of dict berisi {id, home_team_id, away_team_id, match_date, home_score, away_score, status, league, matchday}
        """
        if not matches_list:
            return
        response = self.client.table("matches").upsert(matches_list).execute()
        return response.data

    def update_match_stats(self, match_id, stats_dict):
        """
        Update statistik detail (xG, Shots, PPDA, dll) untuk match tertentu.
        """
        response = self.client.table("matches") \
            .update(stats_dict) \
            .eq("id", match_id) \
            .execute()
        return response.data

    def upsert_prediction(self, prediction_dict):
        """
        Upsert data prediksi hasil kalkulasi & analisis Gemini ke tabel ai_predictions.
        prediction_dict: dict berisi {match_id, home_prob, draw_prob, away_prob, predicted_home_score, predicted_away_score, analysis_text, key_factors}
        """
        response = self.client.table("ai_predictions").upsert(prediction_dict, on_conflict="match_id").execute()
        return response.data

    def get_finished_matches(self, league, limit=100):
        """
        Mengambil daftar pertandingan yang sudah selesai untuk analisis statistik Poisson.
        """
        response = self.client.table("matches") \
            .select("*") \
            .eq("league", league) \
            .eq("status", "FINISHED") \
            .order("match_date", desc=True) \
            .limit(limit) \
            .execute()
        return response.data

    def get_team_recent_matches(self, team_id, limit=5):
        """
        Mengambil 5 pertandingan terakhir dari satu tim untuk menganalisis performa terbaru (form).
        """
        response = self.client.table("matches") \
            .select("*") \
            .or_(f"home_team_id.eq.{team_id},away_team_id.eq.{team_id}") \
            .eq("status", "FINISHED") \
            .order("match_date", desc=True) \
            .limit(limit) \
            .execute()
        return response.data

    def get_upcoming_matches(self, league, limit=20):
        """
        Mengambil jadwal pertandingan yang belum dimulai untuk dilakukan kalkulasi prediksi.
        Status: SCHEDULED
        """
        response = self.client.table("matches") \
            .select("*, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)") \
            .eq("league", league) \
            .in_("status", ["SCHEDULED", "POSTPONED"]) \
            .order("match_date", desc=False) \
            .limit(limit) \
            .execute()
        return response.data
