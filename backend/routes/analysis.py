"""
Analysis routes for Matej Language Lab
Handles text analysis submissions and retrieval
"""
from fastapi import APIRouter, HTTPException, status, Body
from typing import Dict, List, Optional
from datetime import datetime
import uuid

from ..models import TextAnalysis
from ..db_service import db
from ..OpenAI_Error_LLM_method import Analyser


router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.post("/save")
async def save_text_only(
    student_email: str = Body(..., embed=True),
    text_content: str = Body(..., embed=True),
    text_type: str = Body("written", embed=True)
) -> Dict:
    """
    Save a text without performing analysis
    
    Args:
        student_email: Email of the student
        text_content: The text to save
        text_type: Type of text (written/oral)
        
    Returns:
        Success message with text ID
    """
    # Verify student exists
    student = db.get_user_by_email(student_email)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    if student.get("role") != "student":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seuls les étudiants peuvent sauvegarder des textes"
        )
    
    try:
        # Generate unique ID for this text
        text_id = str(uuid.uuid4())
        
        # Create text object (without analysis_result)
        text_data = {
            "id": text_id,
            "student_email": student_email,
            "text_content": text_content,
            "text_type": text_type,
            "analysis_result": None,  # No analysis performed
            "created_at": datetime.now().isoformat()
        }
        
        # Get or create student data file
        student_data = db.get_student_data(student_email)
        if not student_data:
            student_data = {
                "student_email": student_email,
                "analyses": [],
                "texts_count": 0,
                "has_new_texts": False
            }
        
        # Add text to student data
        if "analyses" not in student_data:
            student_data["analyses"] = []
        
        student_data["analyses"].append(text_data)
        student_data["texts_count"] = len(student_data["analyses"])
        student_data["has_new_texts"] = True
        student_data["last_activity"] = datetime.now().isoformat()
        
        # Save to database
        db.save_student_data(student_email, student_data)
        
        # Update user texts count
        db.update_user(student_email, {"texts_count": student_data["texts_count"]})
        
        return {
            "success": True,
            "message": "Texte sauvegardé avec succès",
            "text_id": text_id,
            "texts_count": student_data["texts_count"]
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la sauvegarde: {str(e)}"
        )


@router.post("/submit")
async def submit_text_for_analysis(
    student_email: str = Body(..., embed=True),
    text_content: Optional[str] = Body(None, embed=True),
    text_type: str = Body("written", embed=True)
) -> Dict:
    """
    Submit texts for comprehensive analysis
    
    This endpoint analyzes ALL saved texts from the student, not just a single text.
    It combines all written texts and generates a comprehensive analysis report.
    
    Args:
        student_email: Email of the student
        text_content: Optional - The text to analyze (if provided, will be included in the analysis)
        text_type: Type of text (written/oral) - only written texts are analyzed
        
    Returns:
        Analysis result with ID, including the number of texts analyzed
    """
    # Verify student exists
    student = db.get_user_by_email(student_email)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    if student.get("role") != "student":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seuls les étudiants peuvent soumettre des textes"
        )
    
    try:
        # Get all student texts for comprehensive analysis
        student_data = db.get_student_data(student_email)
        if not student_data:
            student_data = {
                "student_email": student_email,
                "analyses": [],
                "texts_count": 0,
                "has_new_texts": False
            }
        
        # Collect all texts from the student (only written texts for now)
        all_texts = []
        if "analyses" in student_data:
            for analysis in student_data["analyses"]:
                if analysis.get("text_content") and (analysis.get("text_type") == "written" or not analysis.get("text_type")):
                    all_texts.append(analysis.get("text_content"))
        
        # If no texts found, add the current text
        if not all_texts and text_content:
            all_texts.append(text_content)
        
        if not all_texts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Aucun texte disponible pour l'analyse"
            )
        
        # Combine all texts for analysis
        combined_text = "\n\n---\n\n".join(all_texts)
        
        # Create analyzer instance
        analyzer = Analyser(student_id=student_email)
        
        # Perform analysis on all texts
        analysis_result = analyzer.error_analyse(combined_text)
        
        # Find the most recent text without analysis or update the most recent one
        most_recent_analysis = None
        most_recent_index = -1
        
        if "analyses" not in student_data:
            student_data["analyses"] = []
        
        # Find the most recent text (written type) that matches or is the most recent
        for i, analysis in enumerate(student_data["analyses"]):
            if (analysis.get("text_type") == "written" or not analysis.get("text_type")):
                if not most_recent_analysis or analysis.get("created_at", "") > most_recent_analysis.get("created_at", ""):
                    most_recent_analysis = analysis
                    most_recent_index = i
        
        # Update or create analysis entry
        if most_recent_analysis and most_recent_index >= 0:
            # Update existing analysis with global result
            student_data["analyses"][most_recent_index]["analysis_result"] = analysis_result
            analysis_id = student_data["analyses"][most_recent_index]["id"]
            analysis_data = student_data["analyses"][most_recent_index]
        else:
            # Create new analysis entry if none exists
            analysis_id = str(uuid.uuid4())
            analysis_data = {
                "id": analysis_id,
                "student_email": student_email,
                "text_content": text_content if text_content else combined_text[:500] + "...",  # Store excerpt
                "text_type": text_type,
                "analysis_result": analysis_result,
                "created_at": datetime.now().isoformat()
            }
            student_data["analyses"].append(analysis_data)
        
        student_data["texts_count"] = len([a for a in student_data["analyses"] if a.get("text_content")])
        student_data["has_new_texts"] = True
        student_data["last_activity"] = datetime.now().isoformat()
        
        # Save to database
        db.save_student_data(student_email, student_data)
        
        # Update user texts count
        db.update_user(student_email, {"texts_count": student_data["texts_count"]})
        
        return {
            "success": True,
            "message": "Analyse effectuée avec succès sur l'ensemble des textes",
            "analysis_id": analysis_id,
            "analysis": analysis_result,
            "texts_count": student_data["texts_count"],
            "texts_analyzed": len(all_texts)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'analyse: {str(e)}"
        )


