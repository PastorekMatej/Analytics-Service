"""
Script to run the Matej Language Lab backend server
"""
import uvicorn
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

if __name__ == "__main__":
    print("🚀 Starting Matej Language Lab API...")
    print("📍 API will be available at: http://localhost:8000")
    print("📚 API docs will be available at: http://localhost:8000/docs")
    print("\n")
    
    uvicorn.run(
        "backend.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )

