'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Match, LEAGUE_NAMES } from '@/types';
import { Loader2, Calendar, ChevronLeft, ChevronRight, Tv, Search } from 'lucide-react';
import Link from 'next/link';

// Mock Data Fallbacks
const MOCK_MATCHES: Match[] = [
  {
    id: 4001,
    home_team_id: 101,
    away_team_id: 103,
    match_date: new Date(Date.now() + 86400000 * 2).toISOString(),
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
    ai_predictions: null
  }
];

export default function MatchesPage() {
  const [loading, setLoading] = useState(true);
  const [activeLeague, setActiveLeague] = useState('PL');
  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SCHEDULED' | 'FINISHED'>('ALL');

  useEffect(() => {
    async function fetchMatches() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('matches')
          .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), ai_predictions(*)')
          .eq('league', activeLeague)
          .order('match_date', { ascending: false });

        if (!error && data && data.length > 0) {
          const formatted = data.map(m => ({
            ...m,
            home_team: m.home_team ? (Array.isArray(m.home_team) ? m.home_team[0] : m.home_team) : undefined,
            away_team: m.away_team ? (Array.isArray(m.away_team) ? m.away_team[0] : m.away_team) : undefined,
            ai_predictions: m.ai_predictions ? (Array.isArray(m.ai_predictions) ? m.ai_predictions[0] : m.ai_predictions) : null
          }));
          setMatches(formatted as Match[]);
        }
      } catch (err) {
        console.error('Error fetching matches:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, [activeLeague]);

  // Filter logika
  const filteredMatches = matches.filter(match => {
    const homeName = match.home_team?.name?.toLowerCase() || '';
    const awayName = match.away_team?.name?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = homeName.includes(query) || awayName.includes(query);
    
    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'SCHEDULED') return matchesSearch && (match.status === 'SCHEDULED' || match.status === 'POSTPONED');
    if (statusFilter === 'FINISHED') return matchesSearch && match.status === 'FINISHED';
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-6xl mx-auto flex flex-col gap-8">
      {/* HEADER NAVBAR */}
      <nav className="flex items-center gap-4">
        <Link 
          href="/" 
          className="p-2 border border-border-custom bg-card-bg-custom text-text-custom rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-custom">
            Jadwal & Hasil Pertandingan
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            Daftar pertandingan sepak bola beserta ulasan prediksi AI.
          </p>
        </div>
      </nav>

      {/* FILTER PANEL */}
      <div className="flex flex-col md:flex-row gap-4 justify-between border-b border-border-custom pb-6">
        {/* League selector */}
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

        {/* Search & Status Filter */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari tim..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs bg-card-bg-custom border border-border-custom rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-48 text-text-custom"
            />
          </div>

          <div className="flex border border-border-custom rounded-full overflow-hidden p-0.5 bg-card-bg-custom">
            {(['ALL', 'SCHEDULED', 'FINISHED'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-full transition-all cursor-pointer ${
                  statusFilter === filter
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                    : 'text-secondary hover:text-text-custom'
                }`}
              >
                {filter === 'ALL' ? 'Semua' : filter === 'SCHEDULED' ? 'Mendatang' : 'Selesai'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MATCHES LISTING */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-secondary gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs">Menarik jadwal pertandingan...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.length === 0 ? (
            <div className="col-span-1 md:col-span-2 text-center py-20 text-secondary border border-dashed border-border-custom rounded-2xl bg-card-bg-custom">
              Tidak ada pertandingan yang cocok dengan pencarian atau filter.
            </div>
          ) : (
            filteredMatches.map((match) => {
              const isFinished = match.status === 'FINISHED';
              const matchDate = new Date(match.match_date).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              });
              
              return (
                <div 
                  key={match.id}
                  className="bg-card-bg-custom border border-border-custom rounded-2xl p-5 flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-700 transition-all duration-300"
                >
                  <div className="flex items-center justify-between border-b border-border-custom pb-3 mb-4">
                    <span className="text-[10px] font-semibold text-secondary flex items-center gap-1.5">
                      <Tv className="w-3.5 h-3.5" />
                      Matchday {match.matchday}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full uppercase ${
                      isFinished 
                        ? 'bg-neutral-100 text-secondary dark:bg-neutral-800' 
                        : match.status === 'POSTPONED'
                          ? 'bg-danger/10 text-danger border border-danger/10'
                          : 'bg-primary/10 text-primary border border-primary/20'
                    }`}>
                      {match.status === 'POSTPONED' ? 'Ditunda' : isFinished ? 'Selesai' : 'Mendatang'}
                    </span>
                  </div>

                  {/* SCORELINE */}
                  <div className="flex items-center justify-between gap-2 py-2">
                    <div className="flex flex-col items-center gap-2 w-5/12 text-center">
                      <img 
                        src={match.home_team?.logo_url} 
                        alt={match.home_team?.name} 
                        className="w-10 h-10 object-contain"
                        onError={(e) => { e.currentTarget.src = 'https://crests.football-data.org/placeholder.png'; }}
                      />
                      <span className="font-bold text-xs max-w-[120px] truncate text-text-custom">
                        {match.home_team?.name}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center w-2/12">
                      {isFinished ? (
                        <div className="text-2xl font-extrabold tracking-tight text-text-custom">
                          {match.home_score} - {match.away_score}
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-secondary">
                          VS
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-2 w-5/12 text-center">
                      <img 
                        src={match.away_team?.logo_url} 
                        alt={match.away_team?.name} 
                        className="w-10 h-10 object-contain"
                        onError={(e) => { e.currentTarget.src = 'https://crests.football-data.org/placeholder.png'; }}
                      />
                      <span className="font-bold text-xs max-w-[120px] truncate text-text-custom">
                        {match.away_team?.name}
                      </span>
                    </div>
                  </div>

                  {/* PROBABILITY PILLS & FOOTER */}
                  <div className="mt-4 pt-4 border-t border-border-custom flex flex-col gap-3">
                    <div className="text-[10px] text-secondary font-medium text-center">
                      {matchDate}
                    </div>

                    {!isFinished && match.ai_predictions ? (
                      <div className="flex items-center justify-between gap-2 bg-neutral-50 dark:bg-neutral-900/40 p-2.5 rounded-xl border border-border-custom">
                        <div className="flex gap-1">
                          <span className="text-[9px] px-2 py-0.5 font-bold rounded-full bg-success/10 text-success">
                            Home: {match.ai_predictions.home_prob}%
                          </span>
                          <span className="text-[9px] px-2 py-0.5 font-bold rounded-full bg-neutral-100 dark:bg-neutral-800 text-secondary">
                            Draw: {match.ai_predictions.draw_prob}%
                          </span>
                          <span className="text-[9px] px-2 py-0.5 font-bold rounded-full bg-danger/10 text-danger">
                            Away: {match.ai_predictions.away_prob}%
                          </span>
                        </div>
                        
                        <Link 
                          href={`/matches/${match.id}`}
                          className="text-[10px] font-bold text-primary flex items-center hover:underline cursor-pointer"
                        >
                          Analisis AI
                          <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Link>
                      </div>
                    ) : isFinished ? (
                      <div className="text-center">
                        <Link 
                          href={`/matches/${match.id}`}
                          className="text-[10px] font-bold text-primary inline-flex items-center hover:underline cursor-pointer"
                        >
                          Lihat Riwayat Analisis & H2H
                          <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center text-[10px] text-secondary italic">
                        Kalkulasi prediksi berlangsung
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-8 text-center text-xs text-secondary">
        <p>© 2026 PantauBola Pro Portfolio. Developed by Nurfajar Naufal.</p>
      </footer>
    </div>
  );
}
