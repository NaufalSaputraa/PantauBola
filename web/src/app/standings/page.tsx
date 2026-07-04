'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Standing, LEAGUE_NAMES } from '@/types';
import { Loader2, Award, ChevronLeft, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

// Mock Data Fallbacks (Untuk demo)
const MOCK_STANDINGS: Standing[] = [
  { id: 1, team_id: 101, league: 'PL', position: 1, played: 28, won: 20, drawn: 5, lost: 3, goals_for: 65, goals_against: 24, points: 65, teams: { id: 101, name: 'Arsenal', logo_url: 'https://crests.football-data.org/57.png', league: 'PL' }, updated_at: '' },
  { id: 2, team_id: 102, league: 'PL', position: 2, played: 28, won: 19, drawn: 6, lost: 3, goals_for: 62, goals_against: 25, points: 63, teams: { id: 102, name: 'Liverpool', logo_url: 'https://crests.football-data.org/64.png', league: 'PL' }, updated_at: '' },
  { id: 3, team_id: 103, league: 'PL', position: 3, played: 28, won: 18, drawn: 7, lost: 3, goals_for: 68, goals_against: 26, points: 61, teams: { id: 103, name: 'Manchester City', logo_url: 'https://crests.football-data.org/65.png', league: 'PL' }, updated_at: '' },
  { id: 4, team_id: 104, league: 'PL', position: 4, played: 28, won: 16, drawn: 5, lost: 7, goals_for: 55, goals_against: 37, points: 53, teams: { id: 104, name: 'Aston Villa', logo_url: 'https://crests.football-data.org/58.png', league: 'PL' }, updated_at: '' },
  { id: 5, team_id: 105, league: 'PL', position: 5, played: 28, won: 15, drawn: 5, lost: 8, goals_for: 57, goals_against: 45, points: 50, teams: { id: 105, name: 'Tottenham Hotspur', logo_url: 'https://crests.football-data.org/73.png', league: 'PL' }, updated_at: '' },
  { id: 6, team_id: 106, league: 'PL', position: 6, played: 28, won: 14, drawn: 5, lost: 9, goals_for: 52, goals_against: 39, points: 47, teams: { id: 106, name: 'Manchester United', logo_url: 'https://crests.football-data.org/66.png', league: 'PL' }, updated_at: '' },
  { id: 7, team_id: 107, league: 'PL', position: 7, played: 28, won: 13, drawn: 4, lost: 11, goals_for: 48, goals_against: 43, points: 43, teams: { id: 107, name: 'West Ham United', logo_url: 'https://crests.football-data.org/563.png', league: 'PL' }, updated_at: '' },
  { id: 8, team_id: 108, league: 'PL', position: 8, played: 28, won: 12, drawn: 6, lost: 10, goals_for: 45, goals_against: 44, points: 42, teams: { id: 108, name: 'Brighton & Hove Albion', logo_url: 'https://crests.football-data.org/397.png', league: 'PL' }, updated_at: '' },
];

export default function StandingsPage() {
  const [loading, setLoading] = useState(true);
  const [activeLeague, setActiveLeague] = useState('PL');
  const [standings, setStandings] = useState<Standing[]>(MOCK_STANDINGS);

  useEffect(() => {
    async function fetchStandings() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('standings')
          .select('*, teams(*)')
          .eq('league', activeLeague)
          .order('position', { ascending: true });

        if (!error && data && data.length > 0) {
          const formatted = data.map(item => ({
            ...item,
            teams: item.teams ? (Array.isArray(item.teams) ? item.teams[0] : item.teams) : undefined
          }));
          setStandings(formatted as Standing[]);
        }
      } catch (err) {
        console.error('Error fetching standings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStandings();
  }, [activeLeague]);

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
            Klasemen Liga
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            Peringkat klub musim berjalan 2026.
          </p>
        </div>
      </nav>

      {/* FILTER PANEL */}
      <div className="flex flex-wrap gap-2 pb-4 border-b border-border-custom">
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

      {/* TABLE PANEL */}
      <div className="bg-card-bg-custom border border-border-custom rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-secondary gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs">Menarik klasemen...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-custom bg-neutral-50/50 dark:bg-neutral-900/30 text-[10px] text-secondary font-bold uppercase tracking-wider">
                  <th className="py-4 px-5 text-center w-12">Pos</th>
                  <th className="py-4 px-4">Klub</th>
                  <th className="py-4 px-4 text-center w-16">Main</th>
                  <th className="py-4 px-4 text-center w-16">Menang</th>
                  <th className="py-4 px-4 text-center w-16">Seri</th>
                  <th className="py-4 px-4 text-center w-16">Kalah</th>
                  <th className="py-4 px-4 text-center w-20">Gol (F-A)</th>
                  <th className="py-4 px-4 text-center w-16">Selisih</th>
                  <th className="py-4 px-5 text-center w-20 font-extrabold text-text-custom">Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom text-xs">
                {standings.map((team, idx) => {
                  const goalDiff = team.goals_for - team.goals_against;
                  const isTop4 = idx < 4;
                  const isRelegation = idx >= standings.length - 3;
                  
                  return (
                    <tr 
                      key={team.team_id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="py-4 px-5 text-center font-bold">
                        <span className={`w-6 h-6 flex items-center justify-center mx-auto rounded-full text-[11px] ${
                          isTop4 
                            ? 'bg-primary/10 text-primary border border-primary/20' 
                            : isRelegation 
                              ? 'bg-danger/10 text-danger border border-danger/20'
                              : 'text-secondary'
                        }`}>
                          {team.position}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-text-custom">
                        <div className="flex items-center gap-3">
                          <img 
                            src={team.teams?.logo_url} 
                            alt={team.teams?.name} 
                            className="w-5 h-5 object-contain"
                            onError={(e) => { e.currentTarget.src = 'https://crests.football-data.org/placeholder.png'; }}
                          />
                          <span>{team.teams?.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-secondary font-medium">{team.played}</td>
                      <td className="py-4 px-4 text-center text-success font-medium">{team.won}</td>
                      <td className="py-4 px-4 text-center text-secondary font-medium">{team.drawn}</td>
                      <td className="py-4 px-4 text-center text-danger font-medium">{team.lost}</td>
                      <td className="py-4 px-4 text-center text-secondary font-medium">{team.goals_for} - {team.goals_against}</td>
                      <td className={`py-4 px-4 text-center font-medium ${
                        goalDiff > 0 ? 'text-success' : goalDiff < 0 ? 'text-danger' : 'text-secondary'
                      }`}>
                        {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
                      </td>
                      <td className="py-4 px-5 text-center font-extrabold text-text-custom text-sm">{team.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="mt-8 text-center text-xs text-secondary">
        <div className="flex items-center justify-center gap-3 mb-2 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-primary/20 border border-primary/40" />
            Zona Champions League
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-danger/20 border border-danger/40" />
            Zona Degradasi
          </span>
        </div>
        <p>© 2026 PantauBola Pro Portfolio. Developed by Nurfajar Naufal.</p>
      </footer>
    </div>
  );
}
