# 🔬 French Learning Analytics Lab

## 📊 Current Status

**Status:** 🚧 IN PROGRESS - Phase 1: Redesign & Migration  
**Last Updated:** December 27, 2024  
**Current Phase:** Interface redesign with React 18.3.1 + Vite 4.5.0 migration  
**Next Milestone:** Complete UI/UX redesign and React migration

### Recent Commits:
> ⚠️ Travaux en cours - pas encore commités. En attente d'approbation humaine.

**À commiter :**
- `docs:` Roadmap Phase 1-6 créée
- `feat:` Structure React 18.3.1 + Vite 4.5.0 initialisée
- `feat:` Composants principaux créés (8 pages + Layout)
- `feat:` Services API mockés (authService, studentService)
- `style:` Design system palette française implémenté
- `docs:` README simplifié et sécurisé

### 🎯 Project Overview
**French Learning Analytics Lab** est une plateforme d'analyse avancée spécialisée dans l'évaluation des textes d'étudiants FLE (Français Langue Étrangère). La plateforme utilise l'IA pour analyser les erreurs linguistiques et fournir des retours personnalisés aux apprenants et enseignants.

**Objectif principal:** Créer une plateforme professionnelle d'analyse des productions écrites et orales en français pour les étudiants FLE, avec des fonctionnalités avancées de sauvegarde automatique et d'intégration TTS.

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
**Travaux effectués (pas encore commités):**
- Roadmap création et spécification React/Vite
- Structure React 18.3.1 + Vite 4.5.0 initialisée
- Composants principaux créés (Layout, Pages, Services)
- Services API mockés (authService, studentService)

> ⚠️ **Note:** Ces changements doivent être commités. Les hash de commits seront ajoutés après approbation et commit.

**Objectifs principaux:**
- ✅ Migration Streamlit → React 18.3.1 + Vite 4.5.0 (structure créée)
- ✅ Section "Analyse des Textes Écrits" dédiée (composant créé)
- ✅ Section "Analyse des Transcriptions TTS" dédiée (composant créé)
- ✅ Design professionnel avec palette française (bleu/blanc/rouge)
- 🚧 Navigation intuitive et responsive (en cours)

**Livrables:** ✅ Architecture React | 🚧 Configuration Vite | 🔜 Tests unitaires

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
- `POST /students/{student_id}/analyze` - Run error analysis (GPT-5)

#### Admin Endpoints
- `GET /admin/students` - List all students
- `GET /admin/analytics` - System analytics
- `POST /admin/analyze/{student_id}` - Run analysis for student (GPT-5)

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
