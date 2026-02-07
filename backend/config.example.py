"""
Example configuration file for Matej Language Lab backend.

Copy this file to config.py and configure your environment variables.
Do NOT store real secrets in version control.
"""
import os

# ==========================================
# OpenAI Configuration
# ==========================================
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your_api_key_here")
PROVIDER = os.getenv("PROVIDER", "openai").upper()

# Admin Configuration
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@matejlanguagelab.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "your_admin_password_here")

# JaaS (Jitsi as a Service) Configuration
JAAS_APP_ID = os.getenv("JAAS_APP_ID", "your_jaas_app_id")
JAAS_API_KEY_ID = os.getenv("JAAS_API_KEY_ID", "your_jaas_api_key_id")
JAAS_PRIVATE_KEY_PATH = os.getenv("JAAS_PRIVATE_KEY_PATH", "path/to/jaas_private.pem")
JAAS_DOMAIN = os.getenv("JAAS_DOMAIN", "meet.jit.si")
JAAS_TOKEN_TTL_MINUTES = int(os.getenv("JAAS_TOKEN_TTL_MINUTES", "120"))

# Database Configuration
DATA_DIR = os.getenv("DATA_DIR", "secure_data")
USERS_DB_FILE = os.path.join(DATA_DIR, "users_database.json")
STUDENT_DB_DIR = os.path.join(DATA_DIR, "student_DB")
RELATIONS_FILE = os.path.join(DATA_DIR, "teacher_student_relations.json")

# API Configuration
API_HOST = os.getenv("API_HOST", "127.0.0.1")
API_PORT = int(os.getenv("API_PORT", "8000"))
API_RELOAD = os.getenv("API_RELOAD", "True").lower() == "true"

# CORS Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "")
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
    "http://127.0.0.1:5177",
    "http://127.0.0.1:3000",
]
if FRONTEND_URL:
    CORS_ORIGINS.append(FRONTEND_URL)
    if FRONTEND_URL.startswith("http://"):
        CORS_ORIGINS.append(FRONTEND_URL.replace("http://", "https://"))

# Logging Configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
