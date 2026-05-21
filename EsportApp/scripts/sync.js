/**
 * Sync esport matches from Pandascore → Supabase
 *
 * Couvre Valorant + CS2, filtré sur les tiers S et A uniquement
 * (les "plus grosses compétitions"), fenêtre -3 / +14 jours.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

const PANDASCORE_TOKEN = process.env.PANDASCORE_TOKEN;
if (!PANDASCORE_TOKEN) {
  console.error('PANDASCORE_TOKEN manquant dans .env.local');
  process.exit(1);
}

const api = axios.create({
  baseURL: 'https://api.pandascore.co',
  headers: { Authorization: `Bearer ${PANDASCORE_TOKEN}` },
  timeout: 20000,
});

const PER_PAGE = 100;
const PAST_DAYS = 3;
const FUTURE_DAYS = 14;
const ALLOWED_TIERS = new Set(['s', 'a']);

// Patterns toujours inclus même si Pandascore les classe hors S/A.
// Pandascore sous-évalue parfois des circuits officiels (Riot Game Changers
// classé Tier D, par ex.) — on les fait passer manuellement.
const ALWAYS_INCLUDE_PATTERNS = [
  /game changers/i,
];

const GAMES = [
  // Tier 1
  { key: 'valorant', endpoint: '/valorant/matches' },
  { key: 'cs2', endpoint: '/csgo/matches' },
  { key: 'lol', endpoint: '/lol/matches' },
  { key: 'rl', endpoint: '/rl/matches' },
  // Tier 2
  { key: 'dota2', endpoint: '/dota2/matches' },
  { key: 'ow', endpoint: '/ow/matches' },
  { key: 'r6', endpoint: '/r6siege/matches' },
];

const fetchPaginated = async (endpoint, params = {}) => {
  const all = [];
  for (let page = 1; page <= 5; page++) {
    const { data } = await api.get(endpoint, { params: { ...params, per_page: PER_PAGE, page } });
    if (!data?.length) break;
    all.push(...data);
    if (data.length < PER_PAGE) break;
  }
  return all;
};

const mapStatus = (s) => {
  if (s === 'running') return 'running';
  if (s === 'finished') return 'finished';
  return 'not_started';
};

const pickLogo = (team) => team?.dark_mode_image_url || team?.image_url || null;

const mapMatch = (m) => {
  const op1 = m.opponents?.[0]?.opponent;
  const op2 = m.opponents?.[1]?.opponent;
  const score1 = m.results?.find((r) => r.team_id === op1?.id)?.score ?? 0;
  const score2 = m.results?.find((r) => r.team_id === op2?.id)?.score ?? 0;
  const stream = m.streams_list?.find((s) => s.official) || m.streams_list?.[0];
  return {
    id: String(m.id),
    tournament_id: String(m.tournament_id),
    begin_at: m.begin_at || m.scheduled_at,
    status: mapStatus(m.status),
    best_of: m.number_of_games || 1,
    opponent1_name: op1?.name || 'TBD',
    opponent1_logo: pickLogo(op1),
    opponent1_score: score1,
    opponent2_name: op2?.name || 'TBD',
    opponent2_logo: pickLogo(op2),
    opponent2_score: score2,
    stream_url: stream?.raw_url || null,
    updated_at: new Date().toISOString(),
  };
};

const composeTournamentName = (m) => {
  const tName = m.tournament?.name?.trim();
  const sName = m.serie?.full_name?.trim();
  const lName = m.league?.name?.trim();

  // Si serie.full_name est juste un nombre/année ("2026", "57"), il faut
  // y préfixer le nom de la league sinon ça ne veut rien dire.
  const serieIsTrivial = sName && /^\d+$/.test(sName);
  let main;
  if (serieIsTrivial && lName) main = `${lName} ${sName}`;
  else if (sName && lName && !sName.toLowerCase().includes(lName.toLowerCase())) main = `${lName} · ${sName}`;
  else main = sName || lName || 'Tournament';

  if (!tName || main.toLowerCase().includes(tName.toLowerCase())) return main;
  return `${main} · ${tName}`;
};

const mapTournament = (m, game) => {
  const t = m.tournament;
  if (!t) return null;
  return {
    id: String(t.id),
    name: composeTournamentName(m),
    game,
    tier: (t.tier || '').toLowerCase() || null,
    image_url: m.league?.image_url || null,
  };
};

const upsertChunked = async (table, rows, conflictKey = 'id') => {
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from(table).upsert(slice, { onConflict: conflictKey });
    if (error) {
      console.error(`Erreur upsert ${table} chunk ${i}:`, error.message);
      throw error;
    }
  }
};

const syncGame = async ({ key, endpoint }) => {
  console.log(`\n--- 🎮 ${key.toUpperCase()} ---`);
  const now = new Date();
  const fromDate = new Date(now);
  fromDate.setDate(now.getDate() - PAST_DAYS);
  const toDate = new Date(now);
  toDate.setDate(now.getDate() + FUTURE_DAYS);
  const range = `${fromDate.toISOString().slice(0, 10)},${toDate.toISOString().slice(0, 10)}`;

  const all = await fetchPaginated(endpoint, { 'range[begin_at]': range, sort: 'begin_at' });
  console.log(`  fetched : ${all.length}`);

  const filtered = all.filter((m) => {
    const tier = (m.tournament?.tier || '').toLowerCase();
    if (ALLOWED_TIERS.has(tier)) return true;
    const haystack = `${m.serie?.full_name || ''} ${m.league?.name || ''} ${m.tournament?.name || ''}`;
    return ALWAYS_INCLUDE_PATTERNS.some((p) => p.test(haystack));
  });
  console.log(`  tier S/A + whitelist : ${filtered.length}`);

  if (!filtered.length) return { tournaments: [], matches: [] };

  const tournamentsMap = new Map();
  filtered.forEach((m) => {
    const t = mapTournament(m, key);
    if (t) tournamentsMap.set(t.id, t);
  });
  const tournaments = Array.from(tournamentsMap.values());
  const matches = filtered.map(mapMatch);

  await upsertChunked('tournaments', tournaments);
  await upsertChunked('matches', matches);

  const byStatus = matches.reduce((acc, m) => ((acc[m.status] = (acc[m.status] || 0) + 1), acc), {});
  console.log(`  ✅ ${tournaments.length} tournois / ${matches.length} matchs upserted`, byStatus);
  return { tournaments, matches };
};

const cleanupNonTopTier = async () => {
  console.log('\n--- 🧹 Cleanup tournois hors S/A (sauf whitelist) ---');
  const { data: all } = await supabase.from('tournaments').select('id, name, tier');
  const ids = (all || [])
    .filter((t) => {
      const tier = (t.tier || '').toLowerCase();
      if (ALLOWED_TIERS.has(tier)) return false;
      if (ALWAYS_INCLUDE_PATTERNS.some((p) => p.test(t.name || ''))) return false;
      return true;
    })
    .map((t) => t.id);
  if (!ids.length) {
    console.log('  rien à nettoyer');
    return;
  }
  const CHUNK = 200;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const slice = ids.slice(i, i + CHUNK);
    await supabase.from('matches').delete().in('tournament_id', slice);
    await supabase.from('tournaments').delete().in('id', slice);
  }
  console.log(`  🗑️  ${ids.length} tournois (et leurs matchs) supprimés`);
};

(async () => {
  console.log('--- ⚡ Pandascore → Supabase sync (S/A tiers only) ---');
  await cleanupNonTopTier();
  for (const game of GAMES) {
    try {
      await syncGame(game);
    } catch (err) {
      console.error(`[${game.key}] failed :`, err.message);
      if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
    }
  }
  console.log('\n--- Done ---');
})().catch((err) => {
  console.error('Fatal :', err.message);
  process.exit(1);
});
