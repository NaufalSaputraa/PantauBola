import re
import codecs
import json
from difflib import SequenceMatcher
from scrapling import Fetcher

# Mapping kode liga API utama ke penamaan liga Understat
LEAGUE_MAP = {
    "PL": "EPL",
    "PD": "La_Liga",
    "SA": "Serie_A",
    "BL1": "Bundesliga"
}

# Kamus Pemetaan Nama Klub (API Name -> Understat Name) untuk akurasi instan
TEAM_MAPPING = {
    # Premier League
    "Manchester United FC": "Manchester United",
    "Tottenham Hotspur FC": "Tottenham",
    "West Ham United FC": "West Ham",
    "Brighton & Hove Albion FC": "Brighton",
    "Leicester City FC": "Leicester",
    "Arsenal FC": "Arsenal",
    "Manchester City FC": "Manchester City",
    "Chelsea FC": "Chelsea",
    "Liverpool FC": "Liverpool",
    "Newcastle United FC": "Newcastle United",
    "Aston Villa FC": "Aston Villa",
    "Everton FC": "Everton",
    "Fulham FC": "Fulham",
    "Crystal Palace FC": "Crystal Palace",
    "Brentford FC": "Brentford",
    "Wolverhampton Wanderers FC": "Wolverhampton",
    "Nottingham Forest FC": "Nottingham Forest",
    "Bournemouth FC": "Bournemouth",
    "AFC Bournemouth": "Bournemouth",
    "Luton Town FC": "Luton",
    "Burnley FC": "Burnley",
    "Sheffield United FC": "Sheffield United",
    "Ipswich Town FC": "Ipswich",
    "Southampton FC": "Southampton",

    # La Liga
    "Real Madrid CF": "Real Madrid",
    "FC Barcelona": "Barcelona",
    "Atlético Madrid": "Atletico Madrid",
    "Club Atlético de Madrid": "Atletico Madrid",
    "Sevilla FC": "Sevilla",
    "Real Sociedad de Fútbol": "Real Sociedad",
    "Real Betis Balompié": "Real Betis",
    "Villarreal CF": "Villarreal",
    "Athletic Club": "Athletic Club",
    "Valencia CF": "Valencia",
    "Girona FC": "Girona",
    "UD Las Palmas": "Las Palmas",
    "Rayo Vallecano de Madrid": "Rayo Vallecano",
    "RC Celta de Vigo": "Celta Vigo",
    "Deportivo Alavés": "Alaves",
    "Getafe CF": "Getafe",
    "RCD Mallorca": "Mallorca",
    "CA Osasuna": "Osasuna",
    "Granada CF": "Granada",
    "Cádiz CF": "Cadiz",
    "UD Almería": "Almeria",

    # Serie A
    "FC Internazionale Milano": "Inter",
    "AC Milan": "Milan",
    "Juventus FC": "Juventus",
    "SSC Napoli": "Napoli",
    "SS Lazio": "Lazio",
    "AS Roma": "Roma",
    "Atalanta BC": "Atalanta",
    "ACF Fiorentina": "Fiorentina",
    "Bologna FC 1909": "Bologna",
    "Torino FC": "Torino",
    "Monza profile": "Monza",
    "AC Monza": "Monza",
    "Genoa CFC": "Genoa",
    "US Lecce": "Lecce",
    "Frosinone Calcio": "Frosinone",
    "Udinese Calcio": "Udinese",
    "Hellas Verona FC": "Verona",
    "Cagliari Calcio": "Cagliari",
    "Empoli FC": "Empoli",
    "US Sassuolo Calcio": "Sassuolo",
    "US Salernitana 1919": "Salernitana",

    # Bundesliga
    "FC Bayern München": "Bayern Munich",
    "Borussia Dortmund": "Borussia Dortmund",
    "Bayer 04 Leverkusen": "Leverkusen",
    "RB Leipzig": "RB Leipzig",
    "VfB Stuttgart": "Stuttgart",
    "Eintracht Frankfurt": "Eintracht Frankfurt",
    "VfL Wolfsburg": "Wolfsburg",
    "Borussia Mönchengladbach": "Borussia M.Gladbach",
    "TSG 1899 Hoffenheim": "Hoffenheim",
    "Sport-Club Freiburg": "Freiburg",
    "SC Freiburg": "Freiburg",
    "1. FC Heidenheim 1846": "Heidenheim",
    "SV Werder Bremen": "Werder Bremen",
    "FC Augsburg": "Augsburg",
    "1. FSV Mainz 05": "Mainz 05",
    "VfL Bochum 1848": "Bochum",
    "1. FC Köln": "Koln",
    "SV Darmstadt 98": "Darmstadt"
}

