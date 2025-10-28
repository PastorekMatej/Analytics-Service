"""
Configuration file for Matej Language Lab backend
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# OpenAI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL_GPT4 = "gpt-4"
OPENAI_MODEL_GPT5 = "gpt-4-turbo-preview"  # Update when GPT-5 is available

# Admin Configuration
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@matejlanguagelab.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")  # Should be set in .env

# Database Configuration
DATA_DIR = "secure_data"
USERS_DB_FILE = os.path.join(DATA_DIR, "users_database.json")
STUDENT_DB_DIR = os.path.join(DATA_DIR, "student_DB")
RELATIONS_FILE = os.path.join("backend", "teacher_student_relations.json")

# API Configuration
API_HOST = os.getenv("API_HOST", "127.0.0.1")
API_PORT = int(os.getenv("API_PORT", "8000"))
API_RELOAD = os.getenv("API_RELOAD", "True").lower() == "true"

# CORS Configuration
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
]

# Logging Configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

