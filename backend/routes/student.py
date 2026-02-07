"""
Student routes for Matej Language Lab
"""
from fastapi import APIRouter, HTTPException, status
from typing import Dict, List

from ..models import AssignTeacherRequest
from ..db_service import db


router = APIRouter(prefix="/api/student", tags=["student"])


@router.post("/assign-teacher")
async def assign_teacher(request: AssignTeacherRequest) -> Dict:
    """
    Assign or remove teacher from student
    
    Args:
        request: Student and teacher emails
        
    Returns:
        Success message
    """
    # Verify student exists
    student = db.get_user_by_email(request.student_email)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    if student.get("role") != "student":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'utilisateur doit être un étudiant"
        )
    
    # Verify teacher exists if provided
    if request.teacher_email:
        teacher = db.get_user_by_email(request.teacher_email)
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Enseignant non trouvé"
            )
        
        if teacher.get("role") != "teacher":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="L'utilisateur doit être un enseignant"
            )
    
    # Assign teacher
    db.assign_teacher_to_student(request.student_email, request.teacher_email)
    
    return {
        "success": True,
        "message": "Enseignant assigné avec succès" if request.teacher_email 
                   else "Enseignant retiré avec succès",
        "teacher_email": request.teacher_email
    }


@router.get("/{student_email}/teacher")
async def get_student_teacher(student_email: str) -> Dict:
    """
    Get the teacher assigned to a student
    
    Args:
        student_email: Student email
        
    Returns:
        Teacher information
    """
    teacher_email = db.get_student_teacher(student_email)
    
    if not teacher_email:
        return {
            "success": True,
            "teacher": None
        }
    
    teacher = db.get_user_by_email(teacher_email)
    
    return {
        "success": True,
        "teacher": {
            "email": teacher["email"],
            "name": teacher.get("name", teacher["email"])
        } if teacher else None
    }


@router.get("/{student_email}/analyses")
async def get_student_analyses(student_email: str) -> Dict:
    """
    Get all analyses for a student
    
    Args:
        student_email: Student email
        
    Returns:
        List of analyses
    """
    student_data = db.get_student_data(student_email)
    
    if not student_data:
        return {
            "success": True,
            "analyses": [],
            "count": 0
        }
    
    return {
        "success": True,
        "analyses": student_data.get("analyses", []),
        "count": len(student_data.get("analyses", []))
    }

