import { createClient } from '@supabase/supabase-js';
import { NewsItem } from '@/components/ui/NewsCard';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { ts: number; items: NewsItem[] } | null = null;

export async function fetchNews(force = false): Promise<NewsItem[]> {
  if (!force && cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return cache.items;
  }
  if (!supabase) return cache?.items || [];

  try {
    const { data, error } = await supabase
      .from('news')
      .select('id, title, description, url, image_url, source_name, lang, published_at')
      .order('published_at', { ascending: false })
      .limit(30);
    if (error) throw error;

    const items: NewsItem[] = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      category: (row.source_name || 'VALORANT').toUpperCase(),
      publishedAt: row.published_at,
      imageUrl: row.image_url || null,
      url: row.url,
    }));
    cache = { ts: Date.now(), items };
    return items;
  } catch (err) {
    console.warn('[news] supabase fetch failed:', err);
    return cache?.items || [];
  }
}
