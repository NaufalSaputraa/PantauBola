export interface Team {
  id: number;
  name: string;
  logo_url: string;
  league: string;
  created_at?: string;
}

export interface Standing {
  id: number;
  team_id: number;
  league: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  points: number;
  updated_at: string;
  teams?: Team; // Hubungan join Supabase
}

export interface Match {
  id: number;
  home_team_id: number;
  away_team_id: number;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';
  league: string;
  matchday: number;
  created_at?: string;
  home_team?: Team; // Hubungan join Supabase
  away_team?: Team; // Hubungan join Supabase
  home_xg?: number | null;
  away_xg?: number | null;
  ai_predictions?: AIPrediction | null; // Hubungan join Supabase
}

export interface AIPrediction {
  id: number;
  match_id: number;
  home_prob: number;
  draw_prob: number;
  away_prob: number;
  predicted_home_score: number;
  predicted_away_score: number;
  analysis_text: string;
  key_factors: string[];
  updated_at: string;
}

export const LEAGUE_NAMES: Record<string, string> = {
  PL: 'Premier League',
  PD: 'La Liga',
  SA: 'Serie A',
  BL1: 'Bundesliga',
  CL: 'Champions League',
};
