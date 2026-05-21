/**
 * Sync rapide : ne met à jour que les matchs LIVE (status='running' en DB).
 * 1 seul appel Pandascore (batch via filter[id]), donc safe pour le quota.
 * Lancé toutes les 5 min via GitHub Actions.
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

const mapStatus = (s) => {
  if (s === 'running') return 'running';
  if (s === 'finished') return 'finished';
  return 'not_started';
};

(async () => {
  // 1. Récupère les IDs des matchs LIVE en DB.
  const { data: liveRows, error: qErr } = await supabase
    .from('matches')
    .select('id')
    .eq('status', 'running');

  if (qErr) {
    console.error('Erreur lecture Supabase :', qErr.message);
    process.exit(1);
  }

  const ids = (liveRows || []).map((r) => r.id);
  if (!ids.length) {
    console.log('Aucun match LIVE — rien à sync.');
    return;
  }
  console.log(`🔴 ${ids.length} match(s) LIVE à refresh`);

  // 2. Batch fetch sur Pandascore (1 seul appel pour jusqu'à 100 IDs).
  const { data: matches } = await api.get('/matches', {
    params: { 'filter[id]': ids.join(','), per_page: 100 },
  });

  if (!matches?.length) {
    console.log('Pandascore ne renvoie aucun match — peut-être supprimés.');
    return;
  }

  // 3. Update minimum nécessaire : status + scores + stream.
  const updates = matches.map((m) => {
    const op1 = m.opponents?.[0]?.opponent;
    const op2 = m.opponents?.[1]?.opponent;
    const score1 = m.results?.find((r) => r.team_id === op1?.id)?.score ?? 0;
    const score2 = m.results?.find((r) => r.team_id === op2?.id)?.score ?? 0;
    const stream = m.streams_list?.find((s) => s.official) || m.streams_list?.[0];
    return {
      id: String(m.id),
      status: mapStatus(m.status),
      opponent1_score: score1,
      opponent2_score: score2,
      stream_url: stream?.raw_url || null,
      updated_at: new Date().toISOString(),
    };
  });

  // Update row par row (les autres champs ne sont pas touchés).
  for (const u of updates) {
    const { error: uErr } = await supabase
      .from('matches')
      .update({
        status: u.status,
        opponent1_score: u.opponent1_score,
        opponent2_score: u.opponent2_score,
        stream_url: u.stream_url,
        updated_at: u.updated_at,
      })
      .eq('id', u.id);
    if (uErr) console.warn(`  ⚠️  ${u.id} :`, uErr.message);
  }

  const byStatus = updates.reduce((acc, m) => ((acc[m.status] = (acc[m.status] || 0) + 1), acc), {});
  console.log(`✅ ${updates.length} matchs mis à jour`, byStatus);
})().catch((err) => {
  console.error('Fatal :', err.message);
  if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
