import { NewsItem } from '@/components/ui/NewsCard';

const FEED_URL =
  'https://news.google.com/rss/search?q=valorant+esports&hl=fr-FR&gl=FR&ceid=FR:fr';
const CACHE_TTL_MS = 10 * 60 * 1000;

let cache: { ts: number; items: NewsItem[] } | null = null;

const decodeEntities = (s: string): string =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

const stripTags = (s: string): string => decodeEntities(s.replace(/<[^>]+>/g, '').trim());

const parseItem = (xml: string): NewsItem | null => {
  const title = xml.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  const link = xml.match(/<link>([\s\S]*?)<\/link>/)?.[1];
  const pubDate = xml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
  const sourceMatch = xml.match(/<source[^>]*>([\s\S]*?)<\/source>/);
  const source = sourceMatch ? stripTags(sourceMatch[1]) : 'VALORANT';
  const guid = xml.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] || link || Math.random().toString(36);

  if (!title || !link || !pubDate) return null;

  return {
    id: guid,
    title: stripTags(title),
    category: source.toUpperCase(),
    publishedAt: new Date(pubDate).toISOString(),
    imageUrl: null,
    url: link.trim(),
  };
};

export async function fetchNews(force = false): Promise<NewsItem[]> {
  if (!force && cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return cache.items;
  }
  try {
    const res = await fetch(FEED_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148',
      },
    });
    if (!res.ok) throw new Error(`Feed ${res.status}`);
    const xml = await res.text();
    const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    const items = itemBlocks
      .map(parseItem)
      .filter((it): it is NewsItem => it !== null)
      .slice(0, 20);
    cache = { ts: Date.now(), items };
    return items;
  } catch (err) {
    console.warn('[news] fetch failed:', err);
    return cache?.items || [];
  }
}