class UnderstatScraper:
    def __init__(self, db):
        """
        db: Instance dari SupabaseDB
        """
        self.db = db
        self.fetcher = Fetcher()

    def clean_name(self, name):
        """
        Membersihkan nama tim untuk pencocokan cadangan (fuzzy matching)
        """
        name = name.lower()
        for suffix in [" fc", " afc", " cf", " cfc", " club", " de", " profiles", " profile"]:
            name = name.replace(suffix, "")
        return name.strip()

    def find_matching_understat_name(self, api_name, understat_names):
        """
        Mencocokkan nama klub dari API dengan daftar nama dari Understat.
        Menggunakan TEAM_MAPPING dulu, lalu exact matching, lalu fuzzy matching.
        """
        # 1. Coba mapping manual/statis
        if api_name in TEAM_MAPPING:
            mapped_name = TEAM_MAPPING[api_name]
            if mapped_name in understat_names:
                return mapped_name

        # 2. Coba exact matching setelah pembersihan nama
        cleaned_api = self.clean_name(api_name)
        for u_name in understat_names:
            if self.clean_name(u_name) == cleaned_api:
                return u_name

        # 3. Fallback: Fuzzy matching menggunakan difflib
        best_match = None
        highest_ratio = 0.0
        for u_name in understat_names:
            ratio = SequenceMatcher(None, cleaned_api, self.clean_name(u_name)).ratio()
            if ratio > highest_ratio:
                highest_ratio = ratio
                best_match = u_name

        if highest_ratio > 0.65:
            return best_match

        return None

    def scrape_and_update_xg(self, league_code, season_year):
        """
        Mengambil data xG dan statistik detail dari Understat dan menyimpannya ke Supabase untuk liga & musim tertentu.
        """
        understat_league = LEAGUE_MAP.get(league_code)
        if not understat_league:
            print(f"Liga {league_code} tidak didukung oleh Understat Scraper. Lewati...")
            return

        url = f"https://understat.com/league/{understat_league}/{season_year}"
        print(f"Memulai scraping Understat: {url}")

        try:
            response = self.fetcher.get(url)
            html = response.text
        except Exception as e:
            print(f"Gagal mengambil halaman Understat {url}: {e}")
            return

        # Ekstrak data matches (datesData) dari Javascript script tag
        matches_match = re.search(r"var datesData\s*=\s*JSON\.parse\('([^']+)'\)", html)
        if not matches_match:
            print(f"Gagal menemukan datesData di HTML halaman {url}.")
            return

        escaped_json = matches_match.group(1)
        try:
            # Unescape hex string (misal: \x5B -> [)
            bytes_str = escaped_json.encode('ascii')
            decoded_bytes, _ = codecs.escape_decode(bytes_str)
            json_str = decoded_bytes.decode('utf-8')
            understat_matches = json.loads(json_str)
        except Exception as e:
            print(f"Gagal men-decode JSON datesData dari Understat: {e}")
            return

        # Ekstrak data detail tim (teamsData) secara aman (Regex Safety)
        teams_data = {}
        try:
            teams_match = re.search(r"var teamsData\s*=\s*JSON\.parse\('([^']+)'\)", html)
            if teams_match:
                escaped_teams_json = teams_match.group(1)
                bytes_teams_str = escaped_teams_json.encode('ascii')
                decoded_teams_bytes, _ = codecs.escape_decode(bytes_teams_str)
                teams_json_str = decoded_teams_bytes.decode('utf-8')
                teams_data = json.loads(teams_json_str)
                print(f"Berhasil mengekstrak data tim taktis (teamsData) dari Understat.")
            else:
                print("WARNING: Gagal menemukan teamsData di HTML Understat. Beberapa statistik detail akan diabaikan.")
        except Exception as e:
            print(f"WARNING: Error saat mengekstrak teamsData dari Understat: {e}. Melanjutkan tanpa statistik detail.")

        print(f"Berhasil memuat {len(understat_matches)} pertandingan dari Understat.")

        # Ambil daftar nama unik klub dari Understat
        understat_teams = set()
        for um in understat_matches:
            understat_teams.add(um["h"]["title"])
            understat_teams.add(um["a"]["title"])

        # Ambil daftar pertandingan & tim dari Supabase DB kita
        # Ambil tim dari DB untuk membangun pemetaan nama
        supabase_teams = self.db.client.table("teams").select("id, name").eq("league", league_code).execute().data
        if not supabase_teams:
            print(f"Tabel teams kosong di Supabase untuk liga {league_code}. Jalankan pipeline API terlebih dahulu!")
            return

        # Bangun pemetaan ID Tim Supabase -> Nama Tim Understat
        team_id_to_understat = {}
        for t in supabase_teams:
            u_name = self.find_matching_understat_name(t["name"], understat_teams)
            if u_name:
                team_id_to_understat[t["id"]] = u_name
            else:
                print(f"  [!] Gagal mencocokkan tim DB '{t['name']}' dengan tim Understat mana pun.")

        # Ambil matches FINISHED dari Supabase untuk di-update xG & stats detailnya
        db_matches = self.db.client.table("matches") \
            .select("id, home_team_id, away_team_id, home_xg, away_xg, home_shots, away_shots, home_shots_on_target, away_shots_on_target, home_deep, away_deep, home_ppda, away_ppda") \
            .eq("league", league_code) \
            .eq("status", "FINISHED") \
            .execute().data

        if not db_matches:
            print(f"Tidak ada pertandingan FINISHED di database untuk liga {league_code}.")
            return

        # Indexing matches dari teamsData untuk pencarian cepat: match_id -> stats dict
        match_stats = {}
        if teams_data:
            try:
                for team_id, team_info in teams_data.items():
                    for m_history in team_info.get("history", []):
                        mid = m_history.get("id")
                        is_home = m_history.get("h_a") == "h"
                        prefix = "home_" if is_home else "away_"
                        
                        if mid not in match_stats:
                            match_stats[mid] = {}
                            
                        # Konversi data ke tipe data integer/float
                        match_stats[mid][prefix + "shots"] = int(m_history.get("shots", 0))
                        match_stats[mid][prefix + "shots_on_target"] = int(m_history.get("shots_on_target", 0))
                        match_stats[mid][prefix + "deep"] = int(m_history.get("deep", 0))
                        
                        # PPDA = att / def (Semakin kecil = pressing semakin agresif)
                        ppda_info = m_history.get("ppda", {})
                        att = float(ppda_info.get("att", 0))
                        deff = float(ppda_info.get("def", 0))
                        match_stats[mid][prefix + "ppda"] = round(att / deff, 2) if deff > 0 else 0.0
            except Exception as e:
                print(f"WARNING: Gagal memproses statistik detail dari teamsData: {e}")

        # Indexing matches dari Understat untuk pencarian cepat: (home_team, away_team) -> xG & detail data
        understat_index = {}
        for um in understat_matches:
            if not um.get("isResult", False):
                continue
            home_title = um["h"]["title"]
            away_title = um["a"]["title"]
            mid = um["id"]
            
            # Format xG di Understat bertipe string, kita ubah ke float
            home_xg = float(um["xG"]["h"]) if um.get("xG", {}).get("h") else None
            away_xg = float(um["xG"]["a"]) if um.get("xG", {}).get("a") else None
            
            stats = {
                "home_xg": round(home_xg, 2) if home_xg is not None else None,
                "away_xg": round(away_xg, 2) if away_xg is not None else None,
            }
            
            # Hubungkan dengan detail stats dari teamsData
            if mid in match_stats:
                stats.update(match_stats[mid])
                
            understat_index[(home_title, away_title)] = stats

        # Proses update xG & detail stats ke Supabase
        update_count = 0
        for m in db_matches:
            u_home = team_id_to_understat.get(m["home_team_id"])
            u_away = team_id_to_understat.get(m["away_team_id"])

            if not u_home or not u_away:
                continue

            # Cari data stats di Understat index
            stats_data = understat_index.get((u_home, u_away))
            if stats_data:
                payload = {}
                for col in [
                    "home_xg", "away_xg", 
                    "home_shots", "away_shots", 
                    "home_shots_on_target", "away_shots_on_target", 
                    "home_deep", "away_deep", 
                    "home_ppda", "away_ppda"
                ]:
                    val = stats_data.get(col)
                    # Bandingkan dengan data saat ini di DB, jika berbeda masukkan ke payload
                    if m.get(col) != val:
                        payload[col] = val

                if payload:
                    self.db.update_match_stats(m["id"], payload)
                    update_count += 1

        print(f"Selesai memproses liga {league_code}. Berhasil memperbarui {update_count} data statistik di Supabase.")
