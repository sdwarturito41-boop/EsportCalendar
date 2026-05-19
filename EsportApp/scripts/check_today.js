const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  console.log(`Today: ${today.toISOString()} → ${tomorrow.toISOString()}`);

  const { data: todayMatches, error } = await supabase
    .from('matches')
    .select('id, begin_at, status, opponent1_name, opponent2_name, tournaments(name)')
    .gte('begin_at', today.toISOString())
    .lt('begin_at', tomorrow.toISOString())
    .order('begin_at', { ascending: true });

  if (error) {
    console.error('Erreur:', error);
    return;
  }

  console.log(`\n${todayMatches.length} matchs aujourd'hui :\n`);
  todayMatches.forEach((m) => {
    const t = new Date(m.begin_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const tournament = Array.isArray(m.tournaments) ? m.tournaments[0]?.name : m.tournaments?.name;
    console.log(`  ${t} [${m.status}] ${m.opponent1_name} vs ${m.opponent2_name} · ${tournament || '?'}`);
  });

  console.log('\n--- 3 prochains jours :');
  const in3 = new Date(today);
  in3.setDate(in3.getDate() + 3);

  const { data: upcoming } = await supabase
    .from('matches')
    .select('id, begin_at, status, opponent1_name, opponent2_name, tournaments(name)')
    .gte('begin_at', today.toISOString())
    .lt('begin_at', in3.toISOString())
    .order('begin_at', { ascending: true })
    .limit(15);

  upcoming.forEach((m) => {
    const d = new Date(m.begin_at);
    const day = d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
    const t = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const tournament = Array.isArray(m.tournaments) ? m.tournaments[0]?.name : m.tournaments?.name;
    console.log(`  ${day} ${t} [${m.status}] ${m.opponent1_name} vs ${m.opponent2_name} · ${tournament || '?'}`);
  });
})();
