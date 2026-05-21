/**
 * Scrape VLR.gg pour récupérer les map names et scores per map sur les
 * matchs Valorant terminés en DB. Compensation du free plan Pandascore
 * qui ne donne pas ces infos.
 *
 * Pipeline :
 * 1. SELECT finished Valorant matches NOT yet in match_maps
 * 2. Crawl /matches/results pages → index { teams + scores → URL }
 * 3. Pour chaque match à enrichir, lookup l'URL via l'index
 * 4. Fetch la page match VLR, parse les maps, insert dans match_maps
 *
 * Rate limit : 600ms entre chaque request pour rester poli.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

const VLR = axios.create({
  baseURL: 'https://www.vlr.gg',
  headers: {
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148',
  },
  timeout: 15000,
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const normalize = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');

// Parse une page de résultats /matches/results. Retourne array {url, team1, team2, score1, score2}.
const parseResultsPage = (html) => {
  const items = [];
  // Chaque match est un <a href="/12345/team-a-vs-team-b-event-slug" class="...match-item...">
  const blocks = html.match(/<a href="\/(\d+)\/[^"]+" class="[^"]*match-item[^"]*"[^>]*>[\s\S]*?<\/a>/g) || [];
  for (const block of blocks) {
    const urlMatch = block.match(/<a href="(\/\d+\/[^"]+)"/);
    if (!urlMatch) continue;
    const url = urlMatch[1];
    // Récupère les 2 teams avec leur score
    const teams = [
      ...block.matchAll(
        /<div class="match-item-vs-team[^"]*">[\s\S]*?<div class="text-of">\s*(?:<span [^>]*><\/span>)?\s*([^<]+?)\s*<\/div>[\s\S]*?<div class="match-item-vs-team-score[^"]*">\s*([\d–]+)\s*<\/div>/g,
      ),
    ];
    if (teams.length < 2) continue;
    const t1 = teams[0][1].trim();
    const s1Raw = teams[0][2].trim();
    const t2 = teams[1][1].trim();
    const s2Raw = teams[1][2].trim();
    const s1 = parseInt(s1Raw, 10);
    const s2 = parseInt(s2Raw, 10);
    if (Number.isNaN(s1) || Number.isNaN(s2)) continue;
    items.push({ url, team1: t1, team2: t2, score1: s1, score2: s2 });
  }
  return items;
};

// Parse une page match VLR. Retourne [{position, map_name, score1, score2, team1_name, team2_name}]
const parseMatchPage = (html) => {
  const games = [];
  const blocks = html.split(/<div class="vm-stats-game " data-game-id="(\d+)">/).slice(1);
  for (let i = 0; i < blocks.length; i += 2) {
    const block = blocks[i + 1] || '';
    const headerMatch = block.match(/<div class="vm-stats-game-header">([\s\S]*?)<\/div>\s*<\/div>\s*<div style="text-align: center/);
    const headerBlock = headerMatch ? headerMatch[1] : block.slice(0, 3000);

    // Map name
    const mapMatch = headerBlock.match(
      /<div class="map">[\s\S]*?<span style="position: relative;">\s*([A-Za-z]+)/,
    );
    const mapName = mapMatch ? mapMatch[1].trim() : null;

    // Split en 2 blocs team (gauche puis droite). Pour chaque bloc on cherche
    // team-name + score indépendamment (l'ordre diffère entre team1 et team2).
    // Regex stricte : 'team' suivi de ('') ou (' mod-xxx'), pas 'team-name'.
    const teamChunks = headerBlock.split(/<div class="team(?:\s+mod-[a-z]+)?"[^>]*>/).slice(1);
    const teams = teamChunks
      .map((chunk) => {
        const nameMatch = chunk.match(/<div class="team-name"[^>]*>\s*([^<]+?)\s*</);
        const scoreMatch = chunk.match(/<div class="score[^"]*"[^>]*>\s*(\d+)/);
        if (!nameMatch || !scoreMatch) return null;
        return { name: nameMatch[1].trim(), score: parseInt(scoreMatch[1], 10) };
      })
      .filter(Boolean);

    if (!mapName || teams.length < 2) continue;
    games.push({
      position: games.length + 1,
      map_name: mapName,
      team1_name: teams[0].name,
      score1_raw: teams[0].score,
      team2_name: teams[1].name,
      score2_raw: teams[1].score,
    });
  }
  return games;
};

(async () => {
  console.log('--- VLR.gg → Supabase sync ---');

  // 1. Récupère les matchs Valorant terminés sans maps en DB
  const { data: finished } = await supabase
    .from('matches')
    .select('id, begin_at, opponent1_name, opponent2_name, opponent1_score, opponent2_score, tournaments(game)')
    .eq('status', 'finished')
    .eq('tournaments.game', 'valorant');

  if (!finished?.length) {
    console.log('Aucun match Valorant fini en DB.');
    return;
  }

  // Filtre ceux qui n'ont pas déjà de maps
  const { data: existingMaps } = await supabase.from('match_maps').select('match_id');
  const haveMaps = new Set((existingMaps || []).map((m) => m.match_id));
  const toFetch = finished.filter((m) => !haveMaps.has(m.id));
  console.log(`${toFetch.length}/${finished.length} matchs Valo à enrichir`);

  if (!toFetch.length) {
    console.log('Tout est déjà enrichi.');
    return;
  }

  // 2. Crawl les résultats VLR (plus de pages pour couvrir plus de matchs anciens)
  const vlrAll = [];
  for (let page = 1; page <= 10; page++) {
    console.log(`  fetch /matches/results?page=${page}`);
    const { data: html } = await VLR.get(`/matches/results?page=${page}`);
    const items = parseResultsPage(html);
    items.forEach((it) => {
      it.t1n = normalize(it.team1);
      it.t2n = normalize(it.team2);
    });
    vlrAll.push(...items);
    await sleep(600);
  }
  console.log(`Index VLR : ${vlrAll.length} matchs récents`);

  // Match souple : substring + score correspondant dans n'importe quel ordre
  const matchesTeams = (a, b) => a.includes(b) || b.includes(a);
  const findVlr = (oppA, oppB, sA, sB) => {
    const an = normalize(oppA);
    const bn = normalize(oppB);
    return vlrAll.find((it) => {
      const fwd = matchesTeams(it.t1n, an) && matchesTeams(it.t2n, bn) && it.score1 === sA && it.score2 === sB;
      const rev = matchesTeams(it.t1n, bn) && matchesTeams(it.t2n, an) && it.score1 === sB && it.score2 === sA;
      return fwd || rev;
    });
  };

  // 3. Pour chaque match à enrichir, find l'URL VLR
  let enriched = 0;
  let notFound = 0;
  for (const m of toFetch) {
    const vlrMatch = findVlr(m.opponent1_name, m.opponent2_name, m.opponent1_score, m.opponent2_score);
    if (!vlrMatch) {
      notFound++;
      continue;
    }

    // 4. Fetch la page détail VLR
    try {
      const { data: matchHtml } = await VLR.get(vlrMatch.url);
      const games = parseMatchPage(matchHtml);
      if (!games.length) {
        notFound++;
        continue;
      }

      // 5. Aligne les scores VLR sur opponent1/opponent2 du DB
      const opp1N = normalize(m.opponent1_name);
      const rows = games.map((g) => {
        const t1N = normalize(g.team1_name);
        const alignedToOpp1 = opp1N.includes(t1N) || t1N.includes(opp1N);
        return {
          match_id: m.id,
          position: g.position,
          map_name: g.map_name,
          score1: alignedToOpp1 ? g.score1_raw : g.score2_raw,
          score2: alignedToOpp1 ? g.score2_raw : g.score1_raw,
          fetched_at: new Date().toISOString(),
        };
      });

      const { error } = await supabase.from('match_maps').upsert(rows, {
        onConflict: 'match_id,position',
      });
      if (error) {
        console.warn(`  ⚠️  ${m.id} :`, error.message);
        continue;
      }
      enriched++;
      console.log(`  ✓ ${m.opponent1_name} vs ${m.opponent2_name} (${rows.length} maps)`);
      await sleep(600);
    } catch (e) {
      console.warn(`  ⚠️  fetch ${vlrMatch.url} :`, e.message);
      notFound++;
    }
  }

  console.log(`\n--- Done : ${enriched} enrichis, ${notFound} non trouvés ---`);
})().catch((err) => {
  console.error('Fatal :', err.message);
  if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2).slice(0, 500));
  process.exit(1);
});
