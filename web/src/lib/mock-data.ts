import { Match, Standing } from '@/types';

export const MOCK_STANDINGS: Standing[] = [
  { id: 1, team_id: 101, league: 'PL', position: 1, played: 28, won: 20, drawn: 5, lost: 3, goals_for: 65, goals_against: 24, points: 65, teams: { id: 101, name: 'Arsenal', logo_url: 'https://crests.football-data.org/57.png', league: 'PL' }, updated_at: '' },
  { id: 2, team_id: 102, league: 'PL', position: 2, played: 28, won: 19, drawn: 6, lost: 3, goals_for: 62, goals_against: 25, points: 63, teams: { id: 102, name: 'Liverpool', logo_url: 'https://crests.football-data.org/64.png', league: 'PL' }, updated_at: '' },
  { id: 3, team_id: 103, league: 'PL', position: 3, played: 28, won: 18, drawn: 7, lost: 3, goals_for: 68, goals_against: 26, points: 61, teams: { id: 103, name: 'Manchester City', logo_url: 'https://crests.football-data.org/65.png', league: 'PL' }, updated_at: '' },
  { id: 4, team_id: 104, league: 'PL', position: 4, played: 28, won: 16, drawn: 5, lost: 7, goals_for: 55, goals_against: 37, points: 53, teams: { id: 104, name: 'Aston Villa', logo_url: 'https://crests.football-data.org/58.png', league: 'PL' }, updated_at: '' },
  { id: 5, team_id: 105, league: 'PL', position: 5, played: 28, won: 15, drawn: 5, lost: 8, goals_for: 57, goals_against: 45, points: 50, teams: { id: 105, name: 'Tottenham Hotspur', logo_url: 'https://crests.football-data.org/73.png', league: 'PL' }, updated_at: '' },
  { id: 6, team_id: 106, league: 'PL', position: 6, played: 28, won: 14, drawn: 5, lost: 9, goals_for: 52, goals_against: 39, points: 47, teams: { id: 106, name: 'Manchester United', logo_url: 'https://crests.football-data.org/66.png', league: 'PL' }, updated_at: '' },
  { id: 7, team_id: 107, league: 'PL', position: 7, played: 28, won: 13, drawn: 4, lost: 11, goals_for: 48, goals_against: 43, points: 43, teams: { id: 107, name: 'West Ham United', logo_url: 'https://crests.football-data.org/563.png', league: 'PL' }, updated_at: '' },
  { id: 8, team_id: 108, league: 'PL', position: 8, played: 28, won: 12, drawn: 6, lost: 10, goals_for: 45, goals_against: 44, points: 42, teams: { id: 108, name: 'Brighton & Hove Albion', logo_url: 'https://crests.football-data.org/397.png', league: 'PL' }, updated_at: '' },
];

export const MOCK_MATCHES: Match[] = [
  {
    id: 4001,
    home_team_id: 101,
    away_team_id: 103,
    match_date: new Date(Date.now() + 86400000 * 2).toISOString(), // Besok lusa
    home_score: null,
    away_score: null,
    status: 'SCHEDULED',
    league: 'PL',
    matchday: 29,
    home_team: { id: 101, name: 'Arsenal', logo_url: 'https://crests.football-data.org/57.png', league: 'PL' },
    away_team: { id: 103, name: 'Manchester City', logo_url: 'https://crests.football-data.org/65.png', league: 'PL' },
    home_xg: 1.84,
    away_xg: 1.12,
    home_shots: 14,
    away_shots: 8,
    home_shots_on_target: 6,
    away_shots_on_target: 3,
    home_deep: 10,
    away_deep: 5,
    home_ppda: 8.50,
    away_ppda: 12.30,
    ai_predictions: {
      id: 501,
      match_id: 4001,
      home_prob: 45.5,
      draw_prob: 28.3,
      away_prob: 26.2,
      predicted_home_score: 2,
      predicted_away_score: 1,
      analysis_text: 'Arsenal sedang on-fire di kandang dengan pertahanan rapat. Man City andalkan build-up rapi tapi rawan counter-attack.',
      key_factors: ['Dominasi lini tengah', 'Counter-attack cepat', 'Faktor kandang Emirates'],
      updated_at: ''
    }
  },
  {
    id: 4002,
    home_team_id: 102,
    away_team_id: 105,
    match_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    home_score: null,
    away_score: null,
    status: 'SCHEDULED',
    league: 'PL',
    matchday: 29,
    home_team: { id: 102, name: 'Liverpool', logo_url: 'https://crests.football-data.org/64.png', league: 'PL' },
    away_team: { id: 105, name: 'Tottenham Hotspur', logo_url: 'https://crests.football-data.org/73.png', league: 'PL' },
    home_xg: 2.10,
    away_xg: 1.45,
    home_shots: 18,
    away_shots: 11,
    home_shots_on_target: 7,
    away_shots_on_target: 5,
    home_deep: 12,
    away_deep: 7,
    home_ppda: 9.10,
    away_ppda: 10.80,
    ai_predictions: {
      id: 502,
      match_id: 4002,
      home_prob: 52.1,
      draw_prob: 22.4,
      away_prob: 25.5,
      predicted_home_score: 3,
      predicted_away_score: 2,
      analysis_text: 'Jalannya laga bakal terbuka dan sengit. Lini serang Liverpool sangat produktif tapi Spurs punya transisi menyerang mematikan.',
      key_factors: ['High-pressing ketat', 'Efektivitas finishing', 'Transisi serangan balik'],
      updated_at: ''
    }
  },
  {
    id: 4003,
    home_team_id: 106,
    away_team_id: 104,
    match_date: new Date(Date.now() - 86400000).toISOString(), // Kemarin
    home_score: 2,
    away_score: 1,
    status: 'FINISHED',
    league: 'PL',
    matchday: 28,
    home_team: { id: 106, name: 'Manchester United', logo_url: 'https://crests.football-data.org/66.png', league: 'PL' },
    away_team: { id: 104, name: 'Aston Villa', logo_url: 'https://crests.football-data.org/58.png', league: 'PL' },
    home_xg: 1.24,
    away_xg: 1.65,
    home_shots: 10,
    away_shots: 13,
    home_shots_on_target: 4,
    away_shots_on_target: 6,
    home_deep: 6,
    away_deep: 9,
    home_ppda: 11.20,
    away_ppda: 9.80,
    ai_predictions: null
  }
];

export function getMockMatchDetail(id: string): Match {
  const matchId = parseInt(id);
  const found = MOCK_MATCHES.find(m => m.id === matchId);
  if (found) return found;

  return {
    ...MOCK_MATCHES[0],
    id: matchId || 4001,
    ai_predictions: MOCK_MATCHES[0].ai_predictions ? {
      ...MOCK_MATCHES[0].ai_predictions,
      match_id: matchId || 4001
    } : null
  };
}
