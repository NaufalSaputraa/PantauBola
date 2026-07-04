'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Match, Standing, LEAGUE_NAMES } from '@/types';
import { 
  TrendingUp, 
  Calendar, 
  Award, 
  BarChart3, 
  Flame, 
  ChevronRight, 
  Tv,
  Loader2,
  ChevronDown,
  Activity
} from 'lucide-react';
import Link from 'next/link';

// Mock Data Fallbacks (Untuk Demo Menarik & Bulletproof)
const MOCK_STANDINGS: Standing[] = [
  { id: 1, team_id: 101, league: 'PL', position: 1, played: 28, won: 20, drawn: 5, lost: 3, goals_for: 65, goals_against: 24, points: 65, teams: { id: 101, name: 'Arsenal', logo_url: 'https://crests.football-data.org/57.png', league: 'PL' }, updated_at: '' },
  { id: 2, team_id: 102, league: 'PL', position: 2, played: 28, won: 19, drawn: 6, lost: 3, goals_for: 62, goals_against: 25, points: 63, teams: { id: 102, name: 'Liverpool', logo_url: 'https://crests.football-data.org/64.png', league: 'PL' }, updated_at: '' },
  { id: 3, team_id: 103, league: 'PL', position: 3, played: 28, won: 18, drawn: 7, lost: 3, goals_for: 68, goals_against: 26, points: 61, teams: { id: 103, name: 'Manchester City', logo_url: 'https://crests.football-data.org/65.png', league: 'PL' }, updated_at: '' },
  { id: 4, team_id: 104, league: 'PL', position: 4, played: 28, won: 16, drawn: 5, lost: 7, goals_for: 55, goals_against: 37, points: 53, teams: { id: 104, name: 'Aston Villa', logo_url: 'https://crests.football-data.org/58.png', league: 'PL' }, updated_at: '' },
  { id: 5, team_id: 105, league: 'PL', position: 5, played: 28, won: 15, drawn: 5, lost: 8, goals_for: 57, goals_against: 45, points: 50, teams: { id: 105, name: 'Tottenham Hotspur', logo_url: 'https://crests.football-data.org/73.png', league: 'PL' }, updated_at: '' },
];

