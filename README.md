# 🔬 French Learning Analytics Lab

## 📊 Current Status

**Status:** ✅ PHASE 1 COMPLETE - UI/UX redesign and account system  
**Last Updated:** October 28, 2025  
**Current Phase:** Ready for frontend refactoring with UI specialist  
**Next Milestone:** Backend API integration and testing

### Recent Commits:
- `f0dd5db` docs: create comprehensive roadmap and secure documentation
- `0955b00` feat: initialize React 18.3.1 + Vite 4.5.0 frontend structure
- `de7f590` feat: create main React components, pages and services
- `a3e36b5` refactor: clean up legacy files and update backend structure
- `299007c` style: implement elegant minimalist design inspired by Crextio
- `b553fb8` feat: add teacher-student account system and role management
- `14292cf` docs: update README with Phase 1 completion and design specs

### 🎯 Project Overview
**Matej Language Lab** est une plateforme d'analyse avancée spécialisée dans l'évaluation des textes d'étudiants FLE (Français Langue Étrangère). La plateforme utilise l'IA pour analyser les erreurs linguistiques et fournir des retours personnalisés aux apprenants et enseignants.

**Objectif principal:** Créer une plateforme professionnelle d'analyse des productions écrites et orales en français pour les étudiants FLE, avec des fonctionnalités avancées de sauvegarde automatique et d'intégration TTS.

### 👥 Système de Comptes

La plateforme propose deux types de comptes distincts :

**👨‍🎓 Compte Étudiant:**
- Accès aux analyses de textes écrits et productions orales
- Suivi personnalisé de progression
- Possibilité d'assigner un enseignant (optionnel)
- Historique complet des analyses

**👨‍🏫 Compte Enseignant:**
- Dashboard dédié pour suivre les étudiants assignés
- Accès aux analyses de tous les étudiants qui les ont choisis
- Indicateurs de nouveaux textes soumis
- Statistiques et rapports de progression

**💰 Abonnement actuel:** Tous les comptes sont gratuits pendant la phase de développement (Beta). Un système de paiement sera ajouté en Phase 7.

### 🚀 Quick Start

**Backend:**
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend (React + Vite):**
```bash
cd frontend
npm install  # première fois seulement
npm run dev
```
Accessible sur `http://localhost:5173`

---

## 🚀 Feature Implementation Phases

### Phase 1: Redesign de l'interface 🎨
**Status:** 🚧 IN PROGRESS | **Durée:** 3-4 semaines  
**Commits:**
- `f0dd5db` docs: roadmap and secure documentation
- `0955b00` feat: React 18.3.1 + Vite 4.5.0 structure
- `de7f590` feat: components, pages and services
- `a3e36b5` refactor: clean up legacy files

**Objectifs principaux:**
- ✅ Migration Streamlit → React 18.3.1 + Vite 4.5.0
- ✅ Section "Analyse des Textes Écrits" dédiée
- ✅ Section "Analyse des Transcriptions TTS" dédiée
- ✅ Design élégant et minimaliste (inspiré Crextio)
- ✅ Système comptes Étudiant/Enseignant avec gestion des rôles
- ✅ Dashboard avec statistiques et filtrage par enseignant
- ✅ Navigation responsive avec page profil

**Livrables:** ✅ Architecture React | ✅ Configuration Vite | ✅ Auth System | 🔜 Tests

**Design specs:**
- Fonts: Inter/SF Pro Display (weights 300-400)
- Palette: #fafafa, #2a2a2a, #ffcc4d
- Cards: 16-18px radius, bordures #f0f0f0
- Max-width: 1200px, grid 4 cols desktop

**Status final:** ✅ COMPLETE - Prêt pour refactoring avec spécialiste UI/UX

---

### Phase 2: Sauvegarde automatique 💾
**Status:** 🔜 PLANNED | **Durée:** 4-5 semaines

**Objectifs principaux:**
- Application desktop (Electron) pour Windows/Mac/Linux
- Détection automatique des textes français
- Hotkeys pour sauvegarde rapide (Ctrl+Shift+S)
- API REST synchronisation cloud

**Livrables:** Application desktop, API sync, Documentation

---

### Phase 3: Consultation spécialisée 👥
**Status:** 🔜 PLANNED | **Durée:** 2-3 semaines

**Objectifs principaux:**
- Recrutement développeur UI/UX (React + Design)
- Consultation expert TTS (français FLE)
- Recommandations techniques

**Livrables:** Contrats, Rapports d'expertise, Plan d'implémentation

---

### Phase 4: Intégration Google Meet 🎥
**Status:** 🔜 PLANNED | **Durée:** 3-4 semaines

**Objectifs principaux:**
- API Google Meet + OAuth2
- Pipeline transcription (Google Speech-to-Text)
- Interface gestion enregistrements
- Transcription temps réel

**Livrables:** Module Google Meet, Interface transcriptions, Documentation API

---

### Phase 5: Calibration TTS français FLE 🎯
**Status:** 🔜 PLANNED | **Durée:** 4-6 semaines

**Objectifs principaux:**
- Modèles TTS spécialisés FLE
- Adaptation accents internationaux
- Métriques évaluation (précision, fluidité)
- Interface de calibration

**Livrables:** Modèles TTS calibrés, Interface calibration, Documentation

---

### Phase 6: Sauvegarde transcriptions TTS 💾
**Status:** 🔜 PLANNED | **Durée:** 2-3 semaines