@router.get("/student/{student_email}")
async def get_student_analyses(
    student_email: str,
    limit: Optional[int] = 10,
    offset: Optional[int] = 0
) -> Dict:
    """
    Get all analyses for a student
    
    Args:
        student_email: Student email
        limit: Maximum number of analyses to return
        offset: Number of analyses to skip
        
    Returns:
        List of analyses
    """
    # Verify student exists
    student = db.get_user_by_email(student_email)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    # Get student data
    student_data = db.get_student_data(student_email)
    
    if not student_data or "analyses" not in student_data:
        return {
            "success": True,
            "student_email": student_email,
            "analyses": [],
            "total": 0,
            "limit": limit,
            "offset": offset
        }
    
    # Get analyses with pagination
    all_analyses = student_data["analyses"]
    total = len(all_analyses)
    
    # Sort by date (most recent first)
    sorted_analyses = sorted(
        all_analyses,
        key=lambda x: x.get("created_at", ""),
        reverse=True
    )
    
    # Apply pagination
    paginated_analyses = sorted_analyses[offset:offset + limit]
    
    return {
        "success": True,
        "student_email": student_email,
        "analyses": paginated_analyses,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/analysis/{analysis_id}")
async def get_analysis_by_id(analysis_id: str) -> Dict:
    """
    Get a specific analysis by ID
    
    Args:
        analysis_id: Analysis unique identifier
        
    Returns:
        Analysis details
    """
    # Search through all student files
    users = db.get_all_users()
    students = [u for u in users if u.get("role") == "student"]
    
    for student in students:
        student_data = db.get_student_data(student["email"])
        if student_data and "analyses" in student_data:
            for analysis in student_data["analyses"]:
                if analysis.get("id") == analysis_id:
                    return {
                        "success": True,
                        "analysis": analysis
                    }
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Analyse non trouvée"
    )


@router.delete("/analysis/{analysis_id}")
async def delete_analysis(analysis_id: str, student_email: str) -> Dict:
    """
    Delete a specific analysis
    
    Args:
        analysis_id: Analysis unique identifier
        student_email: Student email (for verification)
        
    Returns:
        Success message
    """
    # Get student data
    student_data = db.get_student_data(student_email)
    
    if not student_data or "analyses" not in student_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune analyse trouvée"
        )
    
    # Find and remove the analysis
    original_count = len(student_data["analyses"])
    student_data["analyses"] = [
        a for a in student_data["analyses"]
        if a.get("id") != analysis_id
    ]
    
    if len(student_data["analyses"]) == original_count:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analyse non trouvée"
        )
    
    # Update texts count
    student_data["texts_count"] = len(student_data["analyses"])
    
    # Save updated data
    db.save_student_data(student_email, student_data)
    db.update_user(student_email, {"texts_count": student_data["texts_count"]})
    
    return {
        "success": True,
        "message": "Analyse supprimée avec succès",
        "remaining_analyses": student_data["texts_count"]
    }


@router.post("/mark-as-read")
async def mark_analyses_as_read(student_email: str, teacher_email: str) -> Dict:
    """
    Mark all analyses as read by teacher
    
    Args:
        student_email: Student email
        teacher_email: Teacher email (for verification)
        
    Returns:
        Success message
    """
    # Verify teacher relationship
    student_teacher = db.get_student_teacher(student_email)
    if student_teacher != teacher_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas l'enseignant de cet étudiant"
        )
    
    # Get student data
    student_data = db.get_student_data(student_email)
    if not student_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Données étudiant non trouvées"
        )
    
    # Mark as read
    student_data["has_new_texts"] = False
    db.save_student_data(student_email, student_data)
    
    return {
        "success": True,
        "message": "Analyses marquées comme lues"
    }

