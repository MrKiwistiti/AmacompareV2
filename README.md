# 🛒 AmaCompare

**Comparateur de prix Amazon intelligent pour l'Europe** 🇪🇺

AmaCompare est une solution complète de comparaison et surveillance des prix Amazon à travers 4 pays européens (France, Allemagne, Italie, Espagne). L'application offre une recherche dynamique, un suivi historique des prix, et un système d'alertes par email.

![AmaCompare Banner](https://via.placeholder.com/800x200/667eea/ffffff?text=AmaCompare+-+Smart+Amazon+Price+Tracker)

## ✨ Fonctionnalités Principales

### 🔍 **Recherche Dynamique**
- Recherche instantanée de produits sur Amazon.fr
- Extraction automatique des ASIN, prix, images et évaluations
- Interface moderne avec mode sombre/clair

### 💰 **Comparaison Multi-Pays**
- Comparaison simultanée des prix sur 4 sites Amazon européens
- Identification automatique du meilleur prix et calcul des économies
- Affichage des disponibilités et frais de livraison

### 📈 **Historique des Prix**
- Stockage automatique de l'historique des prix dans une base SQLite
- Graphiques interactifs (courbes et aires) avec Recharts
- Statistiques avancées (min, max, moyenne, tendances)

### 🔔 **Alertes Prix Intelligentes**
- Système d'alertes par email configurables par pays
- Notifications automatiques quand le prix passe sous le seuil défini
- Templates d'emails HTML responsives avec détails du produit

### ⚡ **Performance & Fiabilité**
- Cache intelligent avec gestion TTL
- Rate limiting pour éviter la surcharge
- Gestion d'erreurs robuste avec retry automatique
- Logs détaillés pour monitoring

## 🏗️ Architecture Technique

### Backend (Node.js/Express)
```
├── 📁 src/
│   └── server.js          # Serveur principal avec toutes les routes
├── 📁 data/
│   └── price_history.db   # Base SQLite (auto-créée)
├── package.json
├── .env                   # Configuration
└── README.md
```

### Frontend (React)
```
├── 📁 src/
│   ├── App.js                    # Composant principal
│   ├── index.js                  # Point d'entrée
│   ├── 📁 contexts/
│   │   └── ThemeContext.js       # Gestion thème sombre/clair
│   └── 📁 components/
│       ├── ThemeToggle.js        # Bouton changement thème
│       ├── PriceHistory.js       # Graphiques historique
│       └── PriceAlerts.js        # Gestion alertes
└── public/
```

### Technologies Utilisées

**Backend:**
- **Express.js** - Framework web rapide
- **Puppeteer** - Web scraping Amazon avec navigateur headless
- **better-sqlite3** - Base de données légère et performante
- **Nodemailer** - Envoi d'emails avec templates HTML
- **node-cache** - Cache mémoire avec TTL
- **express-rate-limit** - Protection contre le spam

**Frontend:**
- **React** - Interface utilisateur moderne
- **Recharts** - Graphiques interactifs pour l'historique
- **Context API** - Gestion d'état globale (thèmes)
- **CSS-in-JS** - Styling avec support thème

## 🚀 Installation & Configuration

### Prérequis
- **Node.js** ≥ 16.0.0
- **npm** ≥ 8.0.0
- **Chrome/Chromium** (pour Puppeteer)

### 1. Cloner le Projet
```bash
git clone https://github.com/votre-repo/amacompare.git
cd amacompare
```

### 2. Installation Backend
```bash
cd backend
npm install
```

### 3. Configuration des Variables d'Environnement

Créez un fichier `.env` dans le dossier backend :

```env
# ========== CONFIGURATION SERVEUR ==========
PORT=5000
NODE_ENV=development

# ========== CONFIGURATION CACHE ==========
CACHE_DURATION=3600

# ========== CONFIGURATION REQUÊTES ==========
REQUEST_TIMEOUT=15000

# ========== CONFIGURATION PUPPETEER ==========
PUPPETEER_EXECUTABLE_PATH=""

# ========== CONFIGURATION CORS ==========
ALLOWED_ORIGINS="http://localhost:3000,https://votre-domaine.com"

# ========== ALERTES EMAIL (OBLIGATOIRE) ==========
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-app
EMAIL_SERVICE=gmail

# ========== LOGS & MONITORING ==========
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Configuration Gmail pour les Alertes

Pour activer les alertes email avec Gmail :

1. **Activez l'authentification à 2 facteurs** sur votre compte Google
2. **Générez un mot de passe d'application** :
   - Allez sur [Google Account Security](https://myaccount.google.com/security)
   - Sécurité → Authentification à 2 facteurs → Mots de passe des applications
   - Sélectionnez "Autre" et nommez-le "AmaCompare"
   - **Utilisez ce mot de passe généré** dans `EMAIL_PASS`

### 5. Installation Frontend
```bash
cd ../frontend
npm install
```

### 6. Démarrage

**Backend (Terminal 1):**
```bash
cd backend
npm run dev
# Serveur démarré sur http://localhost:5000
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm start
# Interface démarrée sur http://localhost:3000
```

## 📖 Guide d'Utilisation

### 1. Recherche de Produits
1. Saisissez le nom d'un produit (ex: "iPhone 15", "MacBook Pro")
2. Cliquez sur "🔍 Rechercher"
3. Parcourez les résultats avec images, prix et évaluations

### 2. Comparaison des Prix
1. Cliquez sur un produit dans les résultats
2. L'application compare automatiquement les prix sur 4 sites Amazon
3. Le meilleur prix est mis en évidence avec les économies possibles

### 3. Historique des Prix
- L'historique se construit automatiquement à chaque comparaison
- Visualisez les tendances avec les graphiques interactifs
- Changez la période d'affichage (7 jours à 6 mois)

### 4. Créer une Alerte Prix
1. Après une comparaison, cliquez sur "🔔 Créer une alerte prix"
2. Choisissez le pays et définissez votre prix cible
3. Saisissez votre email de notification
4. Recevez un email dès que le prix baisse sous votre seuil !

## 🔧 API Documentation

### Endpoints Principaux

#### `POST /api/search`
Recherche de produits sur Amazon.fr
```javascript
// Request
{
  "query": "iPhone 15"
}

// Response
{
  "query": "iPhone 15",
  "products": [
    {
      "id": 1,
      "title": "Apple iPhone 15 (128 Go) - Noir",
      "price": 969,
      "image": "https://...",
      "asin": "B0CHX2F5QT",
      "rating": "4.5",
      "reviewsCount": "(1,234)"
    }
  ],
  "count": 20
}
```

#### `POST /api/compare/:asin`
Comparaison des prix européens
```javascript
// Response
{
  "asin": "B0CHX2F5QT",
  "productName": "Apple iPhone 15 (128 Go) - Noir",
  "countries": [
    {
      "country": "FR",
      "countryName": "France",
      "flag": "🇫🇷",
      "price": 969,
      "currency": "€",
      "bestPrice": true,
      "savings": 0,
      "availability": "En stock",
      "url": "https://amazon.fr/dp/B0CHX2F5QT"
    }
  ],
  "bestPrice": 969,
  "maxSavings": 50
}
```

#### `POST /api/alerts`
Création d'une alerte prix
```javascript
// Request
{
  "asin": "B0CHX2F5QT",
  "targetPrice": 899,
  "email": "user@example.com",
  "country": "FR",
  "productName": "iPhone 15",
  "productImage": "https://..."
}
```

#### `GET /api/price-history/:asin?days=30`
Historique des prix
```javascript
// Response
{
  "asin": "B0CHX2F5QT",
  "history": {
    "FR": [
      { "price": 969, "date": "2025-01-10", "availability": "En stock" }
    ]
  },
  "stats": {
    "FR": {
      "minPrice": 950,
      "maxPrice": 1000,
      "avgPrice": 975,
      "currentPrice": 969,
      "trend": "down"
    }
  }
}
```

## 🚀 Déploiement

### Déploiement sur Railway
1. Connectez votre dépôt GitHub à [Railway](https://railway.app)
2. Configurez les variables d'environnement dans le dashboard
3. Le déploiement est automatique !

### Déploiement sur Vercel (Frontend)
```bash
cd frontend
npm run build
npx vercel --prod
```

### Déploiement Docker
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🛠️ Développement

### Scripts Disponibles

**Backend:**
```bash
npm run dev          # Développement avec nodemon
npm start           # Production
npm run test        # Tests (à implémenter)
```

**Frontend:**
```bash
npm start           # Serveur de développement
npm run build       # Build de production
npm test            # Tests React
```

### Structure de la Base de Données

```sql
-- Table historique des prix
CREATE TABLE price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asin TEXT NOT NULL,
    country TEXT NOT NULL,
    price REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    title TEXT,
    image_url TEXT,
    availability TEXT,
    url TEXT
);

