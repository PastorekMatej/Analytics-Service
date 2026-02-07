"""
Main FastAPI application for Matej Language Lab backend
"""
import sys
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from dotenv import load_dotenv

# Get the project root directory (parent of backend directory)
project_root = Path(__file__).parent.parent
env_path = project_root / ".env"

# Load environment variables from .env file with explicit path
load_dotenv(dotenv_path=env_path, override=True)

# Set UTF-8 encoding for the entire application (Windows compatibility)
if sys.platform == 'win32':
    import codecs
    # Set UTF-8 for stdout/stderr
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
    # Set environment variable for subprocesses
    os.environ['PYTHONIOENCODING'] = 'utf-8'

from .routes import (
    auth_router,
    student_router,
    teacher_router,
    analysis_router,
    audio_router,
    jitsi_router
)
from . import config


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Matej Language Lab API",
    description="API backend pour l'analyse de textes FLE",
    version="1.0.0"
)

# Configure CORS - use configurable origins from config.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(student_router)
app.include_router(teacher_router)
app.include_router(analysis_router)
app.include_router(audio_router)
app.include_router(jitsi_router)


@app.on_event("startup")
async def startup_event():
    """Verify configuration on startup"""
    # Reload environment variables to ensure they're loaded
    load_dotenv(dotenv_path=env_path, override=True)
    
    # Verify OpenAI API key is loaded
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.error("OPENAI_API_KEY not found in environment variables!")
        logger.error(f"Checked .env file at: {env_path}")
        logger.error("Please ensure OPENAI_API_KEY is set in .env file")
    else:
        logger.info(f"OpenAI API key loaded successfully (length: {len(api_key)})")
    
    # Verify config module has the key
    try:
        if not config.OPENAI_API_KEY:
            logger.error("OPENAI_API_KEY not found in config module!")
        else:
            logger.info("Configuration verified successfully")
    except Exception as e:
        logger.error(f"Error verifying configuration: {e}")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Matej Language Lab API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Matej Language Lab API"
    }


if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting Matej Language Lab API server...")
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

