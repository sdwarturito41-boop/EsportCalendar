# 🎬 QUICK START - PandaScore Integration

## ⏱️ 5 minutes pour démarrer

### Étape 1: Obtenir ta clé API (2 min)
```bash
# 1. Ouvre: https://pandascore.co/
# 2. Clique sur "Sign Up" (gratuit)
# 3. Remplis le formulaire et confirme ton email
# 4. Va sur ton Dashboard
# 5. Cherche "API Keys" ou "Settings"
# 6. Clique "Generate New Key"
# 7. COPIE ta clé (ressemble à):
#    ds_pa_1234567890abcdefghijklmnopqrst
#    ou
#    Bearer eyJhbGciOiJIUzI1NiIs...
```

### Étape 2: Remplir `.env.local` (1 min)
```bash
# Ouvre: EsportApp/.env.local
# Cherche cette ligne:
# EXPO_PUBLIC_PANDASCORE_KEY=your_pandascore_api_key_here

# Remplace par ta vraie clé:
# EXPO_PUBLIC_PANDASCORE_KEY=ds_pa_1234567890abcdefghijklmnopqrst

# Sauvegarde le fichier (Ctrl+S ou Cmd+S)
```

### Étape 3: Redémarrer l'app (2 min)
```bash
cd EsportApp

# Si l'app est déjà lancée:
# Appuie sur CTRL+C dans le terminal

# Puis:
npx expo start --clear

# Dans l'app Expo Go:
# Appuie sur 'r' pour recharger complètement
```

**Et voilà! 🎉 Les vrais matchs apparaissent!**

---

## 🧪 Test rapide sans clé API

Si tu veux tester sans configurer PandaScore:
- L'app utilise automatiquement les mock data
- Tout fonctionne normalement
- Les équipes et scores sont fictifs

Pour activer les vraies données, suis les 3 étapes ci-dessus.

---

## 🎯 Ce que tu verras

### Avant (Mock data):
```
├─ League of Legends Worlds 2026
│  ├─ T1 vs Karmine Corp - LIVE
│  └─ G2 vs Fnatic - LIVE
├─ Valorant League
│  └─ FaZe vs LOUD - FINISHED
└─ CS2 Pro League
   └─ Spirit vs MOUZ - FINISHED
```

### Après (Vraies données PandaScore):
```
├─ EMEA Championship 2026
│  ├─ Fnatic vs Excel - EN DIRECT
│  └─ Vitality vs G2 - 3h
├─ World Championship
│  └─ DRX vs T1 - À VENIR
└─ European League
   └─ MAD Lions vs Schalke - À VENIR
```

Les tournois, équipes et horaires changent en LIVE! ⚡

---

## 📱 Pour les appareils

### Sur iPhone/iPad:
1. Ouvre l'app Expo Go
2. Scanne le QR code affiché dans le terminal
3. Attends que l'app charge
4. Si elle demande les vrais matchs, attends 5-10 sec

### Sur Android:
1. Même processus que iOS
2. Si ça ne marche pas, copy-paste le lien du terminal dans Expo Go

---

## 🚨 Codes d'erreur courants

| Erreur | Solution |
|---|---|
| "Clé API non configurée" | Remplis `.env.local` + redémarre |
| "Error 401: Unauthorized" | Ta clé est invalide/expirée |
| "Error 429: Rate Limited" | Attends 1 min (max 10 req/min) |
| "Network error" | Vérifies ta connexion internet |
| Rien ne change | Appuie sur 'r' dans Expo CLI |

---

## 💡 Pro tips

1. **Voir les logs**:
   - Appuie sur `j` dans Expo CLI
   - Cherche "PandaScore" dans les messages

2. **Tester manuellement**:
   ```bash
   curl -H "Authorization: Bearer YOUR_KEY" \
   https://api.pandascore.co/matches?per_page=1
   ```

3. **Garder ta clé secrète**:
   - Jamais sur GitHub
   - `.env.local` est dans `.gitignore`
   - OK pour Expo Go (client-side)

---

## 🔗 Liens utiles

- PandaScore Dashboard: https://pandascore.co/dashboard
- API Docs: https://pandascore.co/docs
- Supported Games: https://pandascore.co/games

---

**Besoin d'aide?** Vérifie `PANDASCORE_SETUP.md` pour plus de détails.

**Status**: ✅ Prêt à l'emploi!
