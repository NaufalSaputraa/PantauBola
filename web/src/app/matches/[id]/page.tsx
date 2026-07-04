'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Match, LEAGUE_NAMES } from '@/types';
import { 
  Loader2, 
  ChevronLeft, 
  BrainCircuit, 
  Lightbulb, 
  BarChart3, 
  ShieldAlert,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

import { getMockMatchDetail } from '@/lib/mock-data';
import Footer from '@/components/Footer';

interface StatRowProps {
  label: string;
  homeVal: string | number;
  awayVal: string | number;
  homePercent: number;
  isLowerBetter?: boolean;
}

function StatRow({ label, homeVal, awayVal, homePercent, isLowerBetter = false }: StatRowProps) {
  const homeValNum = Number(homeVal);
  const awayValNum = Number(awayVal);
  
  // Menentukan pemenang baris
  let isHomeWinner = homeValNum > awayValNum;
  if (isLowerBetter) {
    isHomeWinner = homeValNum < awayValNum;
  }
  const isDraw = homeValNum === awayValNum;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-center text-xs font-semibold px-1">
        <span className={`${isHomeWinner && !isDraw ? 'text-success font-bold text-sm' : 'text-secondary'}`}>
          {homeVal}
        </span>
        <span className="text-secondary uppercase font-bold tracking-wider text-[10px]">
          {label}
        </span>
        <span className={`${!isHomeWinner && !isDraw ? 'text-danger font-bold text-sm' : 'text-secondary'}`}>
          {awayVal}
        </span>
      </div>
      
      {/* Visual Bar Comparison */}
      <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden flex">
        <div 
          className="bg-success h-full transition-all duration-500"
          style={{ width: `${homePercent}%` }}
        />
        <div 
          className="bg-neutral-300 dark:bg-neutral-700 h-full w-[2px]" 
        />
        <div 
          className="bg-danger h-full transition-all duration-500 flex-1"
        />
      </div>
    </div>
  );
}

interface H2HMatch {
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  home_team?: {
    name: string;
    logo_url?: string;
  };
  away_team?: {
    name: string;
    logo_url?: string;
  };
}

