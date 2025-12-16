# 🎓 Maister - French Learning Analytics Platform

> **An AI-powered platform for analyzing written and oral French productions for FLE (French as a Foreign Language) students.**

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Account System](#-account-system)
- [API Documentation](#-api-documentation)
- [Architecture](#-architecture)
- [Development](#-development)
- [Roadmap](#-roadmap)
- [Prompt Evaluation](#-prompt-evaluation-gpt-5)

---

## 🎯 Overview

**Maister** is an advanced analytics platform specialized in evaluating texts from FLE (French as a Foreign Language) students. The platform uses AI to analyze linguistic errors and provide personalized feedback to learners and teachers.

### Key Capabilities

- **Comprehensive Text Analysis** - Analyzes all student texts together for complete progress reports
- **Save & Analyze Separately** - Save texts without immediate analysis, then analyze when ready
- **Progress Tracking** - Detailed dashboards with statistics and trend analysis
- **Teacher-Student Management** - Assign teachers to students for personalized guidance
- **Modern UI** - Elegant, responsive interface with full English localization
- **Real-time Feedback** - Get detailed analysis reports with error categorization

---

## ✨ Features

### For Students 👨‍🎓

- ✅ Submit written texts for comprehensive analysis
- ✅ Save texts for later analysis
- ✅ View all saved texts in a list below the submission form
- ✅ Delete saved texts with confirmation
- ✅ View text preview, creation date, and analysis status (analyzed/pending)
- ✅ View detailed progress reports with error categorization
- ✅ Track improvement over time with visual dashboards
- ✅ Assign a teacher for personalized guidance (optional)
- ✅ Complete analysis history
- ✅ Upload PDF/Word/TXT files and auto-transcribe them to plain text (no correction)

### For Teachers 👨‍🏫

- ✅ Dedicated dashboard to track assigned students
- ✅ View all analyses from students who selected you
- ✅ New text submission indicators
- ✅ Statistics and progress reports per student
- ✅ Monitor student improvement trends

### Technical Features

- ✅ Full English UI (translated January 2025)
- ✅ Modern React 18.3.1 + Vite 4.5.0 frontend
- ✅ FastAPI backend with modular architecture
- ✅ OpenAI GPT-5/GPT-4 integration for analysis
- ✅ JSON-based lightweight database
- ✅ RESTful API with interactive documentation

---

## 🚀 Quick Start

### Prerequisites

- **Python:** 3.9+ (with venv for isolation)
- **Node.js:** 18+ (for React frontend)
- **OpenAI API Key:** Required for text analysis

### Backend Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows CMD:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your OpenAI API key
echo "OPENAI_API_KEY=your_openai_key_here" > .env
echo "PROVIDER=openai" >> .env
```

**Start the backend server:**

**Option 1: Using uvicorn directly (recommended)**
```powershell
# Windows PowerShell
.\venv\Scripts\Activate.ps1
uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

**Option 2: Using the run script**
```powershell
# Windows PowerShell (set UTF-8 encoding to avoid emoji issues)
$env:PYTHONIOENCODING="utf-8"
.\venv\Scripts\Activate.ps1
python run_backend.py
```

**Backend will be available at:**
- API: `http://localhost:8000` or `http://127.0.0.1:8000`
- Interactive Docs: `http://localhost:8000/docs` (Swagger UI)
- Health Check: `http://localhost:8000/api/health`

⚠️ **Important:** You must create a `.env` file at the root with your OpenAI API key for analyses to work.

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

**For explicit host/port configuration:**
```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

**Frontend will be available at:** `http://localhost:5173`

**Application Language:** The entire user interface is in English (as of January 2025).

---

## 👥 Account System

The platform offers two distinct account types:

### 👨‍🎓 Student Account

**Features:**
- Access to written text and oral production analyses
- Personalized progress tracking
- Ability to assign a teacher (optional)
- Complete analysis history
- Save texts for later analysis
- Comprehensive reports analyzing all submitted texts

### 👨‍🏫 Teacher Account

**Features:**
- Dedicated dashboard to track assigned students
- Access to analyses from all students who selected them
- New text submission indicators
- Statistics and progress reports

### 💰 Subscription

**Current Status:** All accounts are free during the development phase (Beta).  
**Future:** A payment system will be added in Phase 7 (see [Roadmap](#-roadmap)).

---

## 🔌 API Documentation

### Base URLs

- **Backend API:** `http://localhost:8000` (development)
- **Interactive Docs:** `http://localhost:8000/docs` (Swagger UI)

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | User login with email and password |
| `POST` | `/api/auth/signup` | User registration with role selection |
| `GET` | `/api/auth/teachers` | Get list of all teachers (for student profile dropdown) |

### Student Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/student/assign-teacher` | Assign or remove teacher from student |
| `GET` | `/api/student/{student_email}/teacher` | Get the teacher assigned to a student |
| `GET` | `/api/student/{student_email}/analyses` | Get all analyses for a student |

### Teacher Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/teacher/{teacher_email}/students` | Get all students assigned to a teacher |
| `GET` | `/api/teacher/{teacher_email}/dashboard` | Get dashboard statistics for a teacher |

### Analysis Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analysis/submit` | Submit texts for comprehensive analysis (analyzes all student texts) |
| `POST` | `/api/analysis/transcribe-file` | Transcribe PDF/DOCX/TXT to plain text (no correction). Audio (mp3, wav, etc.) uses Whisper. |
| `POST` | `/api/analysis/save` | Save a text without performing analysis |
| `GET` | `/api/analysis/student/{student_email}` | Get all analyses for a student (with pagination) |
| `GET` | `/api/analysis/analysis/{analysis_id}` | Get a specific analysis by ID |
| `DELETE` | `/api/analysis/analysis/{analysis_id}` | Delete a specific analysis |
| `POST` | `/api/analysis/mark-as-read` | Mark analyses as read by teacher |

**Note:** The `/api/analysis/submit` endpoint performs comprehensive analysis by combining all saved texts from the student for a complete progress report.

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check endpoint |
| `GET` | `/` | API root with version info |

### Frontend Services

The frontend uses service files located in `frontend/src/services/`:

- `authService.js` - Authentication API calls
- `studentService.js` - Student data management
- `analysisService.js` - Analysis operations
- `ttsService.js` - TTS integration (planned)

---

## 🛠️ Architecture

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python 3.13, FastAPI 0.104.1, Uvicorn |
| **AI/ML** | OpenAI GPT-5, GPT-4 (Pinecone vectors planned) |
| **Database** | JSON files (lightweight, fast, easy to maintain) |
| **Frontend** | React 18.3.1 + Vite 4.5.0 |
| **Build Tools** | Vite 4.5.0 (development and build) |
| **Deployment** | Local (cloud migration planned) |

### Backend Architecture

**Framework:** FastAPI with modular architecture

**Main Components:**

```
backend/
├── routes/
│   ├── auth.py          # Authentication routes
│   ├── student.py       # Student routes
│   ├── teacher.py       # Teacher routes
│   └── analysis.py      # Analysis routes
├── models.py            # Pydantic models (User, Teacher, Student, Analysis)
├── db_service.py        # JSON database service
├── main.py              # FastAPI application
├── config.py            # Configuration (environment variables)
├── clients.py           # OpenAI clients (GPT-4, GPT-5, embeddings)
└── OpenAI_Error_LLM_method.py  # ⚠️ CRITICAL: Main AI analysis engine
```

**Analytics Engine:**
- `OpenAI_Error_LLM_method.py` - Main linguistic error analyzer
- Uses OpenAI GPT-5/GPT-4 for comprehensive text analysis
- Analyzes grammar, syntax, vocabulary, conjugation errors
- Provides personalized improvement suggestions

**Features:**
- Role-based authentication (Student/Teacher/Admin)
- Teacher-student relationship management
- Real-time dashboard statistics
- Automatic error detection and categorization
- Progress analysis for FLE students

### Frontend Architecture

**Framework:** React 18.3.1 with functional components and hooks

**Structure:**

```
frontend/
├── src/
│   ├── components/      # React components (Layout, etc.)
│   ├── pages/          # Application pages
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── WrittenAnalysis.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Profile.jsx
│   │   └── ...
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API service files
│   ├── styles/         # CSS styles
│   └── utils/          # Utility functions
├── public/             # Static assets (logo.svg, etc.)
├── package.json
├── vite.config.js
└── index.html
```

**Design System:**
- **Fonts:** Inter/SF Pro Display (weights 300-400)
- **Color Palette:** #fafafa, #2a2a2a, #ffcc4d
- **Components:** Cards with 16-18px radius, borders #f0f0f0
- **Layout:** Max-width 1200px, 4-column grid on desktop
- **Language:** Full English UI (as of January 2025)

### Project Structure

```
analytics-service/
├── backend/
│   ├── routes/              # API route handlers
│   ├── models.py            # Data models
│   ├── db_service.py        # Database service
│   ├── main.py              # FastAPI app
│   ├── config.py            # Configuration
│   ├── clients.py           # OpenAI clients
│   └── OpenAI_Error_LLM_method.py  # ⚠️ CRITICAL: AI system prompt
├── frontend/                # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── secure_data/             # User data storage
│   ├── users_database.json
│   └── student_DB/          # Student analyses
├── docs/                    # Documentation
│   └── prompt_evals/        # Prompt evaluation results
├── run_backend.py           # Backend startup script
├── requirements.txt         # Python dependencies
├── .cursorrules             # Development rules
└── README.md
```

---

## 💻 Development

### Environment Setup

- **Python:** 3.9+ (with venv for isolation)
- **Node.js:** 18+ (for React frontend)
- **React:** 18.3.1 (functional components + hooks)
- **Vite:** 4.5.0 (build tool + dev server)
- **Docker:** For containerization (optional)
- **Git:** Feature branch workflow (`feat/feature-name`)

### Testing

- **Backend:** pytest (Python)
- **Frontend:** Jest + Testing Library (React)
- **New tests:** `backend/tests/test_transcription.py` covers file-type and size validation plus successful transcription stubbing.

### Development Workflow

> ℹ️ **Note:** Detailed development workflow and commit rules are in `.cursorrules`

**Commit Format:**
- `feat:` for new features
- `fix:` for bug fixes
- `refactor:` for code refactoring
- `docs:` for documentation
- `style:` for formatting

**Branch Strategy:**
- `feat/feature-name` for new features
- `fix/bug-description` for bug fixes
- `main` for production-ready code

### ⚠️ Important Notes

**System Prompt Modification:**
The file `backend/OpenAI_Error_LLM_method.py` contains the **main AI system prompt** that defines the linguistic error analysis behavior. Any modification to this file should follow strict guidelines (see `.cursorrules` for details).

---

## 🗺️ Roadmap

### ✅ Phase 1: Interface Redesign (COMPLETE)

**Status:** ✅ **COMPLETE**  
**Duration:** 3-4 weeks  
**Completed:** January 2025

**Achievements:**
- ✅ Migration from Streamlit to React 18.3.1 + Vite 4.5.0
- ✅ Complete FastAPI backend architecture
- ✅ Student/Teacher account system with role management
- ✅ Elegant minimalist design (Crextio-inspired)
- ✅ Dashboard with statistics and filtering
- ✅ Full UI translation to English
- ✅ Application rebranding to "Maister" with logo
- ✅ Text save functionality (save without analysis)
- ✅ Comprehensive analysis (analyzes all student texts)
- ✅ Progress dashboard with detailed reports and tabs
- ✅ Document upload flow for written analysis with OpenAI transcription (no correction)

**Next Steps:**
- [ ] Display analysis history in dashboard
- [ ] Implement teacher features (view all students)
- [ ] End-to-end testing of complete flow

---

### 🔜 Phase 2: Automatic Saving (PLANNED)

**Status:** 🔜 **PLANNED**
**Duration:** 4-5 weeks

**Objectives:**
- Desktop application (Electron) for Windows/Mac/Linux
- Automatic detection of French texts
- Hotkeys for quick saving (Ctrl+Shift+S)
- Cloud synchronization via REST API

**Deliverables:** Desktop app, API sync, Documentation

---

### 🔜 Phase 3: Specialized Consultation (PLANNED)

**Status:** 🔜 **PLANNED**  
**Duration:** 2-3 weeks

**Objectives:**
- Recruit UI/UX developer (React + Design)
- TTS expert consultation (French FLE)
- Technical recommendations

**Deliverables:** Contracts, Expert reports, Implementation plan

---

### 🔜 Phase 4: Google Meet Integration (PLANNED)

**Status:** 🔜 **PLANNED**  
**Duration:** 3-4 weeks

**Objectives:**
- Google Meet API + OAuth2
- Transcription pipeline (Google Speech-to-Text)
- Recording management interface
- Real-time transcription

**Deliverables:** Google Meet module, Transcription interface, API documentation

---

### 🔜 Phase 5: TTS Calibration for French FLE (PLANNED)

**Status:** 🔜 **PLANNED**  
**Duration:** 4-6 weeks

**Objectives:**
- Specialized FLE TTS models
- International accent adaptation
- Evaluation metrics (accuracy, fluency)
- Calibration interface

**Deliverables:** Calibrated TTS models, Calibration interface, Documentation

---

### 🔜 Phase 6: TTS Transcription Saving (PLANNED)

**Status:** 🔜 **PLANNED**  
**Duration:** 2-3 weeks

**Objectives:**
- Transcription database + metadata
- Management interface (filters, search, export)
- Automatic sync with Google Meet
- Backup and recovery

**Deliverables:** Database, Management interface, API sync

---

### 🔜 Phase 7: Payment System & Subscriptions (PLANNED)

**Status:** 🔜 **PLANNED**  
**Duration:** 4-6 weeks

**Objectives:**
- Stripe integration for secure payments
- Subscription plans (Free/Premium/Enterprise)
- Monthly and annual subscriptions for students and teachers
- Billing management and payment history
- 14-day free trial periods
- Admin dashboard for subscription management
- Feature limitations based on plan

**Planned Pricing:**
- **Free:** Limited access (10 analyses/month)
- **Student Premium:** €9.99/month - Unlimited analyses
- **Teacher Pro:** €19.99/month - Full dashboard + 50 students
- **Institution:** Custom quote - Unlimited access + priority support

**Deliverables:** Stripe module, Subscription interface, Automatic billing system, Payment API documentation

**Note:** All accounts remain free during development phases 1-6 (Beta version).

---

## 🔬 Prompt Evaluation (GPT-5)

**Automated testing system to calibrate the system prompt with variations of `reasoning_effort`.**

### Installation

```bash
# Install dependencies (includes rapidfuzz for similarity metrics)
pip install -r requirements.txt
```

### Running an Evaluation

```bash
python -m backend.prompt_eval.runner \
  --experiment reasoning-sweep \
  --reasoning-efforts low medium high \
  --runs 5 \
  --prompt backend/system_prompt/prompt_v1.md \
  --student secure_data/student_DB/alexandre.json \
  --max-tokens 20000
```

### Results Structure

```
docs/prompt_evals/reasoning-sweep/prompt_v1/
├── reasoning-low/
│   ├── runs/          # 5 raw reports (run_01.txt...run_05.txt)
│   ├── summary/       # summary.md (X/5 agreements) + summary.json (metrics)
│   └── prompt/        # prompt.md (copy of used prompt)
├── reasoning-medium/
│   └── ...
└── reasoning-high/
    └── ...
```

### Generated Metrics

- **Quantitative Agreements**: X/5 for ÉVOLUTION_GLOBALE, GRAMMAIRE, VOCABULAIRE, STYLE, PERSISTANTES
- **Qualitative Similarity**: Score 0-100 for narrative summaries
- **Tokens**: Total and average (prompt, completion, reasoning) per configuration
- **Notes**: API errors, warnings, particularities

### Supported Parameters (GPT-5)

- ✅ `--reasoning-efforts`: `low`, `medium`, `high` (controls reasoning depth)
- ✅ `--max-tokens`: completion limit (default: 20000)
  - **Important**: GPT-5 consumes tokens for internal reasoning + final output
  - **Recommended minimum**: 16000 (otherwise empty or truncated output)
- ✅ `--runs`: number of runs per config (default: 5)
- ✅ `--out`: output directory (default: `docs/prompt_evals`)

### Parameters NOT Supported by GPT-5

- ❌ `temperature` (fixed at 1)
- ❌ `top_p` (not modifiable)
- ❌ `seed` (not supported)
- ❌ `response_format` (no strict JSON mode)

### Module Architecture

- `backend/prompt_eval/runner.py`: CLI and run orchestration
- `backend/prompt_eval/parser.py`: Parse LLM outputs (free-text or JSON)
- `backend/prompt_eval/metrics.py`: Calculate X/5 agreements and similarities
- `backend/prompt_eval/report.py`: Generate summary.md and summary.json

---

## 📝 Recent Changes

### Recent Commits

- `6f7bc1c` **feat:** harmonize analysis dashboard design with color themes and symmetry - Introduced color themes (green, blue, pink, orange, purple, teal, indigo) for each analysis section, improving visual hierarchy and symmetry
- `7c2060e` **fix:** relax regex for detecting error blocks to handle bullet points - Fixed issue where error cards were not rendering correctly because the parser didn't account for bullet points or indentation in the raw text
- `e317ebe` **feat:** improve graphical presentation of analysis error cards - Redesigned error cards with structured layout, better typography, and distinct sections for pattern, occurrences, examples, and explanation
- `d4a1483` **fix:** remove written analyses column header - Removed the "Written Analyses" header from the dashboard progress column
- `82aedde` **fix:** increase font size of analysis section titles
- `82815e3` **fix:** Conclusion section display - Fixed parsing logic to prevent 'résumé: >' from being detected as CONCLUSION section header, improved extraction of résumé content from ÉVOLUTION_GLOBALE section, and added comprehensive logging for debugging
- `6fbe391` **feat:** Saved texts list display - Added "My Saved Texts" section in My Writings page to display all saved texts with preview, date, status, and delete functionality
- `feat:` **File upload and transcription** - Added PDF/DOCX/TXT file upload with automatic transcription for written analysis
- `33a395c` **docs:** refactor README with improved structure and organization
- `03e700c` **feat:** translate entire UI to English and rebrand to Maister

### January 2025 Updates

- ✅ **Saved Texts List**: Added a new "My Saved Texts" section in the My Writings page that displays all saved texts below the submission form. Users can view text previews (truncated to 100 characters), creation dates, analysis status badges (Analyzed/Pending), and delete texts with confirmation. The list automatically refreshes after saving or deleting texts.
- ✅ **File Upload Feature**: Added document upload (PDF, DOCX, TXT) with automatic transcription to plain text. Files are transcribed without correction and the text is automatically populated in the analysis form. Supports files up to 25MB.
- ✅ **Interface Redesign**: Complete overhaul of the "My Teacher" section in the Profile page with a modern, card-based layout.
- ✅ **Analysis Report Redesign**: Improved the visual presentation of analysis reports in the dashboard. Added structured cards for error types, modern tab styling, and enhanced typography for better readability. Fixed conclusion section to correctly display résumé content from analysis reports.
- ✅ **Progress Indicators**: Added "In Progress" banners and badges for the "My Voice" feature to clearly communicate development status.
- ✅ **Typography**: Refactored global typography with a harmonized 'Inter' font stack, improved heading hierarchy, and refined color palette.
- ✅ **Iconography**: Updated navigation icons (text analysis) and section icons for better visual semantics.
- ✅ **Responsive Design**: Improved mobile responsiveness for profile and teacher selection sections.
- ✅ Application rebranded to "Maister" with logo.
- ✅ New text save functionality (save without analysis).
- ✅ Comprehensive analysis feature (analyzes all student texts).
- ✅ Enhanced dashboard with progress tracking and analysis tabs.
- ✅ Improved sidebar navigation with collapsible menu.
- ✅ Refactored README with improved structure and documentation.

---

**Last Updated:** January 2025

---

*Made with ❤️ for French language learners*
