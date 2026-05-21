const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const ABBREVIATIONS = [
  [/\bEsports World Cup\b/gi, 'EWC'],
  [/\bGame Changers\b/gi, 'GC'],
  [/\bNorth America\b/gi, 'NA'],
  [/\bLatin America\b/gi, 'LATAM'],
  [/\bAsia[- ]Pacific\b/gi, 'APAC'],
  [/\b20\d{2}\b/g, ''],
];

const abbreviate = (s) =>
  ABBREVIATIONS.reduce((acc, [re, repl]) => acc.replace(re, repl), s || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*·\s*·\s*/g, ' · ')
    .replace(/^\s*·\s*|\s*·\s*$/g, '')
    .trim();

(async () => {
  const { data } = await supabase.from('tournaments').select('id, name');
  const updates = (data || [])
    .map((t) => ({ id: t.id, oldName: t.name, newName: abbreviate(t.name) }))
    .filter((u) => u.newName !== u.oldName);

  console.log(`${updates.length} tournois à renommer`);
  for (const u of updates) {
    await supabase.from('tournaments').update({ name: u.newName }).eq('id', u.id);
    console.log(`  ${u.oldName} → ${u.newName}`);
  }
  console.log('done');
})();
