import React from 'react';
import { supabase } from '@/lib/supabase';
import { Standing, LEAGUE_NAMES } from '@/types';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { MOCK_STANDINGS } from '@/lib/mock-data';
import Footer from '@/components/Footer';

interface PageProps {
  searchParams: Promise<{ league?: string }>;
}

export default async function StandingsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const activeLeague = resolvedParams.league || 'PL';

  let standings: Standing[] = [];
  const teamForms: Record<number, ('W' | 'D' | 'L')[]> = {};

  try {
    const { data, error } = await supabase
      .from('standings')
      .select('*, teams(*)')
      .eq('league', activeLeague)
      .order('position', { ascending: true });

    if (!error && data && data.length > 0) {
      standings = data.map(item => ({
        ...item,
        teams: item.teams ? (Array.isArray(item.teams) ? item.teams[0] : item.teams) : undefined
      })) as Standing[];
    } else {
      standings = MOCK_STANDINGS.filter(s => s.league === activeLeague);
    }

    // Tarik 60 matches terakhir yang finished untuk menghitung form streak
    const { data: finishedMatches } = await supabase
      .from('matches')
      .select('home_team_id, away_team_id, home_score, away_score')
      .eq('league', activeLeague)
      .eq('status', 'FINISHED')
      .order('match_date', { ascending: false })
      .limit(60);

    if (finishedMatches) {
      finishedMatches.forEach(m => {
        if (m.home_score === null || m.away_score === null) return;
        
        const homeId = m.home_team_id;
        const awayId = m.away_team_id;

        if (homeId) {
          if (!teamForms[homeId]) teamForms[homeId] = [];
          if (teamForms[homeId].length < 5) {
            const res = m.home_score > m.away_score ? 'W' : m.home_score === m.away_score ? 'D' : 'L';
            teamForms[homeId].push(res);
          }
        }
        if (awayId) {
          if (!teamForms[awayId]) teamForms[awayId] = [];
          if (teamForms[awayId].length < 5) {
            const res = m.away_score > m.home_score ? 'W' : m.home_score === m.away_score ? 'D' : 'L';
            teamForms[awayId].push(res);
          }
        }
      });
    }
  } catch (err) {
    console.error('Error fetching standings/matches for streak:', err);
    standings = MOCK_STANDINGS.filter(s => s.league === activeLeague);
  }

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
          <Link
            key={code}
            href={`/standings?league=${code}`}
            className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all duration-200 cursor-pointer ${
              activeLeague === code
                ? 'bg-primary border-primary text-white shadow-sm'
                : 'bg-card-bg-custom text-text-custom border-border-custom hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {name}
          </Link>
        ))}
      </div>

      {/* TABLE PANEL */}
      <div className="bg-card-bg-custom border border-border-custom rounded-2xl overflow-hidden">
        {standings.length === 0 ? (
          <div className="text-center py-20 text-secondary">
            Tidak ada data klasemen untuk liga ini.
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
                  <th className="py-4 px-4 text-center w-36">5 Laga Terakhir</th>
                  <th className="py-4 px-5 text-center w-20 font-extrabold text-text-custom">Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom text-xs">
                {standings.map((team, idx) => {
                  const goalDiff = team.goals_for - team.goals_against;
                  const isTop4 = idx < 4;
                  const isRelegation = idx >= standings.length - 3;
                  
                  // Dapatkan streak terbalik (oldest-to-newest)
                  const rawForm = teamForms[team.team_id] || ['W', 'D', 'W', 'L', 'W'];
                  const formList = rawForm.slice().reverse();

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
                          <Image 
                            src={team.teams?.logo_url || 'https://crests.football-data.org/placeholder.png'} 
                            alt={team.teams?.name || 'Team Logo'} 
                            width={20}
                            height={20}
                            className="object-contain"
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
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {formList.map((f, i) => (
                            <span 
                              key={i} 
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm ${
                                f === 'W' 
                                  ? 'bg-success' 
                                  : f === 'D' 
                                    ? 'bg-secondary' 
                                    : 'bg-danger'
                              }`}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
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
      <Footer showZones={true} />
    </div>
  );
}
