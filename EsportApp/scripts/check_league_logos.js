const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

(async () => {
  const { data } = await supabase
    .from('tournaments')
    .select('id, name, game, image_url, tier')
    .order('game');
  const byGame = {};
  for (const t of data || []) {
    if (!byGame[t.game]) byGame[t.game] = [];
    if (t.image_url) byGame[t.game].push({ name: t.name, image_url: t.image_url, tier: t.tier });
  }
  for (const g of Object.keys(byGame).sort()) {
    console.log(`\n=== ${g} (${byGame[g].length} avec logo) ===`);
    byGame[g].slice(0, 3).forEach((t) => console.log(`  ${t.tier} ${t.name}\n    ${t.image_url}`));
  }
})();
