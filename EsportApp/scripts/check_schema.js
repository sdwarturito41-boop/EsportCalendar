const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  for (const table of ['tournaments', 'matches', 'games', 'rosters']) {
    const { data, error } = await supabase.from(table).select('*').limit(3);
    if (error) {
      console.log(`${table}: ERROR ${error.message}`);
    } else {
      console.log(`${table}: ${data.length} rows fetched`);
      if (data.length) console.log('  sample:', JSON.stringify(data[0]).slice(0, 200));
    }
  }
})();
