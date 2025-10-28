# 🔬 French Learning Analytics Lab

## 📊 Current Status

**Status:** ✅ PHASE 1 COMPLETE - Authentication working  
**Last Updated:** October 28, 2025  
**Current Phase:** Frontend-Backend integration (Auth ✅, Analysis in progress)  
**Next Milestone:** Text analysis submission and display

### Recent Commits:
- `f0dd5db` docs: create comprehensive roadmap and secure documentation
- `0955b00` feat: initialize React 18.3.1 + Vite 4.5.0 frontend structure
- `de7f590` feat: create main React components, pages and services
- `a3e36b5` refactor: clean up legacy files and update backend structure
- `299007c` style: implement elegant minimalist design inspired by Crextio
- `b553fb8` feat: add teacher-student account system and role management
- `67488b2` docs: update README with Phase 1 completion and design specs
- `17401f7` feat: implement complete FastAPI backend architecture
- `6770162` fix: handle validation errors and prevent white screen
- `afffc89` fix: resolve CORS issues, validation errors, and signup bug

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
python run_backend.py
```
API accessible sur `http://localhost:8000`  
Documentation interactive: `http://localhost:8000/docs`

**Frontend (React + Vite):**
```bash
cd frontend
npm install  # première fois seulement
npm run dev
```
Interface accessible sur `http://localhost:5173`

---

## 🚀 Feature Implementation Phases

### Phase 1: Redesign de l'interface 🎨
**Status:** 🚧 IN PROGRESS | **Durée:** 3-4 semaines  
**Commits:**
- `f0dd5db` docs: roadmap and secure documentation
- `0955b00` feat: React 18.3.1 + Vite 4.5.0 structure
- `de7f590` feat: components, pages and services
- `a3e36b5` refactor: clean up legacy files
- `299007c` style: elegant minimalist design
- `b553fb8` feat: teacher-student account system
- `67488b2` docs: Phase 1 completion and design specs
- `17401f7` feat: complete FastAPI backend architecture

**Objectifs principaux:**

**Frontend:**
- ✅ Migration Streamlit → React 18.3.1 + Vite 4.5.0
- ✅ Section "Analyse des Textes Écrits" dédiée
- ✅ Section "Analyse des Transcriptions TTS" dédiée
- ✅ Design élégant et minimaliste (inspiré Crextio)
- ✅ Système comptes Étudiant/Enseignant avec gestion des rôles
- ✅ Dashboard avec statistiques et filtrage par enseignant
- ✅ Navigation responsive avec page profil

**Backend:**
- ✅ Architecture FastAPI modulaire avec routes séparées
- ✅ Modèles Pydantic pour validation des données
- ✅ Service de gestion JSON pour base de données
- ✅ Configuration centralisée avec variables d'environnement
- ✅ Restauration du système d'analyse OpenAI_Error_LLM_method.py
- ✅ Endpoints API pour soumission et récupération d'analyses
- 🚧 Intégration des routes d'analyse avec le frontend
- 🔜 Tests unitaires et d'intégration

**Livrables:** ✅ Architecture React | ✅ Configuration Vite | ✅ Auth System | ✅ Backend FastAPI | 🔜 Intégration API | 🔜 Tests

**Design specs:**
- Fonts: Inter/SF Pro Display (weights 300-400)
- Palette: #fafafa, #2a2a2a, #ffcc4d
- Cards: 16-18px radius, bordures #f0f0f0
- Max-width: 1200px, grid 4 cols desktop

**Prochaines étapes Phase 1:**
1. ✅ Créer les endpoints API pour l'analyse de textes
2. Connecter le frontend aux routes backend (auth, analysis, dashboard)
3. Implémenter la soumission de textes depuis WrittenAnalysis.jsx
4. Afficher les résultats d'analyse dans l'interface
5. Tests d'intégration frontend-backend
6. Consultation spécialiste UI/UX pour optimisation finale

**Status final:** ✅ COMPLETE - Backend + Frontend auth integration working

**Bugs résolus (commits `6770162`, `afffc89`):**
- ✅ CORS configuration : ajout ports 5174/5175 pour dev frontend
- ✅ Validation robuste : protection KeyError dans db_service.py
- ✅ Error handling : logging amélioré pour débogage auth
- ✅ Signup bug : gestion correcte teacher_email vide → null
- ✅ Page blanche après signup : affichage erreurs Pydantic corrigé

**Prochaines étapes Phase 1:**
- [ ] Connecter WrittenAnalysis.jsx à l'API d'analyse
- [ ] Afficher les résultats d'analyse dans le dashboard
- [ ] Tester le flux complet soumission → analyse → affichage

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
**Documentation interactive:** `http://localhost:8000/docs` (Swagger UI)

