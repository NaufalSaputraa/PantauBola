'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Team, Match } from '@/types';
import { 
  Flame, 
  HelpCircle, 
  ChevronLeft, 
  Play, 
  Sliders, 
  TrendingUp, 
  Activity, 
  Trophy,
  Info
} from 'lucide-react';
import Link from 'next/link';

// Helper Poisson: P(k; lambda) = (lambda^k * e^-lambda) / k!
function poissonPmf(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let factorial = 1;
  for (let i = 2; i <= k; i++) factorial *= i;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial;
}

export default function AISimulatorPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedHomeId, setSelectedHomeId] = useState<number | ''>('');
  const [selectedAwayId, setSelectedAwayId] = useState<number | ''>('');
  
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  
  // Simulated sliders (expected xG)
  const [homeXG, setHomeXG] = useState<number>(1.5);
  const [awayXG, setAwayXG] = useState<number>(1.2);
  
  // Historical stats for UI display
  const [homeStats, setHomeStats] = useState({ avgGoals: 1.5, avgXG: 1.5, matchesPlayed: 0 });
  const [awayStats, setAwayStats] = useState({ avgGoals: 1.2, avgXG: 1.2, matchesPlayed: 0 });
  
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);

  // Fetch all teams on mount
  useEffect(() => {
    async function fetchTeams() {
      try {
        setLoadingTeams(true);
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .order('name', { ascending: true });
        
        if (!error && data) {
          setTeams(data);
        }
      } catch (err) {
        console.error('Error fetching teams:', err);
      } finally {
        setLoadingTeams(false);
      }
    }
    fetchTeams();
  }, []);

  // Handle Home Team Selection
  useEffect(() => {
    if (selectedHomeId === '') {
      setHomeTeam(null);
      return;
    }
    const team = teams.find(t => t.id === Number(selectedHomeId)) || null;
    setHomeTeam(team);
    if (team) fetchHistoricalStats(team.id, true);
  }, [selectedHomeId, teams]);

  // Handle Away Team Selection
  useEffect(() => {
    if (selectedAwayId === '') {
      setAwayTeam(null);
      return;
    }
    const team = teams.find(t => t.id === Number(selectedAwayId)) || null;
    setAwayTeam(team);
    if (team) fetchHistoricalStats(team.id, false);
  }, [selectedAwayId, teams]);

  // Fetch historical averages for the selected team to set initial sliders
  async function fetchHistoricalStats(teamId: number, isHome: boolean) {
    try {
      setLoadingStats(true);
      const { data, error } = await supabase
        .from('matches')
        .select('home_team_id, away_team_id, home_score, away_score, home_xg, away_xg')
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .eq('status', 'FINISHED');

      if (!error && data) {
        let totalGoals = 0;
        let totalXG = 0;
        let xgCount = 0;
        let matchesCount = data.length;

        data.forEach((m: any) => {
          if (m.home_team_id === teamId) {
            totalGoals += m.home_score ?? 0;
            if (m.home_xg !== null && m.home_xg !== undefined) {
              totalXG += Number(m.home_xg);
              xgCount++;
            }
          } else {
            totalGoals += m.away_score ?? 0;
            if (m.away_xg !== null && m.away_xg !== undefined) {
              totalXG += Number(m.away_xg);
              xgCount++;
            }
          }
        });

        const avgGoals = matchesCount > 0 ? Number((totalGoals / matchesCount).toFixed(2)) : (isHome ? 1.50 : 1.20);
        const avgXG = xgCount > 0 ? Number((totalXG / xgCount).toFixed(2)) : (isHome ? 1.50 : 1.20);

        if (isHome) {
          setHomeStats({ avgGoals, avgXG, matchesPlayed: matchesCount });
          setHomeXG(avgXG); // Auto-initialize slider
        } else {
          setAwayStats({ avgGoals, avgXG, matchesPlayed: matchesCount });
          setAwayXG(avgXG); // Auto-initialize slider
        }
      }
    } catch (err) {
      console.error('Error fetching team stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }

  // Poisson Calculations (Client-Side)
  const maxGoals = 6;
  let homeWinProb = 0;
  let drawProb = 0;
  let awayWinProb = 0;
  let predictedHomeScore = 0;
  let predictedAwayScore = 0;
  let maxProbability = -1;
  const scoreGrid: number[][] = Array(maxGoals).fill(0).map(() => Array(maxGoals).fill(0));

  // Compute probabilities based on sliders
  for (let x = 0; x < maxGoals; x++) {
    const pX = poissonPmf(x, homeXG);
    for (let y = 0; y < maxGoals; y++) {
      const pY = poissonPmf(y, awayXG);
      const pXY = pX * pY;
      
      scoreGrid[x][y] = pXY;

      if (x > y) homeWinProb += pXY;
      else if (x === y) drawProb += pXY;
      else awayWinProb += pXY;

      if (pXY > maxProbability) {
        maxProbability = pXY;
        predictedHomeScore = x;
        predictedAwayScore = y;
      }
    }
  }

  const totalProb = homeWinProb + drawProb + awayWinProb;
  const homePercent = totalProb > 0 ? Math.round((homeWinProb / totalProb) * 100) : 33;
  const drawPercent = totalProb > 0 ? Math.round((drawProb / totalProb) * 100) : 34;
  const awayPercent = totalProb > 0 ? Math.round((awayWinProb / totalProb) * 100) : 33;

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-5xl mx-auto flex flex-col gap-8">
      {/* NAVIGATION HEADER */}
      <nav className="flex items-center gap-4">
        <Link 
          href="/" 
          className="p-2 border border-border-custom bg-card-bg-custom text-text-custom rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full font-bold uppercase flex items-center gap-1 w-fit">
            <Activity className="w-3 h-3 animate-pulse" />
            Interactive Tools
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-custom mt-1">
            AI Match Simulator (Poisson Model)
          </h1>
        </div>
      </nav>

      {/* CORE CONTROLS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PANEL 1: TEAM SELECTORS */}
        <section className="col-span-1 md:col-span-3 bg-card-bg-custom border border-border-custom rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Home Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider">Tim Kandang (Home)</label>
            <select
              value={selectedHomeId}
              onChange={(e) => setSelectedHomeId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-border-custom text-text-custom text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer font-medium"
            >
              <option value="">-- Pilih Tim Kandang --</option>
              {teams.filter(t => t.id !== Number(selectedAwayId)).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Away Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider">Tim Tandang (Away)</label>
            <select
              value={selectedAwayId}
              onChange={(e) => setSelectedAwayId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-border-custom text-text-custom text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer font-medium"
            >
              <option value="">-- Pilih Tim Tandang --</option>
              {teams.filter(t => t.id !== Number(selectedHomeId)).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </section>

        {homeTeam && awayTeam ? (
          <>
            {/* PANEL 2: SIMULATOR SLIDERS */}
            <section className="col-span-1 bg-card-bg-custom border border-border-custom rounded-2xl p-6 flex flex-col gap-6">
              <h3 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border-custom pb-3 mb-2">
                <Sliders className="w-4 h-4 text-primary" />
                Simulasi Parameter xG
              </h3>

              {/* Home Slider */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-text-custom truncate max-w-[140px]">{homeTeam.name}</span>
                  <span className="text-xs font-mono font-bold text-success px-2 py-0.5 bg-success/10 border border-success/20 rounded-md">
                    {homeXG.toFixed(2)} xG
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0.20" 
                  max="4.00" 
                  step="0.05" 
                  value={homeXG} 
                  onChange={(e) => setHomeXG(Number(e.target.value))}
                  className="w-full accent-success cursor-pointer h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg appearance-none"
                />
                <div className="text-[10px] text-secondary flex justify-between">
                  <span>Rata-rata Riil: {homeStats.avgXG.toFixed(2)} xG</span>
                  <span>Rata-rata Gol: {homeStats.avgGoals.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-border-custom my-1" />

              {/* Away Slider */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-text-custom truncate max-w-[140px]">{awayTeam.name}</span>
                  <span className="text-xs font-mono font-bold text-danger px-2 py-0.5 bg-danger/10 border border-danger/20 rounded-md">
                    {awayXG.toFixed(2)} xG
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0.20" 
                  max="4.00" 
                  step="0.05" 
                  value={awayXG} 
                  onChange={(e) => setAwayXG(Number(e.target.value))}
                  className="w-full accent-danger cursor-pointer h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg appearance-none"
                />
                <div className="text-[10px] text-secondary flex justify-between">
                  <span>Rata-rata Riil: {awayStats.avgXG.toFixed(2)} xG</span>
                  <span>Rata-rata Gol: {awayStats.avgGoals.toFixed(2)}</span>
                </div>
              </div>

              {/* Information Tip */}
              <div className="bg-neutral-50 dark:bg-neutral-900/30 border border-border-custom p-3.5 rounded-xl mt-2 flex gap-2">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-secondary leading-normal">
                  Geser parameter xG di atas untuk mensimulasikan taktik bermain ofensif atau defensif dari kedua tim secara real-time.
                </p>
              </div>
            </section>

            {/* PANEL 3: PROBABILITY RESULTS */}
            <section className="col-span-1 md:col-span-2 bg-card-bg-custom border border-border-custom rounded-2xl p-6 flex flex-col justify-between gap-6">
              <div>
                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border-custom pb-3 mb-4">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Probabilitas Hasil & Skor Terkuat
                </h3>

                {/* Score Panel */}
                <div className="flex flex-col items-center justify-center py-6 bg-neutral-50 dark:bg-neutral-900/30 rounded-2xl border border-border-custom mb-6">
                  <span className="text-[9px] font-bold text-secondary uppercase tracking-wider">Hasil Paling Mungkin</span>
                  <div className="text-5xl font-extrabold tracking-tight mt-1 text-text-custom font-mono flex items-center gap-4">
                    <span>{predictedHomeScore}</span>
                    <span className="text-secondary text-3xl font-light">-</span>
                    <span>{predictedAwayScore}</span>
                  </div>
                  <span className="text-[10px] text-secondary font-mono mt-2 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-border-custom">
                    Probabilitas: {(maxProbability * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Bars Probabilities */}
                <div className="flex flex-col gap-4">
                  {/* Home Win Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1 text-text-custom">
                      <span className="truncate max-w-[180px]">Menang: {homeTeam.name}</span>
                      <span className="text-success">{homePercent}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-success h-full transition-all duration-300 rounded-full" 
                        style={{ width: `${homePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Draw Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1 text-text-custom">
                      <span>Hasil Seri (Draw)</span>
                      <span className="text-secondary">{drawPercent}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-secondary h-full transition-all duration-300 rounded-full" 
                        style={{ width: `${drawPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Away Win Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1 text-text-custom">
                      <span className="truncate max-w-[180px]">Menang: {awayTeam.name}</span>
                      <span className="text-danger">{awayPercent}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-danger h-full transition-all duration-300 rounded-full" 
                        style={{ width: `${awayPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* PANEL 4: SCORE GRID HEATMAP (col-span-3) */}
            <section className="col-span-1 md:col-span-3 bg-card-bg-custom border border-border-custom rounded-2xl p-6">
              <h3 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border-custom pb-3 mb-6">
                <Trophy className="w-4 h-4 text-primary" />
                Matriks Probabilitas Skor Detail
              </h3>

              <div className="overflow-x-auto w-full">
                <div className="min-w-[480px]">
                  {/* Grid Table */}
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className="p-2 border border-border-custom bg-neutral-50 dark:bg-neutral-900/50 text-secondary w-16">
                          Home \ Away
                        </th>
                        {Array(maxGoals).fill(0).map((_, i) => (
                          <th key={i} className="p-2 border border-border-custom bg-neutral-50 dark:bg-neutral-900/50 font-bold text-text-custom w-16 text-center">
                            {i} gol ({awayTeam.name})
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array(maxGoals).fill(0).map((_, x) => (
                        <tr key={x}>
                          <td className="p-2 border border-border-custom bg-neutral-50 dark:bg-neutral-900/50 font-bold text-text-custom text-center">
                            {x} gol ({homeTeam.name})
                          </td>
                          {Array(maxGoals).fill(0).map((_, y) => {
                            const val = scoreGrid[x][y] * 100;
                            const isPredicted = x === predictedHomeScore && y === predictedAwayScore;
                            
                            // Hitung kepekatan warna latar belakang berdasarkan probabilitas
                            const intensity = Math.min(0.85, val / 15); // max opacity 85% pada probabilitas >= 15%
                            const bgStyle = isPredicted 
                              ? { backgroundColor: 'rgba(0, 113, 227, 0.25)', border: '2px solid #0071e3' } 
                              : { backgroundColor: `rgba(52, 199, 89, ${intensity})` };

                            return (
                              <td 
                                key={y} 
                                style={bgStyle} 
                                className={`p-3 border border-border-custom text-center font-mono font-semibold transition-all duration-300 ${isPredicted ? 'text-primary scale-105 font-bold' : (val > 3 ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-secondary')}`}
                              >
                                {val.toFixed(1)}%
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="col-span-1 md:col-span-3 text-center py-20 bg-card-bg-custom border border-border-custom rounded-2xl text-secondary italic">
            Silakan pilih Tim Kandang dan Tim Tandang untuk memulai kalkulasi simulasi pertandingan.
          </div>
        )}

      </div>

      {/* FOOTER */}
      <footer className="mt-8 text-center text-xs text-secondary">
        <p>© 2026 PantauBola Pro Portfolio. Developed by Nurfajar Naufal.</p>
      </footer>
    </div>
  );
}
