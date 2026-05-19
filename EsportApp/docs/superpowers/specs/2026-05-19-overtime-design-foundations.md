# OVERTIME — Design Foundations

Refonte de l'app EsportCalendar : abandon de la DA "STRAFE" (rouge, fonds slate, glow agressifs autour des logos teams) au profit d'une DA "OVERTIME" plus épurée et premium (electric indigo, fonds quasi-noir, hiérarchie par profondeur, typographie sport/SaaS).

Référence visuelle : maquette Figma fournie par l'utilisateur (file key `pokNMIHEd0Ghhy0lXWPIc5`, layout esports avec match rows en stack vertical et étoile favori).

Scope choisi : **foundations d'abord** — on livre les design tokens + un set de composants partagés réutilisables, puis on migre les écrans existants pour qu'ils consomment ces composants. Pas de nouvelle feature dans ce chantier.

## Direction artistique

**Couleurs (tokens définitifs)**

| Token | Valeur | Usage |
|-------|--------|-------|
| `bg.page` | `#08080B` | Fond d'écran (L0) |
| `bg.surface` | `#161619` | Cards, sections (L1) |
| `bg.elevated` | `#1E1E24` | Modals, état actif, dropdown (L2) |
| `border.subtle` | `#2A2A30` | Hairlines 1px max, jamais plus épais |
| `text.primary` | `#F0F0F5` | Titres, scores winner, valeurs clés |
| `text.muted` | `#6A6A78` | Labels, scores loser, timestamps, info secondaire |
| `accent.indigo` | `#5C5CE8` | CTA, tab actif, étoile favori, underline de tab |
| `semantic.live` | `#1DB86E` | Dot + label LIVE |
| `semantic.loss` | `#E8404A` | État error, badge "L" historique |

**Typographie**

- Display (wordmark, scores, temps) : **Bebas Neue** (Google Fonts, poids 400 unique). Fallback secondaire envisageable plus tard : Barlow Condensed.
- UI (body, labels, titres, tags) : **Geist** (Vercel, open-source via Google Fonts, poids 500 et 700)
- Aucun autre weight nulle part. Le `fontWeight: '900'` du code actuel disparaît — la verticalité du score vient de Bebas Neue, pas du weight.

**Principes**

- Profondeur par fond, pas par bordure. Les bordures, quand elles existent, font 1px en `border.subtle`.
- Pas d'ombres dans v1. Si on en ajoute plus tard, ce sera des `Shadows.subtle` en token, pas en inline style.
- Pas de glow autour des logos teams (suppression du `shadowColor: Colors.accent.primary` actuel).
- Score winner : `text.primary` weight 700 / loser : `text.muted` weight 500. **L'indigo n'est jamais utilisé pour les scores** — il reste pour les états actifs (tab, étoile favori).

## Architecture

### Fichier de tokens

`constants/theme.ts` — source unique de vérité pour la DA. Remplace l'actuel `constants/colors.ts` + `constants/theme.ts`.

```ts
export const Colors = {
  bg: { page: '#08080B', surface: '#161619', elevated: '#1E1E24' },
  border: { subtle: '#2A2A30' },
  text: { primary: '#F0F0F5', muted: '#6A6A78' },
  accent: { indigo: '#5C5CE8' },
  semantic: { live: '#1DB86E', loss: '#E8404A' },
} as const;

export const Typo = {
  display: {
    fontFamily: 'BebasNeue',
    // Bebas Neue n'existe qu'en un poids (400). Ne pas surcharger fontWeight.
    score:    { fontSize: 20, letterSpacing: 0.5 },
    time:     { fontSize: 16, letterSpacing: 0.5 },
    wordmark: { fontSize: 28, letterSpacing: 3 },
    big:      { fontSize: 48, letterSpacing: 1 },
  },
  ui: {
    fontFamily: 'Geist',
    title:    { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
    body:     { fontSize: 15, fontWeight: '500' },
    teamName: { fontSize: 15, fontWeight: '500' },
    label:    { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    caption:  { fontSize: 12, fontWeight: '500' },
  },
} as const;

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const Radii   = { sm: 6, md: 8, lg: 12, xl: 16, pill: 999 } as const;
```

L'ancien `constants/colors.ts` est supprimé. Les imports `from '@/constants/colors'` deviennent `from '@/constants/theme'`.

### Composants partagés

Tous dans `components/ui/`. Chaque composant a une seule responsabilité, expose des props sémantiques (pas de `style` brut sauf cas extrême), et tire ses valeurs uniquement des tokens.

