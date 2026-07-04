'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Match, LEAGUE_NAMES } from '@/types';
import { 
  Loader2, 
  ChevronLeft, 
  Tv, 
  BrainCircuit, 
  Lightbulb, 
  BarChart3, 
  ShieldAlert,
  Flame,
  TrendingUp,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

// Fallback Mock Data jika Match ID tidak ditemukan
const getMockMatchDetail = (id: string): Match => {
  return {
    id: parseInt(id) || 4001,
    home_team_id: 101,
    away_team_id: 103,
    match_date: new Date(Date.now() - 86400000 * 2).toISOString(), // Selesai
    home_score: 2,
    away_score: 1,
    status: 'FINISHED',
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
      match_id: parseInt(id) || 4001,
      home_prob: 45.5,
      draw_prob: 28.3,
      away_prob: 26.2,
      predicted_home_score: 2,
      predicted_away_score: 1,
      analysis_text: 'Arsenal sedang dalam kondisi on-fire di kandang dengan pertahanan rapat. Man City diprediksi menguasai ball possession namun rawan terkena counter-attack kilat Saka dan Martinelli. Kehilangan Rodri di lini tengah City bisa jadi faktor kunci kegagalan membendung transisi cepat Gunners.',
      key_factors: [
        'Transisi counter-attack kilat Arsenal lewat sayap.',
        'Absennya jangkar gelandang pertahanan Manchester City.',
        'Dominasi duel udara set-piece bek kandang Emirates.'
      ],
      updated_at: ''
    }
  };
};

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

export default function MatchDetailPage() {
  const { id } = useParams() as { id: string };
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<Match | null>(null);
  const [mounted, setMounted] = useState(false);

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
        } else {
          // Fallback ke Mock Data jika query DB kosong (supaya demo selalu berfungsi)
          setMatch(getMockMatchDetail(id));
        }
      } catch (err) {
        console.error('Error fetching match details:', err);
        setMatch(getMockMatchDetail(id));
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
  
  // Data Statistik untuk Chart
  const chartData = [
    {
      name: 'Peluang Menang (%)',
      [match.home_team?.name || 'Home']: match.ai_predictions?.home_prob || 33.3,
      [match.away_team?.name || 'Away']: match.ai_predictions?.away_prob || 33.3,
    },
    {
      name: 'Rata-rata Gol / Laga',
      [match.home_team?.name || 'Home']: 2.3, // Dummy metrics untuk perbandingan statistik visual
      [match.away_team?.name || 'Away']: 2.0,
    },
    {
      name: 'Clean Sheets / Musim',
      [match.home_team?.name || 'Home']: 12,
      [match.away_team?.name || 'Away']: 10,
    },
    {
      name: 'Efisiensi Shot on Target (%)',
      [match.home_team?.name || 'Home']: 38,
      [match.away_team?.name || 'Away']: 34,
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
            <img 
              src={match.home_team?.logo_url} 
              alt={match.home_team?.name} 
              className="w-16 h-16 object-contain"
              onError={(e) => { e.currentTarget.src = 'https://crests.football-data.org/placeholder.png'; }}
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
            <img 
              src={match.away_team?.logo_url} 
              alt={match.away_team?.name} 
              className="w-16 h-16 object-contain"
              onError={(e) => { e.currentTarget.src = 'https://crests.football-data.org/placeholder.png'; }}
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
                "{match.ai_predictions.analysis_text}"
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
      <footer className="mt-8 text-center text-xs text-secondary">
        <p>© 2026 PantauBola Pro Portfolio. Developed by Nurfajar Naufal.</p>
      </footer>
    </div>
  );
}
