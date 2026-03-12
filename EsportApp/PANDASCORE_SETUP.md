# 🎮 Configuration PandaScore API - STRAFE

## ✅ Étapes d'intégration

### 1️⃣ Obtenir ta clé API PandaScore

1. Accède à [https://pandascore.co/](https://pandascore.co/)
2. Crée un compte gratuit
3. Va dans ton dashboard → **API Keys** ou **Settings**
4. Génère une nouvelle clé API
5. Copie ta clé (elle commence souvent par `Bearer ...` ou est un long token)

### 2️⃣ Configurer le fichier `.env.local`

Le fichier `.env.local` a déjà été créé à la racine du projet `EsportApp/`.

**Remplissage:**
```bash
EXPO_PUBLIC_PANDASCORE_KEY=ta_clé_api_ici
```

**Important:**
- Remplace `ta_clé_api_ici` par ta vraie clé
- Ne mets PAS de guillemets autour de la clé
- Le préfixe `EXPO_PUBLIC_` signifie que cette variable sera exposée côté client (c'est normal pour Expo)

### 3️⃣ Relancer l'application

```bash
cd EsportApp
npx expo start --clear
```

Appuie sur `r` pour recharger complètement. L'app va maintenant chercher les vraies données depuis PandaScore!

---

## 📊 Structure de l'API PandaScore

### Endpoint utilisé:
```
GET https://api.pandascore.co/matches?filter[status]=not_started,ongoing&sort=-scheduled_at&per_page=20
```

### Paramètres:
- `filter[status]=not_started,ongoing` : Récupère les matchs à venir et en direct
- `sort=-scheduled_at` : Tri par date décroissante (plus récents d'abord)
- `per_page=20` : Limite à 20 matchs par page

### Structure des données reçues:

```json
{
  "id": 12345,
  "league": {
    "name": "League of Legends Worlds 2026"
  },
  "status": "ongoing",
  "scheduled_at": "2026-03-11T21:00:00Z",
  "videogame_title": "League of Legends",
  "opponents": [
    {
      "name": "T1",
      "image_url": "https://..."
    },
    {
      "name": "Karmine Corp",
      "image_url": "https://..."
    }
  ],
  "results": [
    { "score": 2 },
    { "score": 1 }
  ]
}
```

---

## 🔧 Mapping des données

Le code fait le mapping suivant:

| API PandaScore | Notre App |
|---|---|
| `league.name` | `tournament` |
| `status` | `status` (EN DIRECT, À VENIR, TERMINÉ) |
| `scheduled_at` | `timeLabel` (formaté en heures) |
| `opponents[0].name` | `teamA.name` |
| `opponents[1].name` | `teamB.name` |
| `opponents[X].image_url` | `teamA/B.image_url` |
| `videogame_title` | Utilisé pour déterminer l'emoji |
| `results[X].score` | `score` |

### Gestion des images manquantes:
- Si `image_url` est `null` → On affiche un emoji par défaut (selon le jeu)
- Emojis: 🎮 (LoL), 🔫 (Valorant), 🎯 (CS2), etc.

---

## ⚠️ Limitations de l'API gratuite

- **10 requêtes/minute** maximum
- **Accès limité** à certains jeux (principalement LoL, Valorant, CS2, Dota2)
- Les données peuvent être en retard de quelques minutes

## 🆘 Troubleshooting

### "Clé API PandaScore non configurée"
- Vérifie que `.env.local` existe
- Vérifie que `EXPO_PUBLIC_PANDASCORE_KEY=ta_clé` est correct
- Redémarre l'app complètement: `npx expo start --clear`

### "Erreur API: 401 Unauthorized"
- Ta clé API est invalide ou expirée
- Génère une nouvelle clé sur pandascore.co

### "Erreur API: 429 Too Many Requests"
- Tu as dépassé la limite de 10 req/minute
- L'app va automatiquement basculer sur les mock data (mockMatches)

### Les données ne se mettent pas à jour
- Attends 1-2 minutes (temps de cache de PandaScore)
- Appuie sur `r` dans le terminal Expo pour recharger
- Vérifie la console (appuie sur `j` dans Expo CLI pour accéder aux logs)

---

## 🚀 Prochaines étapes

1. **Ajouter les images d'équipe** - Afficher les vrais logos au lieu des emojis
2. **Cacher la clé API** - Créer un backend pour sécuriser la clé
3. **Mettre en cache** - Utiliser AsyncStorage pour stocker les données localement
4. **Rafraîchir automatiquement** - Ajouter un pull-to-refresh

---

## 📝 Notes

- Les données PandaScore sont les mêmes qui alimentent le site officiel de PandaScore
- L'API supporte d'autres jeux: Dota 2, Overwatch, Call of Duty, etc.
- Pour les requêtes en arrière-plan, considère **React Query** ou **SWR**

**Vérifiée le:** 11 mars 2026  
**Status:** ✅ Opérationnel