#### Authentication Endpoints
- `POST /api/auth/login` - User login with email and password
- `POST /api/auth/signup` - User registration with role selection
- `GET /api/auth/teachers` - Get list of all teachers (for student profile dropdown)

#### Student Endpoints
- `POST /api/student/assign-teacher` - Assign or remove teacher from student
- `GET /api/student/{student_email}/teacher` - Get the teacher assigned to a student
- `GET /api/student/{student_email}/analyses` - Get all analyses for a student

#### Teacher Endpoints
- `GET /api/teacher/{teacher_email}/students` - Get all students assigned to a teacher
- `GET /api/teacher/{teacher_email}/dashboard` - Get dashboard statistics for a teacher

#### Analysis Endpoints
- `POST /api/analysis/submit` - Submit a text for analysis (student)
- `GET /api/analysis/student/{student_email}` - Get all analyses for a student (with pagination)
- `GET /api/analysis/analysis/{analysis_id}` - Get a specific analysis by ID
- `DELETE /api/analysis/analysis/{analysis_id}` - Delete a specific analysis
- `POST /api/analysis/mark-as-read` - Mark analyses as read by teacher

#### Health Check
- `GET /api/health` - Health check endpoint
- `GET /` - API root with version info

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
- **Backend:** Python 3.13, FastAPI 0.104.1, Uvicorn
- **IA/ML:** OpenAI GPT-5, GPT-4 (vecteurs prévus avec Pinecone)
- **Analytics Engine:** OpenAI library pour l'analyse des erreurs linguistiques
- **Base de données:** JSON files (léger, rapide, facile à maintenir)
- **Frontend:** React 18.3.1 + Vite 4.5.0
- **Build Tools:** Vite 4.5.0 (développement et build)
- **Déploiement:** Local (migration vers cloud prévue)

### Backend Architecture
**Framework:** FastAPI avec architecture modulaire  
**Main Components:**
- `backend/models.py` - Modèles Pydantic (User, Teacher, Student, Analysis)
- `backend/db_service.py` - Service de gestion des fichiers JSON
- `backend/routes/auth.py` - Routes d'authentification
- `backend/routes/student.py` - Routes pour étudiants
- `backend/routes/teacher.py` - Routes pour enseignants
- `backend/main.py` - Application FastAPI principale
- `run_backend.py` - Script de démarrage du serveur

**Analytics Engine:**
- `backend/OpenAI_Error_LLM_method.py` - Analyseur principal des erreurs linguistiques
- `backend/clients.py` - Configuration des clients OpenAI (GPT-5, GPT-4, embeddings)
- `backend/config.py` - Configuration centralisée (variables d'environnement)

**Fonctionnalités:**
- Authentification avec rôles (Student/Teacher/Admin)
- Gestion des relations enseignant-étudiant
- Dashboard avec statistiques en temps réel
- Analyse automatique des erreurs de grammaire et syntaxe
- Détection des erreurs de vocabulaire et conjugaison
- Suggestions d'amélioration personnalisées
- Analyse de progression des étudiants FLE

**Note:** Intégration vectorielle Pinecone prévue pour futures améliorations

### ⚠️ Règles de Modification du System Prompt

**Fichier critique:** `backend/OpenAI_Error_LLM_method.py`

Ce fichier contient le **system prompt principal** de l'agent IA qui définit le comportement d'analyse des erreurs linguistiques. Toute modification de ce fichier doit suivre les règles suivantes :



### Structure des fichiers:
```
analytics-service/
├── backend/
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py                    # Routes authentification
│   │   ├── student.py                 # Routes étudiants
│   │   └── teacher.py                 # Routes enseignants
│   ├── models.py                      # Modèles Pydantic
│   ├── db_service.py                  # Service JSON database
│   ├── main.py                        # Application FastAPI
│   ├── config.py                      # Configuration (env variables)
│   ├── clients.py                     # Clients OpenAI (GPT-4, GPT-5)
│   ├── OpenAI_Error_LLM_method.py     # ⚠️ CRITIQUE: System prompt IA
│   ├── __init__.py
│   └── teacher_student_relations.json
├── frontend/                           # React 18.3.1 + Vite 4.5.0
│   ├── src/
│   │   ├── components/                 # Composants React
│   │   ├── pages/                     # Pages de l'application
│   │   ├── hooks/                     # Hooks personnalisés
│   │   ├── services/                  # Services API
│   │   ├── styles/                    # Styles CSS
│   │   └── utils/                     # Utilitaires
│   ├── public/                        # Assets statiques
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── secure_data/                       # Données utilisateurs
│   ├── users_database.json            # Base utilisateurs
│   └── student_DB/                    # Analyses des étudiants
├── run_backend.py                     # Script démarrage backend
├── requirements.txt                   # Dépendances Python
├── .cursorrules                       # Règles de développement
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
