"""
Main FastAPI application for Matej Language Lab backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from .routes import auth_router, student_router, teacher_router


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

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(student_router)
app.include_router(teacher_router)


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

