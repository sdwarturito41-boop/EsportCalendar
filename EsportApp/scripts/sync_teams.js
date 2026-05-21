/**
 * Sync players for each team referenced in matches via Pandascore /teams/{id}.
 * Idempotent : re-fetch les équipes dont fetched_at > 7 jours OU pas encore en DB.
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
  console.error('PANDASCORE_TOKEN manquant');
  process.exit(1);
}

const api = axios.create({
  baseURL: 'https://api.pandascore.co',
  headers: { Authorization: `Bearer ${PANDASCORE_TOKEN}` },
  timeout: 15000,
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const STALE_DAYS = 7;

(async () => {
  console.log('--- Pandascore /teams → Supabase team_players ---');

  // 1. IDs distincts des teams en jeu dans nos matches
  const { data: rows } = await supabase.from('matches').select('opponent1_id, opponent2_id');
  const teamIds = new Set();
  (rows || []).forEach((r) => {
    if (r.opponent1_id) teamIds.add(r.opponent1_id);
    if (r.opponent2_id) teamIds.add(r.opponent2_id);
  });
  console.log(`${teamIds.size} équipes distinctes référencées`);

  // 2. Filtre celles déjà à jour
  const { data: existing } = await supabase.from('team_players').select('team_id, fetched_at');
  const lastFetch = new Map();
  for (const r of existing || []) {
    const ts = new Date(r.fetched_at).getTime();
    if (!lastFetch.has(r.team_id) || lastFetch.get(r.team_id) < ts) lastFetch.set(r.team_id, ts);
  }
  const cutoff = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;
  const toFetch = Array.from(teamIds).filter((id) => !lastFetch.has(id) || lastFetch.get(id) < cutoff);
  console.log(`${toFetch.length} équipes à (re)fetcher`);

  // 3. Fetch + upsert
  let done = 0;
  for (const id of toFetch) {
    try {
      const { data: team } = await api.get(`/teams/${id}`);
      const players = team?.players || [];
      const rowsToUpsert = players
        .filter((p) => p?.id)
        .map((p) => ({
          team_id: id,
          player_id: p.id,
          name: p.name || null,
          image_url: p.image_url || null,
          nationality: p.nationality || null,
          first_name: p.first_name || null,
          last_name: p.last_name || null,
          age: p.age || null,
          active: p.active !== false,
          fetched_at: new Date().toISOString(),
        }));
      if (rowsToUpsert.length) {
        const { error } = await supabase
          .from('team_players')
          .upsert(rowsToUpsert, { onConflict: 'team_id,player_id' });
        if (error) console.warn(`  ⚠️  team ${id} :`, error.message);
      }
      done++;
      if (done % 5 === 0) console.log(`  ${done}/${toFetch.length}`);
      await sleep(400);
    } catch (e) {
      console.warn(`  ⚠️  team ${id} fetch :`, e.message);
    }
  }
  console.log(`✅ ${done} équipes mises à jour`);
})().catch((err) => {
  console.error('Fatal :', err.message);
  process.exit(1);
});