| Composant | Responsabilité | Props clés |
|-----------|---------------|-----------|
| `Text` | Typographie thématisée — point d'entrée unique pour tout texte | `variant`, `tone`, `children` |
| `Surface` | Conteneur avec niveau de profondeur | `level`, `radius?`, `padding?`, `bordered?` |
| `TeamLogo` | Logo d'équipe — image distante ou fallback (initiales) | `uri`, `name`, `size?` |
| `MatchRow` | Une ligne de match complète, navigue vers `/match/[id]` | `match` |
| `LeagueHeader` | Header d'un groupe de tournoi avec étoile favori | `name`, `stage?`, `isFavorite`, `onToggleFavorite` |
| `LiveChip` | Puce verte "LIVE" sous une match row en cours | — |
| `DateBar` | Sélecteur de date minimal (libellé + chevron) | `date`, `onPress` |
| `FilterTabs` | Onglets de filtre avec underline indigo | `value`, `onChange`, `options` |

**Contrats détaillés**

`Text` :
```ts
type TextVariant =
  | 'display.score' | 'display.wordmark' | 'display.big'
  | 'ui.title' | 'ui.body' | 'ui.teamName' | 'ui.label' | 'ui.caption';
type TextTone = 'primary' | 'muted' | 'accent' | 'live' | 'loss';

<Text variant="ui.teamName" tone="primary">Fnatic</Text>
<Text variant="display.score" tone="muted">1</Text>  // loser
<Text variant="ui.label" tone="accent">LIVE</Text>
```

`Surface` :
```ts
type SurfaceLevel = 'page' | 'surface' | 'elevated';
type SurfacePadding = keyof typeof Spacing | 0;

<Surface level="surface" radius="md" padding="lg" bordered>…</Surface>
```

`MatchRow` (layout calé sur réf Figma) :
```
┌────────────────────────────────────────────┐
│ [logo] Fnatic                          2   │   ← team1
│ [logo] Team Liquid                     1   │   ← team2 (loser score = muted weight 500)
│ • LIVE                                     │   ← LiveChip si running
└────────────────────────────────────────────┘
```
Si `status === 'not_started'` : pas de score, l'heure (`begin_at` formatée HH:mm) s'affiche à droite de la **première** row uniquement.

`LeagueHeader` :
```
[•] VCT EMEA • Playoffs - Semi Finals                ⭐
```
Le `•` est un petit carré 16×16 en `border.subtle` (placeholder pour un futur logo de league). L'étoile à droite : indigo filled si favori, outline en `text.muted` sinon. Toggle au tap.

`FilterTabs` (nouveau, remplace tout filtre existant) :
- Options : `favorites | all | live | upcoming | finished`
- Active = `Text variant="ui.label" tone="accent"` + underline 2px indigo
- Inactive = `tone="muted"`
- ScrollView horizontal, snap au tap

