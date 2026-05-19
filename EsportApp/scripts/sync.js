/**
 * Sync Valorant matches from Pandascore → Supabase
 *
 * Fetches running, upcoming, and recent finished matches and upserts
 * them along with their tournaments into the Supabase tables.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
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

// Préfère la variante claire (dark_mode_image_url) pour qu'elle ressorte sur fond sombre.
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

// Compose un nom complet : "EMEA: Stage 1 2026 · Group C" plutôt que juste "Group C".
const composeTournamentName = (m) => {
  const tName = m.tournament?.name?.trim();
  const sName = m.serie?.full_name?.trim();
  const lName = m.league?.name?.trim();
  const main = sName || lName || 'Tournament';
  if (!tName || main.toLowerCase().includes(tName.toLowerCase())) return main;
  return `${main} · ${tName}`;
};

const mapTournament = (m) => {
  const t = m.tournament;
  if (!t) return null;
  return {
    id: String(t.id),
    name: composeTournamentName(m),
    game: 'valorant',
    tier: t.tier || null,
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

(async () => {
  console.log('--- ⚡ Pandascore → Supabase sync ---');

  const now = new Date();
  const fromDate = new Date(now);
  fromDate.setDate(now.getDate() - PAST_DAYS);
  const toDate = new Date(now);
  toDate.setDate(now.getDate() + FUTURE_DAYS);

  const range = `${fromDate.toISOString().slice(0, 10)},${toDate.toISOString().slice(0, 10)}`;
  console.log(`Window: ${range}`);

  console.log('Fetching matches…');
  const matches = await fetchPaginated('/valorant/matches', {
    'range[begin_at]': range,
    sort: 'begin_at',
  });
  console.log(`  → ${matches.length} matchs récupérés`);

  if (!matches.length) {
    console.log('Aucun match dans la fenêtre. Stop.');
    return;
  }

  const tournamentsMap = new Map();
  matches.forEach((m) => {
    const t = mapTournament(m);
    if (t) tournamentsMap.set(t.id, t);
  });
  const tournaments = Array.from(tournamentsMap.values());

  console.log(`Upserting ${tournaments.length} tournois…`);
  await upsertChunked('tournaments', tournaments);

  const matchRows = matches.map(mapMatch);
  console.log(`Upserting ${matchRows.length} matchs…`);
  await upsertChunked('matches', matchRows);

  const byStatus = matchRows.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1;
    return acc;
  }, {});
  console.log('--- ✅ Done', byStatus);
})().catch((err) => {
  console.error('Sync failed:', err.message);
  if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
