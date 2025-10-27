# French Learning Analytics Lab - Frontend

React 18.3.1 + Vite 4.5.0 frontend pour la plateforme d'analyse FLE.

## 🚀 Démarrage rapide

### Installation des dépendances
```bash
npm install
```

### Lancement en mode développement
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Build pour production
```bash
npm run build
```

### Preview du build de production
```bash
npm run preview
```

## 📁 Structure du projet

```
frontend/
├── src/
│   ├── components/      # Composants réutilisables
│   │   └── Layout.jsx   # Layout principal avec navigation
│   ├── pages/           # Pages de l'application
│   │   ├── Home.jsx     # Page d'accueil
│   │   ├── Login.jsx    # Page de connexion
│   │   ├── Signup.jsx   # Page d'inscription
│   │   ├── WrittenAnalysis.jsx   # Analyse des textes écrits
│   │   ├── OralAnalysis.jsx      # Analyse des productions orales
│   │   ├── Progress.jsx          # Suivi de progression
│   │   └── Dashboard.jsx         # Tableau de bord admin/enseignant
│   ├── services/        # Services API
│   │   ├── authService.js       # Authentification
│   │   └── studentService.js    # Données étudiants
│   ├── styles/          # Styles CSS
│   │   ├── index.css    # Styles globaux
│   │   └── App.css      # Styles de composants
│   ├── App.jsx          # Composant racine
│   └── main.jsx         # Point d'entrée
├── public/              # Assets statiques
├── index.html           # Template HTML
├── vite.config.js       # Configuration Vite
└── package.json         # Dépendances

## 🎨 Design System

### Palette de couleurs (Française)
- **Bleu primaire:** #0055A4
- **Blanc:** #FFFFFF
- **Rouge:** #EF4135

### Composants
- Layout avec navigation responsive
- Formulaires d'authentification
- Cards pour les analyses
- Tables pour les données étudiants
- Modales pour les détails

## 🔧 Technologies

- **React 18.3.1** - Library UI
- **Vite 4.5.0** - Build tool & dev server
- **React Router DOM 6.20.0** - Routing
- **Axios 1.6.2** - HTTP client

## 📝 Conventions

- **Composants:** PascalCase (ex: `Layout.jsx`)
- **Functions:** camelCase (ex: `handleSubmit`)
- **Functional components** avec hooks uniquement
- **ES6+ syntax** (const/let, arrow functions)

## 🚧 TODO Phase 1

- [x] Structure React + Vite configurée
- [x] Composants principaux créés
- [x] Services API mockés
- [x] Design system implémenté
- [ ] Tests unitaires (Jest + Testing Library)
- [ ] Connexion backend API
- [ ] Optimisation performance

## 📚 Documentation

Voir le README principal du projet pour la documentation complète.

