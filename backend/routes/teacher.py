"""
Teacher routes for Matej Language Lab
"""
from fastapi import APIRouter, HTTPException, status
from typing import Dict, List

from ..models import DashboardStats
from ..db_service import db


router = APIRouter(prefix="/api/teacher", tags=["teacher"])


@router.get("/{teacher_email}/students")
async def get_teacher_students(teacher_email: str) -> Dict:
    """
    Get all students assigned to a teacher
    
    Args:
        teacher_email: Teacher email
        
    Returns:
        List of students with their data
    """
    # Verify teacher exists
    teacher = db.get_user_by_email(teacher_email)
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
    
    # Get student emails
    student_emails = db.get_teacher_students(teacher_email)
    
    # Get full student data
    students = []
    for email in student_emails:
        student = db.get_user_by_email(email)
        if student:
            student_data = db.get_student_data(email)
            students.append({
                "email": student["email"],
                "name": student.get("name", student["email"]),
                "texts_count": student.get("texts_count", 0),
                "analyses_count": len(student_data.get("analyses", [])) if student_data else 0,
                "has_new_texts": student_data.get("has_new_texts", False) if student_data else False,
                "last_activity": student_data.get("last_activity") if student_data else None
            })
    
    return {
        "success": True,
        "students": students,
        "count": len(students)
    }


@router.get("/{teacher_email}/dashboard")
async def get_teacher_dashboard(teacher_email: str) -> Dict:
    """
    Get dashboard statistics for a teacher
    
    Args:
        teacher_email: Teacher email
        
    Returns:
        Dashboard statistics
    """
    # Verify teacher exists
    teacher = db.get_user_by_email(teacher_email)
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
    
    # Get students
    student_emails = db.get_teacher_students(teacher_email)
    
    total_texts = 0
    active_students = 0
    
    for email in student_emails:
        student = db.get_user_by_email(email)
        if student:
            texts_count = student.get("texts_count", 0)
            total_texts += texts_count
            if texts_count > 0:
                active_students += 1
    
    avg_texts = total_texts / len(student_emails) if student_emails else 0
    
    stats = DashboardStats(
        total_students=len(student_emails),
        total_texts=total_texts,
        average_texts_per_student=round(avg_texts, 1),
        active_students=active_students
    )
    
    return {
        "success": True,
        "stats": stats.dict()
    }

