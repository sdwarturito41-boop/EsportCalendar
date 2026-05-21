/**
 * SCRIPT DE SECOURS : MOCK SYNC SUPABASE
 * Ce script remplit ta base Supabase avec des données réalistes pour AUJOURD'HUI.
 * Utilise-le en attendant que Liquipedia te débloque (Erreur 429).
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const MOCK_TOURNAMENTS = [
  { id: 'VCT_Champions_2026', name: 'VALORANT Champions 2026', game: 'valorant', tier: 'S' },
  { id: 'VCT_Masters_Santiago', name: 'VCT Masters Santiago', game: 'valorant', tier: 'S' },
  { id: 'VCL_Korea_Split_1', name: 'VCL Korea: Split 1', game: 'valorant', tier: 'A' },
  { id: 'VCL_France_Revolution', name: 'VCL France: Revolution', game: 'valorant', tier: 'A' },
];

const MOCK_MATCHES = [
  // MATCHS AUJOURD'HUI
  {
    id: 'mock_1',
    tournament_id: 'VCT_Champions_2026',
    begin_at: new Date().toISOString(), // Maintenant
    status: 'running',
    opponent1_name: 'Fnatic',
    opponent1_logo: 'https://liquipedia.net/commons/images/thumb/f/f9/Fnatic_2020_allmode.png/100px-Fnatic_2020_allmode.png',
    opponent1_score: 1,
    opponent2_name: 'Karmine Corp',
    opponent2_logo: 'https://liquipedia.net/commons/images/thumb/d/d3/Karmine_Corp_2023_allmode.png/100px-Karmine_Corp_2023_allmode.png',
    opponent2_score: 0,
  },
  {
    id: 'mock_2',
    tournament_id: 'VCT_Masters_Santiago',
    begin_at: new Date(Date.now() + 3600000).toISOString(), // Dans 1h
    status: 'not_started',
    opponent1_name: 'Sentinels',
    opponent1_logo: 'https://liquipedia.net/commons/images/thumb/7/77/Sentinels_2020_allmode.png/100px-Sentinels_2020_allmode.png',
    opponent1_score: 0,
    opponent2_name: 'LOUD',
    opponent2_logo: 'https://liquipedia.net/commons/images/thumb/d/d7/LOUD_allmode.png/100px-LOUD_allmode.png',
    opponent2_score: 0,
  },
  {
    id: 'mock_3',
    tournament_id: 'VCL_Korea_Split_1',
    begin_at: new Date(Date.now() + 7200000).toISOString(), // Dans 2h
    status: 'not_started',
    opponent1_name: 'T1 Academy',
    opponent1_logo: 'https://liquipedia.net/commons/images/thumb/e/e4/T1_2019_allmode.png/100px-T1_2019_allmode.png',
    opponent1_score: 0,
    opponent2_name: 'DRX Academy',
    opponent2_logo: 'https://liquipedia.net/commons/images/thumb/1/1f/DRX_2023_lightmode.png/100px-DRX_2023_lightmode.png',
    opponent2_score: 0,
  },
];

async function seed() {
  console.log('--- 🚀 SEEDING DE TEST (MOCK) ---');
  
  try {
    // 1. Clean (Optionnel, à commenter si tu veux garder tes vrais matchs)
    // await supabase.from('matches').delete().neq('id', '0');

    // 2. Insert Tournois
    console.log('Insertion des tournois...');
    await supabase.from('tournaments').upsert(MOCK_TOURNAMENTS);

    // 3. Insert Matchs
    console.log('Insertion des matchs pour AUJOURD\'HUI...');
    await supabase.from('matches').upsert(MOCK_MATCHES);

    console.log('--- ✅ TERMINÉ ! Tu peux ouvrir ton App Expo maintenant. ---');
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

seed();
