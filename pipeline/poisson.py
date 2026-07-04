import math
from scipy.stats import poisson

def calculate_poisson_probabilities(home_team_id, away_team_id, finished_matches):
    """
    Menghitung probabilitas hasil pertandingan (1X2) dan prediksi skor menggunakan Distribusi Poisson.
    
    home_team_id: int
    away_team_id: int
    finished_matches: list of dict berisi hasil laga yang sudah selesai (matches dari DB)
    
    return: dict {
        "home_prob": float, (persen)
        "draw_prob": float, (persen)
        "away_prob": float, (persen)
        "predicted_home_score": int,
        "predicted_away_score": int
    }
    """
    # 1. Jika tidak ada data laga selesai, gunakan default statistik liga sepak bola Eropa (rata-rata gol 1.5 home, 1.2 away)
    if len(finished_matches) < 10:
        return {
            "home_prob": 45.0,
            "draw_prob": 27.0,
            "away_prob": 28.0,
            "predicted_home_score": 1,
            "predicted_away_score": 1
        }

    # Hitung total expected goals/gol dan rata-rata liga
    total_home_val = 0.0
    total_away_val = 0.0
    num_matches = len(finished_matches)

    for m in finished_matches:
        total_home_val += m.get("home_xg") if m.get("home_xg") is not None else (m.get("home_score") or 0)
        total_away_val += m.get("away_xg") if m.get("away_xg") is not None else (m.get("away_score") or 0)

    avg_league_home_goals = total_home_val / num_matches
    avg_league_away_goals = total_away_val / num_matches

    # 2. Hitung statistik untuk masing-masing tim
    # Statistik Home Team (saat bermain di kandang)
    home_matches_played = 0
    home_goals_scored = 0.0
    home_goals_conceded = 0.0

    # Statistik Away Team (saat bermain di tandang)
    away_matches_played = 0
    away_goals_scored = 0.0
    away_goals_conceded = 0.0

    for m in finished_matches:
        home_val = m.get("home_xg") if m.get("home_xg") is not None else (m.get("home_score") or 0)
        away_val = m.get("away_xg") if m.get("away_xg") is not None else (m.get("away_score") or 0)

        # Cari laga kandang Home Team
        if m.get("home_team_id") == home_team_id:
            home_matches_played += 1
            home_goals_scored += home_val
            home_goals_conceded += away_val
            
        # Cari laga tandang Away Team
        if m.get("away_team_id") == away_team_id:
            away_matches_played += 1
            away_goals_scored += away_val
            away_goals_conceded += home_val

    # Fallback jika tim belum bermain kandang/tandang (misal awal musim)
    avg_home_scored = (home_goals_scored / home_matches_played) if home_matches_played > 0 else avg_league_home_goals
    avg_home_conceded = (home_goals_conceded / home_matches_played) if home_matches_played > 0 else avg_league_away_goals
    
    avg_away_scored = (away_goals_scored / away_matches_played) if away_matches_played > 0 else avg_league_away_goals
    avg_away_conceded = (away_goals_conceded / away_matches_played) if away_matches_played > 0 else avg_league_home_goals

    # 3. Hitung Attack & Defense Strength
    # Home Team Attack Strength & Defense Strength
    home_attack_strength = avg_home_scored / avg_league_home_goals if avg_league_home_goals > 0 else 1.0
    home_defense_strength = avg_home_conceded / avg_league_away_goals if avg_league_away_goals > 0 else 1.0

    # Away Team Attack Strength & Defense Strength
    away_attack_strength = avg_away_scored / avg_league_away_goals if avg_league_away_goals > 0 else 1.0
    away_defense_strength = avg_away_conceded / avg_league_home_goals if avg_league_home_goals > 0 else 1.0

    # 4. Hitung Ekspektasi Gol (Lambda) untuk pertandingan ini
    lambda_home = home_attack_strength * away_defense_strength * avg_league_home_goals
    lambda_away = away_attack_strength * home_defense_strength * avg_league_away_goals

    # Batasi nilai lambda minimal 0.2 agar tidak mematikan peluang gol sama sekali
    lambda_home = max(0.2, lambda_home)
    lambda_away = max(0.2, lambda_away)

    # 5. Hitung matriks probabilitas skor (0 hingga 5 gol)
    max_goals = 6
    home_win_prob = 0.0
    draw_prob = 0.0
    away_win_prob = 0.0

    max_p = -1.0
    pred_home = 1
    pred_away = 1

    for x in range(max_goals):
        p_x = poisson.pmf(x, lambda_home)
        for y in range(max_goals):
            p_y = poisson.pmf(y, lambda_away)
            p_xy = p_x * p_y

            # Akumulasi hasil probabilitas 1X2
            if x > y:
                home_win_prob += p_xy
            elif x == y:
                draw_prob += p_xy
            else:
                away_win_prob += p_xy

            # Cari skor dengan peluang tertinggi
            if p_xy > max_p:
                max_p = p_xy
                pred_home = x
                pred_away = y

    # Normalisasi agar total probabilitas persis 100%
    total = home_win_prob + draw_prob + away_win_prob
    if total > 0:
        home_win_prob = round((home_win_prob / total) * 100, 2)
        draw_prob = round((draw_prob / total) * 100, 2)
        away_win_prob = round((away_win_prob / total) * 100, 2)
    else:
        home_win_prob, draw_prob, away_win_prob = 33.33, 33.33, 33.34

    return {
        "home_prob": home_win_prob,
        "draw_prob": draw_prob,
        "away_prob": away_win_prob,
        "predicted_home_score": pred_home,
        "predicted_away_score": pred_away
    }
