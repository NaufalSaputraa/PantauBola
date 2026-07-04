import unittest
from pipeline.poisson import calculate_poisson_probabilities

class TestPoissonModel(unittest.TestCase):
    def test_fallback_with_insufficient_data(self):
        # Data pertandingan selesai kurang dari 10, harus pakai fallback
        result = calculate_poisson_probabilities(1, 2, [])
        self.assertEqual(result["home_prob"], 45.0)
        self.assertEqual(result["draw_prob"], 27.0)
        self.assertEqual(result["away_prob"], 28.0)
        self.assertEqual(result["predicted_home_score"], 1)
        self.assertEqual(result["predicted_away_score"], 1)

    def test_probability_distribution(self):
        # Siapkan 12 dummy match data agar lolos batas minimal 10 laga
        dummy_matches = [
            {"home_team_id": 1, "away_team_id": 2, "home_score": 3, "away_score": 0, "home_xg": 2.50, "away_xg": 0.50},
            {"home_team_id": 1, "away_team_id": 3, "home_score": 2, "away_score": 1, "home_xg": 1.80, "away_xg": 1.10},
            {"home_team_id": 4, "away_team_id": 2, "home_score": 1, "away_score": 2, "home_xg": 0.90, "away_xg": 1.90},
            {"home_team_id": 2, "away_team_id": 1, "home_score": 0, "away_score": 2, "home_xg": 0.40, "away_xg": 2.10},
            {"home_team_id": 3, "away_team_id": 4, "home_score": 1, "away_score": 1, "home_xg": 1.20, "away_xg": 1.20},
            {"home_team_id": 1, "away_team_id": 4, "home_score": 4, "away_score": 0, "home_xg": 3.10, "away_xg": 0.20},
            {"home_team_id": 2, "away_team_id": 3, "home_score": 0, "away_score": 0, "home_xg": 0.50, "away_xg": 0.60},
            {"home_team_id": 4, "away_team_id": 1, "home_score": 1, "away_score": 3, "home_xg": 1.00, "away_xg": 2.80},
            {"home_team_id": 3, "away_team_id": 2, "home_score": 2, "away_score": 1, "home_xg": 1.70, "away_xg": 1.00},
            {"home_team_id": 2, "away_team_id": 4, "home_score": 1, "away_score": 1, "home_xg": 1.10, "away_xg": 1.30},
            {"home_team_id": 1, "away_team_id": 2, "home_score": 3, "away_score": 1, "home_xg": 2.40, "away_xg": 0.90},
            {"home_team_id": 3, "away_team_id": 1, "home_score": 0, "away_score": 2, "home_xg": 0.80, "away_xg": 1.90},
        ]

        result = calculate_poisson_probabilities(1, 2, dummy_matches)
        
        # Jumlah total probabilitas harus persis 100%
        total_prob = result["home_prob"] + result["draw_prob"] + result["away_prob"]
        self.assertAlmostEqual(total_prob, 100.0, places=1)
        
        # Karena Tim 1 secara historis sangat kuat (sering menang & xG tinggi),
        # peluang Tim 1 menang kandang (home_prob) harus lebih besar dari away_prob
        self.assertTrue(result["home_prob"] > result["away_prob"])
        
        # Cek tipe data
        self.assertIsInstance(result["predicted_home_score"], int)
        self.assertIsInstance(result["predicted_away_score"], int)

if __name__ == "__main__":
    unittest.main()
