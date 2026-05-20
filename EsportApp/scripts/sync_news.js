/**
 * Sync news from GNews API → Supabase
 *
 * Free plan : 100 req/jour. Lancé toutes les 15min = 96 req/j = ✓.
 * Articles avec 12h de délai sur le plan free, acceptable pour l'esport.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

const TOKEN = process.env.GNEWS_TOKEN;
if (!TOKEN) {
  console.error('GNEWS_TOKEN manquant dans .env.local');
  process.exit(1);
}

// Query ciblée Valorant esport, sans match listings.
const QUERY = 'Valorant OR "VCT EMEA" OR "VCT Pacific" OR "VCT Americas" OR "VALORANT Champions"';

const api = axios.create({
  baseURL: 'https://gnews.io/api/v4',
  timeout: 15000,
});

const mapArticle = (a) => ({
  id: a.id,
  title: a.title,
  description: a.description || null,
  url: a.url,
  image_url: a.image || null,
  source_name: a.source?.name || null,
  lang: a.lang || null,
  published_at: a.publishedAt,
});

(async () => {
  console.log('--- 📰 GNews → Supabase sync ---');
  try {
    const { data } = await api.get('/search', {
      params: { q: QUERY, lang: 'en', max: 10, token: TOKEN, sortby: 'publishedAt' },
    });
    const articles = data?.articles || [];
    console.log(`  → ${articles.length} articles récupérés (total disponible : ${data?.totalArticles || '?'})`);

    if (!articles.length) {
      console.log('Aucun article. Stop.');
      return;
    }

    const rows = articles.map(mapArticle);
    const { error } = await supabase.from('news').upsert(rows, { onConflict: 'id' });
    if (error) throw error;

    console.log(`  ✅ ${rows.length} articles upserted`);
  } catch (err) {
    console.error('Sync failed:', err.message);
    if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
    process.exit(1);
  }
})();
