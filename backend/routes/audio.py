"""
Audio routes for Matej Language Lab
Handles audio file uploads from video call recordings
"""
import os
import sys
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form, Query
from typing import Dict, List, Optional
from datetime import datetime

# Ensure UTF-8 encoding for console output on Windows
if sys.platform == 'win32':
    import codecs
    try:
        if hasattr(sys.stdout, 'buffer'):
            sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        if hasattr(sys.stderr, 'buffer'):
            sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
    except (AttributeError, TypeError):
        pass

from ..models import AudioSession
from ..db_service import db
from .. import config

# Audio file configuration
AUDIO_STORAGE_DIR = Path(config.DATA_DIR) / "audio_recordings"
AUDIO_SESSIONS_FILE = Path(config.DATA_DIR) / "audio_sessions.json"
ALLOWED_AUDIO_TYPES = {
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/mpeg",
    "audio/wav",
    "audio/flac",
    "audio/m4a",
    "audio/mpga",
    "audio/oga"
}
MAX_FILE_SIZE_MB = 100
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

# Ensure audio storage directory exists
AUDIO_STORAGE_DIR.mkdir(exist_ok=True, parents=True)

router = APIRouter(prefix="/api/audio", tags=["audio"])


def _read_audio_sessions() -> Dict:
    """Read audio sessions from JSON file"""
    try:
        if not AUDIO_SESSIONS_FILE.exists():
            return {"sessions": []}
        with open(AUDIO_SESSIONS_FILE, 'r', encoding='utf-8') as f:
            import json
            return json.load(f)
    except Exception as e:
        print(f"Error reading audio sessions: {e}")
        return {"sessions": []}


def _write_audio_sessions(data: Dict):
    """Write audio sessions to JSON file"""
    try:
        with open(AUDIO_SESSIONS_FILE, 'w', encoding='utf-8') as f:
            import json
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
    except Exception as e:
        print(f"Error writing audio sessions: {e}")
        raise


def _get_audio_session_by_id(session_id: str) -> Optional[Dict]:
    """Get audio session by ID"""
    data = _read_audio_sessions()
    sessions = data.get("sessions", [])
    return next((s for s in sessions if s.get("id") == session_id), None)


def _save_audio_session(session_data: Dict):
    """Save audio session to JSON file"""
    data = _read_audio_sessions()
    sessions = data.get("sessions", [])
    
    # Check if session already exists
    existing_index = next(
        (i for i, s in enumerate(sessions) if s.get("id") == session_data["id"]),
        None
    )
    
    if existing_index is not None:
        sessions[existing_index] = session_data
    else:
        sessions.append(session_data)
    
    data["sessions"] = sessions
    _write_audio_sessions(data)


@router.post("/upload")
async def upload_audio_recording(
    file: UploadFile = File(...),
    user_email: str = Form(...),
    session_id: str = Form(...),
    duration: str = Form(...)
) -> Dict:
    """
    Upload an audio recording from a video call
    
    Args:
        file: Audio file (WebM, OGG, MP4, WAV, etc.)
        user_email: Email of the user who recorded
        session_id: Unique session identifier
        duration: Duration in seconds
        
    Returns:
        Success message with session details
    """
    # Verify user exists
    user = db.get_user_by_email(user_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    # Validate content type
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Type de fichier audio non supporté: {content_type}. Types supportés: {', '.join(ALLOWED_AUDIO_TYPES)}"
        )
    
    # Read file content
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier audio est vide"
        )
    
    # Check file size
    file_size = len(file_bytes)
    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Taille maximale dépassée ({MAX_FILE_SIZE_MB}MB). Taille actuelle: {file_size / 1024 / 1024:.2f}MB"
        )
    
    # Parse duration
    try:
        duration_seconds = int(float(duration))
    except (ValueError, TypeError):
        duration_seconds = 0
    
    # Generate unique file name
    file_extension = Path(file.filename or "audio.webm").suffix or ".webm"
    file_name = f"{session_id}{file_extension}"
    file_path = AUDIO_STORAGE_DIR / file_name
    
    # Save file to disk
    try:
        with open(file_path, 'wb') as f:
            f.write(file_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la sauvegarde du fichier: {str(e)}"
        )
    
    # Create audio session record
    session_id_uuid = str(uuid.uuid4())
    session_data = {
        "id": session_id_uuid,
        "user_email": user_email,
        "session_id": session_id,
        "file_path": str(file_path),
        "file_name": file_name,
        "file_size": file_size,
        "duration": duration_seconds,
        "mime_type": content_type,
        "created_at": datetime.now().isoformat(),
        "analyzed": False,
        "analysis_id": None
    }
    
    # Save session to database
    _save_audio_session(session_data)
    
    return {
        "success": True,
        "message": "Enregistrement audio sauvegardé avec succès",
        "session_id": session_id_uuid,
        "file_name": file_name,
        "file_size": file_size,
        "duration": duration_seconds
    }


@router.get("/sessions")
async def get_audio_sessions(
    user_email: str = Query(..., description="User email")
) -> Dict:
    """
    Get all audio sessions for a user
    
    Args:
        user_email: User email
        
    Returns:
        List of audio sessions
    """
    # Verify user exists
    user = db.get_user_by_email(user_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    # Get all sessions
    data = _read_audio_sessions()
    all_sessions = data.get("sessions", [])
    
    # Filter by user email
    user_sessions = [
        s for s in all_sessions
        if s.get("user_email") == user_email
    ]
    
    # Sort by date (most recent first)
    user_sessions.sort(
        key=lambda x: x.get("created_at", ""),
        reverse=True
    )
    
    return {
        "success": True,
        "user_email": user_email,
        "sessions": user_sessions,
        "total": len(user_sessions)
    }


@router.get("/sessions/{session_id}")
async def get_audio_session_by_id(session_id: str) -> Dict:
    """
    Get a specific audio session by ID
    
    Args:
        session_id: Session unique identifier
        
    Returns:
        Audio session details
    """
    session = _get_audio_session_by_id(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session audio non trouvée"
        )
    
    return {
        "success": True,
        "session": session
    }


@router.delete("/sessions/{session_id}")
async def delete_audio_session(
    session_id: str,
    user_email: str = Query(..., description="User email for verification")
) -> Dict:
    """
    Delete an audio session
    
    Args:
        session_id: Session unique identifier
        user_email: User email (for verification)
        
    Returns:
        Success message
    """
    # Get session
    session = _get_audio_session_by_id(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session audio non trouvée"
        )
    
    # Verify ownership
    if session.get("user_email") != user_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à supprimer cette session"
        )
    
    # Delete file if exists
    file_path = Path(session.get("file_path", ""))
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception as e:
            print(f"Error deleting audio file: {e}")
    
    # Remove from sessions list
    data = _read_audio_sessions()
    sessions = data.get("sessions", [])
    sessions = [s for s in sessions if s.get("id") != session_id]
    data["sessions"] = sessions
    _write_audio_sessions(data)
    
    return {
        "success": True,
        "message": "Session audio supprimée avec succès"
    }