export default function MatchDetailPage() {
  const { id } = useParams() as { id: string };
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<Match | null>(null);
  const [homeMetrics, setHomeMetrics] = useState({ avgGoals: 1.5, winRate: 45, avgConceded: 1.0 });
  const [awayMetrics, setAwayMetrics] = useState({ avgGoals: 1.2, winRate: 35, avgConceded: 1.4 });
  const [h2hMatches, setH2hMatches] = useState<H2HMatch[]>([]);

  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchMatchDetail() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('matches')
          .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), ai_predictions(*)')
          .eq('id', id)
          .single();

        if (!error && data) {
          const formatted: Match = {
            ...data,
            home_team: data.home_team ? (Array.isArray(data.home_team) ? data.home_team[0] : data.home_team) : undefined,
            away_team: data.away_team ? (Array.isArray(data.away_team) ? data.away_team[0] : data.away_team) : undefined,
            ai_predictions: data.ai_predictions ? (Array.isArray(data.ai_predictions) ? data.ai_predictions[0] : data.ai_predictions) : null
          };
          setMatch(formatted);

          // Tarik metrik taktis riil dari standings database
          const { data: stData } = await supabase
            .from('standings')
            .select('team_id, played, goals_for, goals_against, won')
            .in('team_id', [formatted.home_team_id, formatted.away_team_id]);

          if (stData && stData.length > 0) {
            const hSt = stData.find(s => s.team_id === formatted.home_team_id);
            const aSt = stData.find(s => s.team_id === formatted.away_team_id);

            if (hSt && hSt.played > 0) {
              setHomeMetrics({
                avgGoals: Number((hSt.goals_for / hSt.played).toFixed(2)),
                winRate: Number(((hSt.won / hSt.played) * 100).toFixed(1)),
                avgConceded: Number((hSt.goals_against / hSt.played).toFixed(2))
              });
            }
            if (aSt && aSt.played > 0) {
              setAwayMetrics({
                avgGoals: Number((aSt.goals_for / aSt.played).toFixed(2)),
                winRate: Number(((aSt.won / aSt.played) * 100).toFixed(1)),
                avgConceded: Number((aSt.goals_against / aSt.played).toFixed(2))
              });
            }
          }

          // Tarik data H2H historis
          const { data: h2hData } = await supabase
            .from('matches')
            .select('home_score, away_score, match_date, home_team_id, away_team_id, status, home_team:teams!home_team_id(name, logo_url), away_team:teams!away_team_id(name, logo_url)')
            .or(`and(home_team_id.eq.${formatted.home_team_id},away_team_id.eq.${formatted.away_team_id}),and(home_team_id.eq.${formatted.away_team_id},away_team_id.eq.${formatted.home_team_id})`)
            .eq('status', 'FINISHED')
            .order('match_date', { ascending: false })
            .limit(5);

          if (h2hData && h2hData.length > 0) {
            const formattedH2H: H2HMatch[] = h2hData.map((m) => {
              const hTeam = m.home_team ? (Array.isArray(m.home_team) ? m.home_team[0] : m.home_team) as { name: string; logo_url?: string } : undefined;
              const aTeam = m.away_team ? (Array.isArray(m.away_team) ? m.away_team[0] : m.away_team) as { name: string; logo_url?: string } : undefined;
              return {
                match_date: m.match_date,
                home_score: m.home_score,
                away_score: m.away_score,
                home_team: hTeam ? { name: hTeam.name, logo_url: hTeam.logo_url } : undefined,
                away_team: aTeam ? { name: aTeam.name, logo_url: aTeam.logo_url } : undefined
              };
            });
            setH2hMatches(formattedH2H);
          }
        } else {
          // Fallback ke Mock Data jika query DB kosong (supaya demo selalu berfungsi)
          const mockMatch = getMockMatchDetail(id);
          setMatch(mockMatch);
          setHomeMetrics({ avgGoals: 2.3, winRate: 71.4, avgConceded: 0.85 });
          setAwayMetrics({ avgGoals: 2.0, winRate: 67.8, avgConceded: 0.92 });
          setH2hMatches([
            {
              match_date: new Date(Date.now() - 86400000 * 180).toISOString(),
              home_score: 2,
              away_score: 2,
              home_team: mockMatch.home_team,
              away_team: mockMatch.away_team
            },
            {
              match_date: new Date(Date.now() - 86400000 * 365).toISOString(),
              home_score: 1,
              away_score: 0,
              home_team: mockMatch.away_team,
              away_team: mockMatch.home_team
            }
          ]);
        }
      } catch (err) {
        console.error('Error fetching match details:', err);
        const mockMatch = getMockMatchDetail(id);
        setMatch(mockMatch);
        setHomeMetrics({ avgGoals: 2.3, winRate: 71.4, avgConceded: 0.85 });
        setAwayMetrics({ avgGoals: 2.0, winRate: 67.8, avgConceded: 0.92 });
        setH2hMatches([
          {
            match_date: new Date(Date.now() - 86400000 * 180).toISOString(),
            home_score: 2,
            away_score: 2,
            home_team: mockMatch.home_team,
            away_team: mockMatch.away_team
          }
        ]);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchMatchDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-secondary gap-3 bg-background-custom">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-xs">Menganalisis data pertandingan...</span>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-secondary gap-3 bg-background-custom p-6">
        <ShieldAlert className="w-12 h-12 text-danger" />
        <h2 className="text-lg font-bold text-text-custom">Pertandingan Tidak Ditemukan</h2>
        <Link href="/" className="text-xs text-primary underline">Kembali ke Home</Link>
      </div>
    );
  }

  const isFinished = match.status === 'FINISHED';
  
  // Data Statistik untuk Chart (Ambil metrik riil)
  const chartData = [
    {
      name: 'Peluang Menang (%)',
      [match.home_team?.name || 'Home']: match.ai_predictions?.home_prob || 33.3,
      [match.away_team?.name || 'Away']: match.ai_predictions?.away_prob || 33.3,
    },
    {
      name: 'Rata-rata Gol / Laga',
      [match.home_team?.name || 'Home']: homeMetrics.avgGoals,
      [match.away_team?.name || 'Away']: awayMetrics.avgGoals,
    },
    {
      name: 'Rasio Menang (%)',
      [match.home_team?.name || 'Home']: homeMetrics.winRate,
      [match.away_team?.name || 'Away']: awayMetrics.winRate,
    },
    {
      name: 'Rata-rata Kebobolan',
      [match.home_team?.name || 'Home']: homeMetrics.avgConceded,
      [match.away_team?.name || 'Away']: awayMetrics.avgConceded,
    }
  ];

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-5xl mx-auto flex flex-col gap-8">
      {/* HEADER NAVBAR */}
      <nav className="flex items-center gap-4">
        <Link 
          href="/matches" 
          className="p-2 border border-border-custom bg-card-bg-custom text-text-custom rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full font-bold uppercase">
            {LEAGUE_NAMES[match.league] || 'Liga Eropa'}
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-custom mt-1">
            Analisis Taktis AI
          </h1>
        </div>
      </nav>

      {/* CORE BENTO SECTION (Apple Style) */}
      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ROW 1: SCOREBOARD (col-span-3) */}
        <section className="col-span-1 md:col-span-3 bg-card-bg-custom border border-border-custom rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full md:w-5/12 justify-center md:justify-start">
            <Image 
              src={match.home_team?.logo_url || 'https://crests.football-data.org/placeholder.png'} 
              alt={match.home_team?.name || 'Home Team'} 
              width={64}
              height={64}
              className="object-contain"
            />
            <div>
              <h2 className="text-lg font-bold text-text-custom">{match.home_team?.name}</h2>
              <span className="text-xs text-secondary">Tuan Rumah</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center w-full md:w-2/12 border-y md:border-y-0 md:border-x border-border-custom py-4 md:py-0 px-6">
            {isFinished ? (
              <div className="text-center">
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Hasil Akhir</span>
                <div className="text-4xl font-extrabold tracking-tight mt-1 text-text-custom">
                  {match.home_score} - {match.away_score}
                </div>
                {match.home_xg !== undefined && match.home_xg !== null && match.away_xg !== undefined && match.away_xg !== null && (
                  <div className="text-[10px] text-secondary font-mono mt-1.5 px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-md border border-border-custom inline-block">
                    xG: {Number(match.home_xg).toFixed(2)} - {Number(match.away_xg).toFixed(2)}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <span className="text-[10px] px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full font-bold">
                  {match.status === 'POSTPONED' ? 'Ditunda' : 'Scheduled'}
                </span>
                <div className="text-xs font-bold text-secondary mt-2">
                  VS
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 w-full md:w-5/12 justify-center md:justify-end">
            <div className="text-right">
              <h2 className="text-lg font-bold text-text-custom">{match.away_team?.name}</h2>
              <span className="text-xs text-secondary">Tandang</span>
            </div>
            <Image 
              src={match.away_team?.logo_url || 'https://crests.football-data.org/placeholder.png'} 
              alt={match.away_team?.name || 'Away Team'} 
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
        </section>

        {/* ROW 2: PREDICTION OUTCOME PROBABILITIES (col-span-2) */}
        <section className="col-span-1 md:col-span-2 bg-card-bg-custom border border-border-custom rounded-2xl p-6">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border-custom pb-3 mb-4">
            <Activity className="w-4 h-4 text-primary" />
            Probabilitas Poisson (1X2)
          </h3>

          {match.ai_predictions ? (
            <div className="flex flex-col gap-6 py-2">
              {/* Home Win Bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-text-custom">
                  <span>Kemenangan {match.home_team?.name}</span>
                  <span className="text-success">{match.ai_predictions.home_prob}%</span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-success h-full transition-all duration-500 rounded-full" 
                    style={{ width: `${match.ai_predictions.home_prob}%` }}
                  />
                </div>
              </div>

              {/* Draw Bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-text-custom">
                  <span>Hasil Seri (Draw)</span>
                  <span className="text-secondary">{match.ai_predictions.draw_prob}%</span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-secondary h-full transition-all duration-500 rounded-full" 
                    style={{ width: `${match.ai_predictions.draw_prob}%` }}
                  />
                </div>
              </div>

              {/* Away Win Bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-text-custom">
                  <span>Kemenangan {match.away_team?.name}</span>
                  <span className="text-danger">{match.ai_predictions.away_prob}%</span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-danger h-full transition-all duration-500 rounded-full" 
                    style={{ width: `${match.ai_predictions.away_prob}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-secondary italic">
              Kalkulasi distribusi Poisson belum tersedia untuk pertandingan ini.
            </div>
          )}
        </section>

        {/* ROW 2: SCORE ESTIMATE BOX (col-span-1) */}
        <section className="col-span-1 bg-card-bg-custom border border-border-custom rounded-2xl p-6 flex flex-col justify-between items-center text-center">
          <div>
            <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">
              Prediksi Skor AI
            </h3>
            {match.ai_predictions ? (
              <div className="text-5xl font-extrabold tracking-tight mt-6 text-text-custom">
                {match.ai_predictions.predicted_home_score} - {match.ai_predictions.predicted_away_score}
              </div>
            ) : (
              <div className="text-2xl font-extrabold text-secondary mt-8">--</div>
            )}
            <p className="text-[10px] text-secondary mt-4 leading-normal">
              Hasil kalkulasi integrasi data Poisson dengan evaluasi taktis Gemini.
            </p>
          </div>
          <div className="w-full pt-4 border-t border-border-custom text-[10px] text-secondary font-medium">
            Status Kepercayaan: <span className="text-success font-semibold">Tinggi</span>
          </div>
        </section>

        {/* ROW 3: AI TACTICAL REVIEW (col-span-1 md:col-span-3) */}
        {match.ai_predictions && (
          <section className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* TACTICAL ANALYSIS TEXT (col-span-2) */}
            <div className="col-span-1 md:col-span-2 bg-card-bg-custom border border-border-custom rounded-2xl p-6 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border-custom pb-3">
                <BrainCircuit className="w-4.5 h-4.5 text-primary" />
                Ulasan Taktis AI
              </h3>
              
              <div className="text-sm text-text-custom leading-relaxed bg-neutral-50 dark:bg-neutral-900/30 p-4 rounded-xl border border-border-custom font-medium italic">
                &ldquo;{match.ai_predictions.analysis_text}&rdquo;
              </div>
            </div>

            {/* KEY FACTORS (col-span-1) */}
            <div className="col-span-1 bg-card-bg-custom border border-border-custom rounded-2xl p-6 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border-custom pb-3">
                <Lightbulb className="w-4.5 h-4.5 text-primary" />
                Faktor Kunci
              </h3>
              
              <ul className="flex flex-col gap-3">
                {match.ai_predictions.key_factors.map((factor, index) => (
                  <li key={index} className="flex gap-2.5 items-start text-xs text-text-custom">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 font-bold shrink-0">
                      {index + 1}
                    </span>
                    <span className="leading-tight">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>

          </section>
        )}

        {/* ROW 4: DATA VISUALIZATION GRAPH (col-span-3) */}
        {mounted && (
          <section className="col-span-1 md:col-span-3 bg-card-bg-custom border border-border-custom rounded-2xl p-6">
            <h3 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border-custom pb-3 mb-6">
              <BarChart3 className="w-4.5 h-4.5 text-primary" />
              Perbandingan Metrik Utama Tim
            </h3>
            
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#8E8E93', fontSize: 12 }} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis hide={true} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 8 }}
                    contentStyle={{ 
                      backgroundColor: '#1C1C1E', 
                      borderColor: '#2C2C2E',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#E8E8ED'
                    }} 
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }}
                  />
                  <Bar 
                    dataKey={match.home_team?.name || 'Home'} 
                    fill="var(--color-primary)" 
                    radius={[6, 6, 0, 0]} 
                  />
                  <Bar 
                    dataKey={match.away_team?.name || 'Away'} 
                    fill="var(--color-secondary)" 
                    radius={[6, 6, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* ROW: HEAD-TO-HEAD HISTORY (col-span-3) */}
        <section className="col-span-1 md:col-span-3 bg-card-bg-custom border border-border-custom rounded-2xl p-6">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border-custom pb-3 mb-6">
            <Activity className="w-4.5 h-4.5 text-primary" />
            Riwayat Pertemuan Head-to-Head (H2H)
          </h3>
          {h2hMatches.length === 0 ? (
            <div className="text-center py-8 text-xs text-secondary italic">
              Belum ada riwayat pertemuan resmi tercatat di database untuk musim ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {h2hMatches.map((h2h, idx) => {
                const h2hDate = new Date(h2h.match_date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                });
                return (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-900/30 border border-border-custom rounded-xl text-xs">
                    <div className="flex items-center gap-2 w-5/12 truncate font-semibold text-text-custom">
                      <Image 
                        src={h2h.home_team?.logo_url || 'https://crests.football-data.org/placeholder.png'} 
                        alt="Home" 
                        width={18} 
                        height={18} 
                        className="object-contain shrink-0" 
                      />
                      <span className="truncate">{h2h.home_team?.name}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center w-2/12 shrink-0">
                      <span className="font-extrabold text-sm text-text-custom font-mono">
                        {h2h.home_score} - {h2h.away_score}
                      </span>
                      <span className="text-[9px] text-secondary mt-0.5 whitespace-nowrap">{h2hDate}</span>
                    </div>
                    <div className="flex items-center justify-end gap-2 w-5/12 truncate font-semibold text-text-custom text-right">
                      <span className="truncate">{h2h.away_team?.name}</span>
                      <Image 
                        src={h2h.away_team?.logo_url || 'https://crests.football-data.org/placeholder.png'} 
                        alt="Away" 
                        width={18} 
                        height={18} 
                        className="object-contain shrink-0" 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ROW 5: STATISTIK DETAIL PERTANDINGAN (Hanya untuk Laga FINISHED dengan data stat) */}
        {isFinished && match.home_shots !== null && match.home_shots !== undefined && (
          <section className="col-span-1 md:col-span-3 bg-card-bg-custom border border-border-custom rounded-2xl p-6">
            <h3 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border-custom pb-3 mb-6">
              <Activity className="w-4.5 h-4.5 text-primary" />
              Statistik Rinci Pertandingan
            </h3>
            
            <div className="flex flex-col gap-6 max-w-2xl mx-auto py-2">
              {/* xG Row */}
              <StatRow 
                label="Expected Goals (xG)" 
                homeVal={Number(match.home_xg || 0).toFixed(2)} 
                awayVal={Number(match.away_xg || 0).toFixed(2)} 
                homePercent={((match.home_xg || 0) / (((match.home_xg || 0) + (match.away_xg || 0)) || 1)) * 100}
              />
              
              {/* Shots Row */}
              <StatRow 
                label="Total Tembakan" 
                homeVal={match.home_shots || 0} 
                awayVal={match.away_shots || 0} 
                homePercent={((match.home_shots || 0) / (((match.home_shots || 0) + (match.away_shots || 0)) || 1)) * 100}
              />
              
              {/* Shots on Target Row */}
              <StatRow 
                label="Tembakan Tepat Sasaran" 
                homeVal={match.home_shots_on_target || 0} 
                awayVal={match.away_shots_on_target || 0} 
                homePercent={((match.home_shots_on_target || 0) / (((match.home_shots_on_target || 0) + (match.away_shots_on_target || 0)) || 1)) * 100}
              />
              
              {/* Deep Passes Row */}
              <StatRow 
                label="Umpan ke Area Bahaya (Deep Passes)" 
                homeVal={match.home_deep || 0} 
                awayVal={match.away_deep || 0} 
                homePercent={((match.home_deep || 0) / (((match.home_deep || 0) + (match.away_deep || 0)) || 1)) * 100}
              />
              
              {/* PPDA Row */}
              <StatRow 
                label="Pressing Intensity (PPDA)" 
                homeVal={Number(match.home_ppda || 0).toFixed(1)} 
                awayVal={Number(match.away_ppda || 0).toFixed(1)} 
                // PPDA Terbalik secara visual: PPDA lebih kecil = pressing lebih intens = bar lebih panjang
                homePercent={((match.away_ppda || 0) / (((match.home_ppda || 0) + (match.away_ppda || 0)) || 1)) * 100}
                isLowerBetter={true}
              />
              
              <div className="text-[10px] text-center text-secondary font-medium mt-2 bg-neutral-50 dark:bg-neutral-900/30 p-2.5 rounded-lg border border-border-custom max-w-md mx-auto leading-normal">
                ℹ️ <strong>PPDA (Passes Allowed per Defensive Action):</strong> Semakin rendah angka PPDA, pertahanan tim semakin agresif melakukan pressing sebelum lawan melepaskan umpan.
              </div>
            </div>
          </section>
        )}

      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
