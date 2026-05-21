import { supabase } from './supabase';

export interface Profile {
  id: string;
  favorite_games: string[];
  favorite_teams: string[];
  onboarded_at: string | null;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, favorite_games, favorite_teams, onboarded_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[profile] fetch error:', error.message);
    return null;
  }
  return data as Profile | null;
}

export async function ensureProfile(userId: string): Promise<Profile | null> {
  const existing = await getProfile(userId);
  if (existing) return existing;
  const { error } = await supabase.from('profiles').insert({ id: userId });
  if (error) {
    console.warn('[profile] insert error:', error.message);
    return null;
  }
  return getProfile(userId);
}

export async function saveOnboarding(
  userId: string,
  games: string[],
  teams: string[],
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({
      favorite_games: games,
      favorite_teams: teams,
      onboarded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  return { error: error?.message };
}

export async function listTeamsForGames(games: string[]): Promise<{ name: string; logo: string | null; game: string }[]> {
  if (!games.length) return [];
  const { data } = await supabase
    .from('matches')
    .select(`
      opponent1_name, opponent1_logo,
      opponent2_name, opponent2_logo,
      tournaments!inner ( game )
    `)
    .in('tournaments.game', games);
  if (!data) return [];

  const map = new Map<string, { name: string; logo: string | null; game: string }>();
  for (const row of data as any[]) {
    const g = Array.isArray(row.tournaments) ? row.tournaments[0]?.game : row.tournaments?.game;
    if (!g) continue;
    for (const side of [1, 2] as const) {
      const name = row[`opponent${side}_name`];
      const logo = row[`opponent${side}_logo`];
      if (!name || name === 'TBD') continue;
      const key = `${g}:${name}`;
      if (!map.has(key)) map.set(key, { name, logo, game: g });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}