**Objectifs principaux:**
- Base de données transcriptions + métadonnées
- Interface gestion (filtres, recherche, export)
- Sync automatique avec Google Meet
- Backup et récupération

**Livrables:** Base de données, Interface gestion, API sync

---

### Phase 7: Système de Paiement et Abonnements 💳
**Status:** 🔜 PLANNED | **Durée:** 4-6 semaines

**Objectifs principaux:**
- Intégration Stripe pour paiements sécurisés
- Plans d'abonnement (Gratuit/Premium/Entreprise)
- Abonnements mensuels et annuels pour étudiants et enseignants
- Gestion de la facturation et historique des paiements
- Périodes d'essai gratuites (14 jours)
- Tableau de bord administrateur pour gestion des abonnements
- Limitation des fonctionnalités selon le plan

**Plans tarifaires prévus:**
- **Gratuit:** Accès limité (10 analyses/mois)
- **Étudiant Premium:** 9.99€/mois - Analyses illimitées
- **Enseignant Pro:** 19.99€/mois - Dashboard complet + 50 étudiants
- **Institution:** Sur devis - Accès illimité + support prioritaire

**Livrables:** Module Stripe, Interface abonnements, Système de facturation automatique, Documentation API paiements

**Note:** Tous les comptes restent gratuits pendant les phases de développement 1-6 (Version Beta).

---

## 🔌 API Endpoints

### Backend API (FastAPI)
**Base URL:** `http://localhost:8000` (development)

#### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration  
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user info

#### Student Data Endpoints
- `GET /students/{student_id}/conversations` - Get student conversations
- `POST /students/{student_id}/conversations` - Add new conversation
- `GET /students/{student_id}/analysis` - Get analysis reports
- `POST /students/{student_id}/analyze` - Run error analysis
- `GET /students/{student_id}/teacher` - Get assigned teacher
- `PUT /students/{student_id}/teacher` - Assign/update teacher

#### Admin Endpoints
- `GET /admin/students` - List all students
- `GET /admin/analytics` - System analytics
- `POST /admin/analyze/{student_id}` - Run analysis for student
- `GET /admin/teachers` - List all teachers
- `GET /admin/subscriptions` - Manage subscriptions (Phase 7)

#### Teacher Endpoints
- `GET /teachers/{teacher_id}/students` - Get assigned students
- `GET /teachers/{teacher_id}/analytics` - Teacher dashboard analytics

### Frontend API (React)
**Base URL:** `http://localhost:5173` (Vite dev server)

#### Service Files
- `src/services/authService.js` - Authentication API calls
- `src/services/studentService.js` - Student data management
- `src/services/analysisService.js` - Analysis operations
- `src/services/ttsService.js` - TTS integration

---

## 🛠️ Architecture technique actuelle

### Stack technologique:
- **Backend:** Python, FastAPI, Streamlit
- **IA/ML:** OpenAI GPT-5, GPT-4 (vecteurs prévus avec Pinecone)
- **Analytics Engine:** OpenAI library pour l'analyse des erreurs linguistiques
- **Base de données:** JSON files (léger, rapide, facile à maintenir)
- **Frontend:** React 18.3.1 + Vite 4.5.0 (migration depuis Streamlit)
- **Build Tools:** Vite 4.5.0 (développement et build)
- **Déploiement:** Local (migration vers cloud prévue)

### Analytics Engine (Backend)
**Core Library:** OpenAI Python library  
**Main Components:**
- `OpenAI_Error_LLM_method.py` - Analyseur principal des erreurs linguistiques
- `clients.py` - Configuration des clients OpenAI (GPT-5, GPT-4, embeddings)
- `conf.py` - Configuration des API keys et paramètres

**Fonctionnalités:**
- Analyse automatique des erreurs de grammaire et syntaxe (GPT-5)
- Détection des erreurs de vocabulaire et conjugaison
- Suggestions d'amélioration personnalisées
- Analyse de progression des étudiants FLE
- Amélioration de la précision avec GPT-5

**Note:** Intégration vectorielle Pinecone prévue pour futures améliorations

### Structure des fichiers:
```
analytics-service/
├── backend/
│   ├── streamlit_app.py          # Interface principale (legacy)
│   ├── clients.py                # Clients API (OpenAI)
│   ├── conf.py                   # Configuration
│   ├── OpenAI_Error_LLM_method.py # Analyseur d'erreurs (OpenAI library)
│   └── requirements.txt
├── frontend/                     # React 18.3.1 + Vite 4.5.0
│   ├── src/
│   │   ├── components/           # Composants React
│   │   ├── pages/               # Pages de l'application
│   │   ├── hooks/               # Hooks personnalisés
│   │   ├── services/            # Services API
│   │   └── utils/               # Utilitaires
│   ├── public/                  # Assets statiques
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── secure_data/                 # Données utilisateurs
│   ├── users_database.json
│   └── student_DB/
└── README.md
```

---

## 📝 Notes de développement

### Environnement de développement:
- **Python:** 3.9+ (avec venv pour isolation)
- **Node.js:** 18+ (pour React + app desktop)
- **React:** 18.3.1 (composants fonctionnels + hooks)
- **Vite:** 4.5.0 (build tool + dev server)
- **Docker:** Pour la containerisation
- **Git:** Workflow feature branches (feat/feature-name)
- **Testing:** pytest (Python), Jest + Testing Library (React)

> ℹ️ **Note:** Le workflow de développement et les règles de commit sont détaillés dans le fichier `.cursorrules`

---

*Dernière mise à jour: December 27, 2024*
