"""
Authentication routes for Matej Language Lab
"""
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Dict
import hashlib
import logging

from ..models import LoginRequest, SignupRequest, UserResponse, UserRole
from ..db_service import db

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/api/auth", tags=["authentication"])


def hash_password(password: str) -> str:
    """Simple password hashing (use bcrypt in production)"""
    return hashlib.sha256(password.encode()).hexdigest()


@router.post("/login")
async def login(request: LoginRequest) -> Dict:
    """
    Login endpoint
    
    Args:
        request: Login credentials
        
    Returns:
        User data with success message
    """
    try:
        user = db.get_user_by_email(request.email)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou mot de passe incorrect"
            )
        
        # Verify password
        hashed_password = hash_password(request.password)
        if user.get("password") != hashed_password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou mot de passe incorrect"
            )
        
        # Get teacher if student
        teacher_email = None
        if user.get("role") == "student":
            teacher_email = db.get_student_teacher(request.email)
        
        # Get students if teacher
        students = []
        if user.get("role") == "teacher":
            students = db.get_teacher_students(request.email)
        
        return {
            "success": True,
            "message": "Connexion réussie",
            "user": {
                "email": user["email"],
                "name": user.get("name", user["email"]),
                "role": user["role"],
                "teacher_email": teacher_email,
                "students": students,
                "texts_count": user.get("texts_count", 0)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error for {request.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur serveur: {str(e)}"
        )


@router.post("/signup")
async def signup(request: SignupRequest) -> Dict:
    """
    Signup endpoint
    
    Args:
        request: Signup information
        
    Returns:
        Created user data
    """
    # Check if user already exists
    existing_user = db.get_user_by_email(request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte avec cet email existe déjà"
        )
    
    # Hash password
    hashed_password = hash_password(request.password)
    
    # Create user
    user_data = {
        "email": request.email,
        "name": request.name,
        "password": hashed_password,
        "role": request.role.value,
        "texts_count": 0,
        "students": [] if request.role == UserRole.TEACHER else None
    }
    
    try:
        db.create_user(user_data)
        
        # Assign teacher if provided and role is student
        if request.role == UserRole.STUDENT and request.teacher_email:
            db.assign_teacher_to_student(request.email, request.teacher_email)
        
        return {
            "success": True,
            "message": "Compte créé avec succès",
            "user": {
                "email": user_data["email"],
                "name": user_data["name"],
                "role": user_data["role"],
                "teacher_email": request.teacher_email if request.role == UserRole.STUDENT else None
            }
        }
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/teachers")
async def get_teachers() -> Dict:
    """
    Get all teachers (for student profile dropdown)
    
    Returns:
        List of teachers
    """
    teachers = db.get_all_teachers()
    
    return {
        "success": True,
        "teachers": teachers
    }

