import requests
import time
from pipeline.config import FOOTBALL_DATA_API_KEY, API_DELAY_SECONDS

class FootballAPI:
    def __init__(self):
        if not FOOTBALL_DATA_API_KEY:
            raise ValueError("FOOTBALL_DATA_API_KEY harus dikonfigurasi di env.")
        self.headers = {"X-Auth-Token": FOOTBALL_DATA_API_KEY}
        self.base_url = "https://api.football-data.org/v4"

    def _get(self, endpoint, max_retries=3):
        """
        Melakukan GET request dengan penanganan rate limit.
        """
        url = f"{self.base_url}/{endpoint}"
        retries = 0
        
        while retries <= max_retries:
            print(f"Mengambil data dari API (Percobaan {retries + 1}/{max_retries + 1}): {url}...")
            
            # Jeda waktu sebelum request untuk menghindari HTTP 429 Rate Limit
            time.sleep(API_DELAY_SECONDS)
            
            try:
                response = requests.get(url, headers=self.headers)
            except Exception as e:
                print(f"Network error: {e}")
                retries += 1
                if retries <= max_retries:
                    time.sleep(5)
                    continue
                raise
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                retries += 1
                if retries <= max_retries:
                    wait_time = 30 * retries  # Backoff: 30s, 60s, 90s...
                    print(f"WARNING: Terkena Rate Limit (HTTP 429). Menunggu {wait_time} detik sebelum mencoba kembali...")
                    time.sleep(wait_time)
                else:
                    print(f"Error HTTP 429: Batas maksimal retry ({max_retries}) tercapai.")
                    response.raise_for_status()
            else:
                print(f"Error {response.status_code} saat mengambil {url}: {response.text}")
                response.raise_for_status()

    def get_standings_and_teams(self, league_code):
        """
        Mengambil klasemen liga, yang juga menyertakan detail data tim.
        Endpoint: /v4/competitions/{league_code}/standings
        """
        data = self._get(f"competitions/{league_code}/standings")
        
        teams = []
        standings = []
        
        # Parsing data tim dan klasemen dari struktur JSON Football-Data.org
        for table_wrapper in data.get("standings", []):
            if table_wrapper.get("type") == "TOTAL":
                for entry in table_wrapper.get("table", []):
                    team_info = entry.get("team", {})
                    team_id = team_info.get("id")
                    
                    teams.append({
                        "id": team_id,
                        "name": team_info.get("name"),
                        "logo_url": team_info.get("crest"), # crest di API adalah URL logo tim
                        "league": league_code
                    })
                    
                    standings.append({
                        "team_id": team_id,
                        "league": league_code,
                        "position": entry.get("position"),
                        "played": entry.get("playedGames"),
                        "won": entry.get("won"),
                        "drawn": entry.get("draw"),
                        "lost": entry.get("lost"),
                        "goals_for": entry.get("goalsFor"),
                        "goals_against": entry.get("goalsAgainst"),
                        "points": entry.get("points")
                    })
                    
        return teams, standings

    def get_matches(self, league_code):
        """
        Mengambil semua jadwal pertandingan (dan hasil skor jika sudah tanding) dalam satu musim.
        Endpoint: /v4/competitions/{league_code}/matches
        """
        data = self._get(f"competitions/{league_code}/matches")
        
        # Ekstrak tahun awal musim secara dinamis (misal: 2025 dari 2025-08-11)
        season_year = 2025  # Fallback default
        if data.get("matches"):
            first_match = data["matches"][0]
            season_info = first_match.get("season", {})
            start_date = season_info.get("startDate")
            if start_date:
                try:
                    season_year = int(start_date.split("-")[0])
                except Exception:
                    pass

        matches = []
        for match in data.get("matches", []):
            home_team = match.get("homeTeam", {})
            away_team = match.get("awayTeam", {})
            
            # Lewati jika tim home/away belum terisi (biasanya babak kualifikasi piala)
            if not home_team.get("id") or not away_team.get("id"):
                continue
                
            score = match.get("score", {})
            full_time_score = score.get("fullTime", {})
            
            # Status pertandingan (Football-Data.org status: SCHEDULED, TIMED, IN_PLAY, PAUSED, FINISHED, POSTPONED, SUSPENDED, CANCELLED)
            status = match.get("status", "SCHEDULED")
            # Konversi status TIMED / IN_PLAY agar selaras dengan DB enum
            if status in ["TIMED", "IN_PLAY", "PAUSED"]:
                db_status = "SCHEDULED" # atau "LIVE" jika sedang bermain
            elif status in ["FINISHED"]:
                db_status = "FINISHED"
            elif status in ["POSTPONED", "SUSPENDED", "CANCELLED"]:
                db_status = "POSTPONED"
            else:
                db_status = "SCHEDULED"
                
            matches.append({
                "id": match.get("id"),
                "home_team_id": home_team.get("id"),
                "away_team_id": away_team.get("id"),
                "match_date": match.get("utcDate"),
                "home_score": full_time_score.get("home"), # bernilai None di API jika belum tanding
                "away_score": full_time_score.get("away"), # bernilai None di API jika belum tanding
                "status": db_status,
                "league": league_code,
                "matchday": match.get("matchday")
            })
            
        return matches, season_year