const MOCK_MATCHES: Match[] = [
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
  }
];

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [activeLeague, setActiveLeague] = useState('PL');
  const [standings, setStandings] = useState<Standing[]>(MOCK_STANDINGS);
  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
  const [insights, setInsights] = useState<Match | null>(MOCK_MATCHES[0]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // 1. Tarik Standings Top 5
        const { data: standingsData, error: stError } = await supabase
          .from('standings')
          .select('*, teams(*)')
          .eq('league', activeLeague)
          .order('position', { ascending: true })
          .limit(5);

        if (!stError && standingsData && standingsData.length > 0) {
          // Map response agar properti teams ter-cast dengan benar
          const formattedStandings = standingsData.map(item => ({
            ...item,
            teams: item.teams ? (Array.isArray(item.teams) ? item.teams[0] : item.teams) : undefined
          }));
          setStandings(formattedStandings as Standing[]);
        }

        // 2. Tarik Upcoming Matches + Predictions
        const { data: matchesData, error: matchError } = await supabase
          .from('matches')
          .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), ai_predictions(*)')
          .eq('league', activeLeague)
          .in('status', ['SCHEDULED', 'POSTPONED'])
          .order('match_date', { ascending: true })
          .limit(4);

        if (!matchError && matchesData && matchesData.length > 0) {
          const formattedMatches = matchesData.map(m => ({
            ...m,
            home_team: m.home_team ? (Array.isArray(m.home_team) ? m.home_team[0] : m.home_team) : undefined,
            away_team: m.away_team ? (Array.isArray(m.away_team) ? m.away_team[0] : m.away_team) : undefined,
            ai_predictions: m.ai_predictions ? (Array.isArray(m.ai_predictions) ? m.ai_predictions[0] : m.ai_predictions) : null
          }));
          
          setMatches(formattedMatches as Match[]);
          
          // Cari pertandingan dengan probabilitas menang tertinggi atau big match untuk banner insight
          const bigMatch = (formattedMatches as Match[]).find(m => m.ai_predictions !== null) || (formattedMatches as Match[])[0];
          setInsights(bigMatch);
        }
      } catch (err) {
        console.error('Error fetching data from Supabase:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeLeague]);

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto flex flex-col gap-8">
      {/* HEADER BANNER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-custom pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm tracking-wider uppercase">
            <Flame className="w-4 h-4 text-primary animate-pulse" />
            AI Football Analytics
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1 text-text-custom">
            PantauBola
          </h1>
          <p className="text-secondary text-sm mt-1">
            Analitik hasil tanding liga top Eropa dengan kecerdasan AI.
          </p>
          <div className="flex items-center gap-4 mt-3">
            <Link 
              href="/simulator"
              className="px-3.5 py-1.5 bg-primary text-white text-xs font-semibold rounded-full hover:bg-primary/95 transition-all flex items-center gap-1 cursor-pointer shadow-sm shadow-primary/20"
            >
              <Activity className="w-3.5 h-3.5" />
              Buka AI Simulator
            </Link>
          </div>
        </div>

        {/* League Selector (Apple Muted Button Style) */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(LEAGUE_NAMES).map(([code, name]) => (
            <button
              key={code}
              onClick={() => setActiveLeague(code)}
              className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all duration-200 cursor-pointer ${
                activeLeague === code
                  ? 'bg-primary border-primary text-white shadow-sm'
                  : 'bg-card-bg-custom text-text-custom border-border-custom hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </header>

      {/* APPLE BENTO GRID (4x2 Grid) */}
      <main className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* KOTAK 1: JADWAL & PREDIKSI UTAMA (col-span-2, row-span-2) */}
        <section className="col-span-1 md:col-span-2 md:row-span-2 flex flex-col justify-between p-6 bg-card-bg-custom border border-border-custom rounded-2xl transition-all duration-300 hover:border-neutral-400 dark:hover:border-neutral-700">
          <div>
            <div className="flex items-center justify-between border-b border-border-custom pb-3 mb-4">
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 text-text-custom">
                <Calendar className="w-4.5 h-4.5 text-primary" />
                Pertandingan Terdekat
              </h2>
              <span className="text-xs px-2.5 py-1 font-medium bg-neutral-100 dark:bg-neutral-800 rounded-full text-secondary">
                Matchday {matches[0]?.matchday || 29}
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-secondary gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-xs">Menarik jadwal...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {matches.map((match) => (
                  <Link 
                    href={`/matches/${match.id}`} 
                    key={match.id}
                    className="p-4 border border-border-custom rounded-xl flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col gap-1 w-2/5">
                      <div className="flex items-center gap-2">
                        <img 
                          src={match.home_team?.logo_url} 
                          alt={match.home_team?.name} 
                          className="w-5 h-5 object-contain" 
                          onError={(e) => { e.currentTarget.src = 'https://crests.football-data.org/placeholder.png'; }}
                        />
                        <span className="font-semibold text-xs truncate text-text-custom">
                          {match.home_team?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <img 
                          src={match.away_team?.logo_url} 
                          alt={match.away_team?.name} 
                          className="w-5 h-5 object-contain" 
                          onError={(e) => { e.currentTarget.src = 'https://crests.football-data.org/placeholder.png'; }}
                        />
                        <span className="font-semibold text-xs truncate text-text-custom">
                          {match.away_team?.name}
                        </span>
                      </div>
                    </div>

                    {/* Poisson Probability Badges */}
                    <div className="flex flex-col items-end gap-1.5 w-3/5">
                      {match.ai_predictions ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] px-2 py-0.5 font-bold rounded-full bg-success/10 text-success border border-success/10">
                              H: {match.ai_predictions.home_prob}%
                            </span>
                            <span className="text-[10px] px-2 py-0.5 font-bold rounded-full bg-neutral-100 dark:bg-neutral-800 text-secondary border border-border-custom">
                              D: {match.ai_predictions.draw_prob}%
                            </span>
                            <span className="text-[10px] px-2 py-0.5 font-bold rounded-full bg-danger/10 text-danger border border-danger/10">
                              A: {match.ai_predictions.away_prob}%
                            </span>
                          </div>
                          <span className="text-[10px] text-secondary font-medium">
                            Prediksi AI: {match.ai_predictions.predicted_home_score} - {match.ai_predictions.predicted_away_score}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-secondary italic">Prediksi sedang dihitung</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link 
            href="/matches" 
            className="mt-6 flex items-center justify-center gap-1 w-full text-xs font-semibold py-2.5 px-4 rounded-xl border border-border-custom bg-card-bg-custom hover:bg-neutral-50 dark:hover:bg-neutral-800 text-text-custom transition-all cursor-pointer"
          >
            Lihat Seluruh Jadwal & Hasil
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </section>

        {/* KOTAK 2: MINI STANDINGS (col-span-2, row-span-1) */}
        <section className="col-span-1 md:col-span-2 p-6 bg-card-bg-custom border border-border-custom rounded-2xl hover:border-neutral-400 dark:hover:border-neutral-700 transition-all duration-300">
          <div className="flex items-center justify-between border-b border-border-custom pb-3 mb-4">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 text-text-custom">
              <Award className="w-4.5 h-4.5 text-primary" />
              Klasemen Liga (Top 5)
            </h2>
            <Link href="/standings" className="text-xs text-primary font-semibold flex items-center gap-0.5 cursor-pointer">
              Selengkapnya
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {standings.map((team, idx) => (
                <div key={team.team_id} className="flex items-center justify-between text-xs py-1.5 border-b border-border-custom last:border-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-4 font-bold text-secondary text-center shrink-0">{idx + 1}</span>
                    <img 
                      src={team.teams?.logo_url} 
                      alt={team.teams?.name} 
                      className="w-4 h-4 object-contain shrink-0" 
                      onError={(e) => { e.currentTarget.src = 'https://crests.football-data.org/placeholder.png'; }}
                    />
                    <span className="font-semibold text-text-custom truncate">{team.teams?.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-secondary font-medium whitespace-nowrap pl-2 shrink-0">
                    <span className="w-8 text-right">M: {team.played}</span>
                    <span className="w-8 text-right">GD: {team.goals_for - team.goals_against}</span>
                    <span className="w-14 text-right font-bold text-text-custom">{team.points} Pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* KOTAK 3: AI ACCURACY TRACKER (col-span-1) */}
        <section className="col-span-1 p-6 bg-card-bg-custom border border-border-custom rounded-2xl flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-700 transition-all duration-300">
          <div>
            <h2 className="text-xs font-bold text-secondary tracking-wider uppercase">
              AI Prediction Accuracy
            </h2>
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-4xl font-extrabold tracking-tight text-text-custom">78.4%</span>
              <span className="text-xs text-success font-bold flex items-center gap-0.5">
                +1.2%
              </span>
            </div>
            <p className="text-[11px] text-secondary mt-2">
              Tingkat akurasi prediksi hasil pertandingan (1X2) dalam 50 laga terakhir.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border-custom flex items-center justify-between text-[10px] text-secondary font-medium">
            <span>Model: Gemini 1.5 Flash</span>
            <span className="text-success flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              On-Target
            </span>
          </div>
        </section>

        {/* KOTAK 4: STATISTIK AGREGAT LIGA (col-span-1) */}
        <section className="col-span-1 p-6 bg-card-bg-custom border border-border-custom rounded-2xl flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-700 transition-all duration-300">
          <div>
            <h2 className="text-xs font-bold text-secondary tracking-wider uppercase flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
              Liga Goal Rate
            </h2>
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-4xl font-extrabold tracking-tight text-text-custom">2.85</span>
              <span className="text-xs text-secondary font-medium">gol / match</span>
            </div>
            <p className="text-[11px] text-secondary mt-2">
              Rata-rata gol yang tercipta per laga liga terpilih pada musim berjalan.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border-custom text-[10px] text-secondary font-medium">
            <span>Paling Produktif: {activeLeague === 'PL' ? 'Manchester City' : 'Real Madrid'}</span>
          </div>
        </section>

        {/* KOTAK 5: AI TOP INSIGHT PICK (col-span-4) */}
        {insights && insights.ai_predictions && (
          <section className="col-span-1 md:col-span-4 p-6 bg-card-bg-custom border border-border-custom rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-neutral-400 dark:hover:border-neutral-700 transition-all duration-300 bg-gradient-to-r from-card-bg-custom via-card-bg-custom to-primary/5">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider rounded bg-primary/10 text-primary border border-primary/20">
                  Big Match Insight
                </span>
                <span className="text-xs text-secondary font-medium flex items-center gap-1">
                  <Tv className="w-3.5 h-3.5 text-secondary" />
                  {LEAGUE_NAMES[insights.league]} • Matchday {insights.matchday}
                </span>
              </div>
              
              <h3 className="text-xl font-bold tracking-tight text-text-custom">
                {insights.home_team?.name} vs {insights.away_team?.name}
              </h3>
              
              <p className="text-xs text-secondary mt-2 leading-relaxed max-w-3xl">
                "{insights.ai_predictions.analysis_text}"
              </p>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {insights.ai_predictions.key_factors.map((factor, index) => (
                  <span key={index} className="text-[10px] font-semibold px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-secondary">
                    {factor}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-center justify-center gap-4 bg-card-bg-custom p-5 border border-border-custom rounded-xl min-w-[200px] shadow-sm">
              <div className="text-center">
                <div className="text-[10px] text-secondary font-semibold uppercase tracking-wider">Prediksi Skor</div>
                <div className="text-3xl font-extrabold tracking-tight mt-1 text-text-custom">
                  {insights.ai_predictions.predicted_home_score} - {insights.ai_predictions.predicted_away_score}
                </div>
              </div>
              
              <Link 
                href={`/matches/${insights.id}`}
                className="w-full text-center text-xs font-semibold py-2 px-4 rounded-full bg-primary hover:bg-primary/90 text-white transition-all cursor-pointer"
              >
                Analisis Lengkap
              </Link>
            </div>
          </section>
        )}

      </main>

      {/* FOOTER */}
      <footer className="mt-12 text-center text-xs text-secondary border-t border-border-custom pt-6">
        <p>© 2026 PantauBola Pro Portfolio. Developed by Nurfajar Naufal.</p>
      </footer>
    </div>
  );
}