`DateBar` (remplace le ScrollView 15 jours actuel) :
- Affiche "AUJOURD'HUI", "DEMAIN", ou "JEU 21 MAI" selon la date
- Tap → ouvre un modal de date picker (UI du picker hors-scope de ce chantier — bouton non-fonctionnel pour l'instant, sera branché plus tard)

### Migration des écrans

| Écran | Changement |
|-------|-----------|
| `app/(tabs)/matchs.tsx` | Refonte rendu complet. Garde toute la logique `fetchMatches` / `groupBy tournament` / `tierPriority`. Remplace le ScrollView 15 jours par `DateBar`. Ajoute `FilterTabs` au-dessus (filtre client-side sur l'array `groupedMatches`). Chaque groupe = `LeagueHeader` + N × `MatchRow`. Le header devient `<Text variant="display.wordmark">OVERTIME</Text>` + icône calendrier. |
| `app/match/[id].tsx` | Repalette uniquement : remplace les couleurs hardcodées par les tokens, remplace les scores par `Text variant="display.big"`, remplace `GlowImage` par `TeamLogo`. Pas de refonte de layout. |
| `app/(tabs)/ligues.tsx` | Liste de leagues = série de `LeagueHeader`. Page bg = `bg.page`. |
| `app/(tabs)/news.tsx` | Liste d'articles dans des `Surface level="surface" radius="md"`. |
| `app/(tabs)/profil.tsx` | Wrappe les sections existantes en `Surface level="elevated"`. Repalette. |
| `app/(tabs)/_layout.tsx` | Tab bar plate, full-width, bg `bg.page`, `borderTopWidth: 1, borderTopColor: border.subtle`. Plus de coins arrondis ni de flottement. Actif = `accent.indigo`. Labels DM Sans 10px `ui.label`. |

### Setup technique

**Fonts** — via `expo-font`
- Fichiers : `assets/fonts/BebasNeue-Regular.ttf`, `Geist-Medium.ttf`, `Geist-Bold.ttf`
- Le poids 500 (Medium) et 700 (Bold) suffisent pour toute l'UI ; aucun autre fichier nécessaire
- Geist est disponible via Google Fonts ou directement sur vercel.com/font ; licence SIL Open Font (OK pour distribution dans l'app)
- Préchargement dans `app/_layout.tsx` avec `useFonts({...})` + `SplashScreen.preventAutoHideAsync()` jusqu'à `loaded === true`
- En React Native chaque poids = un alias distinct dans `useFonts`. On enregistre `'Geist-Medium'` et `'Geist-Bold'` puis `Typo.ui.body.fontFamily` = `'Geist-Medium'`, `Typo.ui.title.fontFamily` = `'Geist-Bold'`, etc.

**Icônes** — `MaterialCommunityIcons` de `@expo/vector-icons` (déjà dans le projet). **Aucun emoji** dans l'app. Liste des icônes utilisées dans la refonte : `calendar-blank` (header date), `star`/`star-outline` (favori league), `chevron-right` (date bar), `sword-cross` (tab Matchs), `trophy`/`trophy-outline` (tab Ligues), `newspaper-variant`/`newspaper-variant-outline` (tab Actus), `account`/`account-outline` (tab Profil), `magnify` (recherche si réintroduite). Taille standard : 20px header, 16px in-row.

**Rebrand** — `app.json`
- `expo.name` : `"FotMob E-Sport"` → `"OVERTIME"`
- `expo.slug` : `"fotmob-esport"` → `"overtime"`
- `expo.plugins.expo-splash-screen.backgroundColor` : `"#121212"` → `"#08080B"` (les deux occurrences, normal + dark)
- L'icon et le splash-icon visuels restent inchangés dans ce chantier (changement d'asset à part)

**Nettoyage**
- Suppression de `constants/colors.ts`
- Suppression de `components/themed-text.tsx`, `components/themed-view.tsx`, `components/hello-wave.tsx`, `components/parallax-scroll-view.tsx`, `components/external-link.tsx` (non utilisés ou remplacés)
- Suppression de `hooks/use-color-scheme.ts`, `hooks/use-color-scheme.web.ts`, `hooks/use-theme-color.ts` (le thème est mono-mode dark, plus de logique de mode)
- `app.json` : `userInterfaceStyle` reste `"dark"`

## Décisions notables

- **Pas de mode light.** L'app est dark-only. La logique `use-color-scheme` est supprimée pour simplifier.
- **Pas de glow ni d'ombres** sur les logos teams. La hiérarchie passe par les fonds.
- **Pas de collapse par tournament** dans la v3 (présent dans l'actuel) : la réf Figma ne le montre pas, on rejoint son ergonomie. Si besoin re-débattu plus tard.
- **`FilterTabs` est un filtre client-side** sur l'array déjà fetché. Ne déclenche pas de re-fetch supabase.
- **`DateBar` non-fonctionnel** dans ce chantier (UI seulement, ouvre un modal vide). Le sélecteur de date complet sera un suivi.
- **`Text` est le seul composant qui pose `fontWeight`.** Aucun autre composant ne doit override `fontWeight` ou `fontFamily`. Si besoin d'une variante non listée, on l'ajoute à `Typo`.

## Risques & mitigations

- **Bebas Neue est très condensé** : à 20px, les chiffres restent lisibles mais ça change le rythme visuel. Validation visuelle nécessaire au premier rendu — si trop petit, monter à 22-24px ou basculer `display.score` vers DM Sans Bold (la réf Figma utilise DM Sans pour les scores en row, et garde Bebas pour le wordmark et le match-detail). Décision prise au moment du rendu.
- **Migration de 5 écrans en parallèle** : tester chaque écran après refonte. La logique fetch supabase reste inchangée, donc les régressions seront visuelles uniquement.
- **Fonts qui ne chargent pas** : si `useFonts` échoue, l'app utilise les fonts système → look cassé mais pas crash. Garde un splash screen jusqu'au load.

## Hors-scope (à faire plus tard)

- Nouveau logo / app icon
- Modal de date picker complet
- Animation des transitions de tab
- Persistance des favoris (étoile) en local — pour l'instant, l'étoile est purement UI, sans backend
- Mode light
- Pull-to-refresh sur Matchs
