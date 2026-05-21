/**
 * DEBUG SYNC - Vérification des insertions Supabase
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Utilisation des clés EXPO_PUBLIC si les clés standard sont absentes
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERREUR: Variables Supabase manquantes dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BASE_URL = 'https://liquipedia.net';
const LIQUIPEDIA_API_URL = `${BASE_URL}/valorant/api.php`;
const USER_AGENT = 'StrafeApp-Dev/1.0 (votre-email@exemple.com)';

async function runDebug() {
  console.log('--- 1. Test de connexion Supabase ---');
  console.log('URL:', supabaseUrl);
  
  // On récupère juste un match pour tester
  console.log('--- 2. Récupération d\'un match de test ---');
  const response = await axios.get(LIQUIPEDIA_API_URL, {
    params: { action: 'parse', page: 'Liquipedia:Matches', format: 'json' },
    headers: { 'User-Agent': USER_AGENT }
  });

  const html = response.data?.parse?.text?.['*'];
  const matchBlock = html.split('<div class="match-info">')[1];
  
  if (!matchBlock) {
    console.error('Impossible de trouver un match sur Liquipedia');
    return;
  }

  // Extraction rapide pour le test
  const timestamp = matchBlock.match(/data-timestamp="(\d+)"/)?.[1];
  const team1 = matchBlock.match(/title="([^"]+)"/)?.[1] || 'TestTeam1';
  
  const testTournament = {
    id: 'test_tourney',
    name: 'Tournoi de Test',
    game: 'valorant'
  };

  const testMatch = {
    id: `test_${timestamp || Date.now()}`,
    tournament_id: 'test_tourney',
    begin_at: new Date().toISOString(),
    status: 'not_started',
    opponent1_name: team1,
    opponent2_name: 'TestTeam2'
  };

  console.log('--- 3. Insertion forcée dans Supabase ---');
  
  // Insertion Tournoi
  const { data: tData, error: tErr } = await supabase
    .from('tournaments')
    .upsert([testTournament], { onConflict: 'id' })
    .select();

  if (tErr) {
    console.error('Erreur insertion tournoi:', tErr);
  } else {
    console.log('Tournoi inséré/vérifié avec succès:', tData);
  }

  // Insertion Match
  const { data: mData, error: mErr } = await supabase
    .from('matches')
    .upsert([testMatch], { onConflict: 'id' })
    .select();

  if (mErr) {
    console.error('Erreur insertion match:', mErr);
  } else {
    console.log('Match inséré avec succès ! Voici la ligne créée:', mData);
  }

  console.log('\n--- VERDICT ---');
  if (!tErr && !mErr) {
    console.log('L\'insertion a RÉUSSI côté serveur.');
    console.log('Si tu ne vois rien dans le dashboard, vérifie que tu es sur le BON projet Supabase.');
  }
}

runDebug();