-- Table alertes prix
CREATE TABLE price_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asin TEXT NOT NULL,
    target_price REAL NOT NULL,
    email TEXT NOT NULL,
    country TEXT NOT NULL,
    product_name TEXT,
    product_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    triggered_at DATETIME NULL
);
```

## ⚠️ Troubleshooting

### Problèmes Courants

**1. Erreur Puppeteer "Chrome not found"**
```bash
# Solution 1: Installer Chromium
sudo apt-get install chromium-browser

# Solution 2: Spécifier le chemin
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

**2. Alertes email ne fonctionnent pas**
- Vérifiez que `EMAIL_USER` et `EMAIL_PASS` sont corrects
- Assurez-vous d'utiliser un mot de passe d'application Gmail
- Testez avec l'endpoint `/api/test-email` (en développement)

**3. Base de données locked**
```bash
# Redémarrer le serveur résout généralement le problème
npm run dev
```

**4. Scraping bloqué par Amazon**
- Les requêtes sont limitées pour éviter les blocages
- Le cache réduit les appels répétés
- Rotation des User-Agents implémentée

### Mode Debug
```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Endpoints de Test
- `GET /api/health` - État du serveur
- `GET /api/test-search/:query` - Test recherche
- `GET /api/test-compare/:asin` - Test comparaison
- `POST /api/test-email` - Test envoi email (dev only)

## 📊 Monitoring & Analytics

Le serveur fournit des métriques utiles :
- Cache hit/miss ratio
- Temps de réponse des requêtes
- Taux d'erreur par pays Amazon
- Nombre d'alertes actives

Accédez aux statistiques via `GET /api/health`

## 🤝 Contribution

1. **Fork** le projet
2. Créez votre branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une **Pull Request**

### Standards de Code
- ESLint pour JavaScript
- Prettier pour le formatage
- Commentaires JSDoc pour les fonctions complexes

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🔮 Roadmap

### Version 2.0 (Prochaine)
- [ ] 🌍 Support d'autres pays (UK, Canada)
- [ ] 📱 Application mobile React Native
- [ ] 🤖 API REST publique avec authentification
- [ ] 📈 Prédictions de prix avec ML
- [ ] 💾 Export des données en CSV/Excel
- [ ] 🔗 Intégration webhook Discord/Slack

### Version 2.1
- [ ] 🛡️ Authentification utilisateur
- [ ] 📊 Dashboard analytics avancé
- [ ] 🎯 Alertes conditionnelles (stock, promotions)
- [ ] 🔄 Synchronisation cloud
- [ ] 🌐 Interface multilingue

## 👨‍💻 Équipe

**Développeur Principal:** [Votre Nom]
- 🐙 GitHub: [@votre-username](https://github.com/votre-username)
- 📧 Email: votre.email@example.com

## 🙏 Remerciements

- **Puppeteer** pour le web scraping robuste
- **Recharts** pour les graphiques magnifiques
- **Amazon** pour... être Amazon 😄
- **Communauté Open Source** pour l'inspiration

---

<div align="center">

**⭐ Si ce projet vous aide, n'hésitez pas à lui donner une étoile ! ⭐**

Made with ❤️ and ☕ in France 🇫🇷

[🐛 Reporter un Bug](https://github.com/votre-repo/amacompare/issues) • [💡 Suggérer une Feature](https://github.com/votre-repo/amacompare/issues) • [📖 Documentation](https://github.com/votre-repo/amacompare/wiki)

</div>