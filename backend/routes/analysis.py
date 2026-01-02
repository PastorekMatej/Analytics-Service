"""
Analysis routes for Matej Language Lab
Handles text analysis submissions and retrieval
"""
import io
import sys
from fastapi import APIRouter, HTTPException, status, Body, UploadFile, File
from typing import Dict, List, Optional
from datetime import datetime
import uuid

# Ensure UTF-8 encoding for console output on Windows
if sys.platform == 'win32':
    import codecs
    try:
        if hasattr(sys.stdout, 'buffer'):
            sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        if hasattr(sys.stderr, 'buffer'):
            sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
    except (AttributeError, TypeError):
        # Python 3.13+ may already have UTF-8 encoding or different structure
        pass

from ..models import TextAnalysis
from ..db_service import db
from ..OpenAI_Error_LLM_method import Analyser
from ..clients import get_openai_client
from PyPDF2 import PdfReader
from docx import Document


ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}
MAX_FILE_SIZE_MB = 25
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
TEXTUAL_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}
AUDIO_CONTENT_TYPES = {
    "audio/flac",
    "audio/m4a",
    "audio/mp3",
    "audio/mp4",
    "audio/mpeg",
    "audio/mpga",
    "audio/oga",
    "audio/ogg",
    "audio/wav",
    "audio/webm",
}


router = APIRouter(prefix="/api/analysis", tags=["analysis"])


def _extract_text_from_file(file_bytes: bytes, content_type: str, filename: str) -> str:
    def _normalize_pdf_text(text: str) -> str:
        """
        Reduce excessive line breaks from PDF extraction while preserving paragraphs.
        PyPDF2 often extracts text with each word on a separate line.
        """
        import re

        if not text:
            return ""
        
        # Normalize line endings
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        
        # Fix hyphenated line breaks (word-\nword becomes wordword)
        text = re.sub(r"-\s*\n\s*", "", text)
        
        # Simple approach: replace ALL newlines with spaces
        # This will join words that are on separate lines
        text = text.replace("\n", " ")
        
        # Clean up multiple spaces
        text = re.sub(r" +", " ", text)
        
        # Trim whitespace
        return text.strip()

    if content_type == "text/plain":
        try:
            return file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return file_bytes.decode("latin-1", errors="ignore")

    if content_type == "application/pdf":
        reader = PdfReader(io.BytesIO(file_bytes))
        pages = [page.extract_text() or "" for page in reader.pages]
        raw = "\n".join(pages)
        return _normalize_pdf_text(raw)

    if content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs]
        return "\n".join(paragraphs).strip()

    if content_type == "application/msword":
        # Legacy .doc not supported without extra dependencies
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format .doc non supporté. Merci d'utiliser un fichier .docx."
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Format de fichier non pris en charge. Utilisez PDF, DOCX ou TXT."
    )


@router.post("/transcribe-file")
async def transcribe_file(file: UploadFile = File(...)) -> Dict:
    """
    Transcribe an uploaded document to plain text without correction.

    Supports PDF, Word, and text files up to 25MB.
    """
    content_type = (file.content_type or "").lower()

    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format de fichier non pris en charge. Utilisez PDF, DOC/DOCX ou TXT."
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier est vide."
        )

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Taille maximale dépassée ({MAX_FILE_SIZE_MB}MB)."
        )

    # Branch: textual documents (PDF, DOCX, TXT)
    if content_type in TEXTUAL_CONTENT_TYPES or content_type == "application/msword":
        extracted = _extract_text_from_file(file_bytes, content_type, file.filename or "upload")
        if not extracted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Impossible d'extraire du texte depuis ce fichier."
            )
        return {
            "success": True,
            "transcript": extracted,
            "filename": file.filename,
        }

    # Branch: audio files (fallback to Whisper)
    if content_type not in AUDIO_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format de fichier non pris en charge pour la transcription audio."
        )

    try:
        client = get_openai_client()
        buffer = io.BytesIO(file_bytes)
        buffer.name = file.filename or "upload"
        buffer.seek(0)

        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=(buffer.name, buffer),
            response_format="text",
            temperature=0
        )

        transcript_text = transcription if isinstance(transcription, str) else getattr(transcription, "text", "")

        if not transcript_text:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Transcription vide renvoyée par le service."
            )

        return {
            "success": True,
            "transcript": transcript_text,
            "filename": file.filename,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la transcription: {str(exc)}"
        )


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
        
        # Collect all texts from the student (only written texts for now) with their dates
        all_texts_with_dates = []
        if "analyses" in student_data:
            for analysis in student_data["analyses"]:
                if analysis.get("text_content") and (analysis.get("text_type") == "written" or not analysis.get("text_type")):
                    # Extract and format date from created_at
                    date_str = ""
                    if analysis.get("created_at"):
                        try:
                            from datetime import datetime
                            # Parse ISO format date and format as YYYY-MM-DD
                            date_obj = datetime.fromisoformat(analysis["created_at"].replace("Z", "+00:00"))
                            date_str = date_obj.strftime("%Y-%m-%d")
                        except (ValueError, AttributeError):
                            # Fallback: try to extract date from string if ISO parsing fails
                            date_str = analysis.get("created_at", "")[:10] if len(analysis.get("created_at", "")) >= 10 else ""
                    
                    # Format text with date header
                    text_with_date = f"[Date: {date_str}]\n{analysis.get('text_content')}" if date_str else analysis.get('text_content')
                    all_texts_with_dates.append(text_with_date)
        
        # If no texts found, add the current text
        if not all_texts_with_dates and text_content:
            from datetime import datetime
            current_date = datetime.now().strftime("%Y-%m-%d")
            all_texts_with_dates.append(f"[Date: {current_date}]\n{text_content}")
        
        if not all_texts_with_dates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Aucun texte disponible pour l'analyse"
            )
        
        # Combine all texts for analysis
        combined_text = "\n\n---\n\n".join(all_texts_with_dates)
        try:
            print(f"[Analysis] Starting analysis for {student_email}, {len(all_texts_with_dates)} texts, total length: {len(combined_text)} chars")
        except UnicodeEncodeError:
            # Fallback if print fails due to encoding
            print(f"[Analysis] Starting analysis for {student_email}, {len(all_texts_with_dates)} texts")
        
        # Create analyzer instance
        analyzer = Analyser(student_id=student_email)
        
        # Perform analysis on all texts
        try:
            print(f"[Analysis] Calling OpenAI API...")
            analysis_result = analyzer.error_analyse(combined_text)
            if analysis_result:
                # Ensure the result is a valid UTF-8 string
                if isinstance(analysis_result, bytes):
                    analysis_result = analysis_result.decode('utf-8', errors='replace')
                elif not isinstance(analysis_result, str):
                    analysis_result = str(analysis_result)
                
                # Validate and sanitize UTF-8 encoding
                try:
                    # Try to encode to validate it's valid UTF-8
                    analysis_result.encode('utf-8')
                except UnicodeEncodeError:
                    # If encoding fails, replace problematic characters
                    analysis_result = analysis_result.encode('utf-8', errors='replace').decode('utf-8')
            
            # Safe logging
            try:
                result_length = len(analysis_result) if analysis_result else 0
                print(f"[Analysis] OpenAI API call completed, result length: {result_length}")
            except UnicodeEncodeError:
                print("[Analysis] OpenAI API call completed")
        except UnicodeEncodeError as unicode_err:
            # Handle Unicode encoding errors specifically
            error_msg = f"Unicode encoding error: {str(unicode_err)}"
            try:
                print(f"[Analysis] Unicode encoding error: {error_msg}")
            except UnicodeEncodeError:
                print("[Analysis] Unicode encoding error occurred")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erreur d'encodage Unicode lors de l'analyse. Veuillez reessayer."
            )
        except Exception as api_error:
            # Detect specific OpenAI error types
            error_type = type(api_error).__name__
            error_msg = str(api_error)
            
            # Check for quota/rate limit errors
            is_quota_error = (
                "RateLimitError" in error_type or
                "quota" in error_msg.lower() or
                "insufficient" in error_msg.lower() or
                "429" in error_msg
            )
            
            # Check for authentication errors
            is_auth_error = (
                "AuthenticationError" in error_type or
                "InvalidAuthenticationError" in error_type or
                "authentication" in error_msg.lower() or
                "api key" in error_msg.lower() or
                "401" in error_msg
            )
            
            # Safely convert error to string, handling Unicode issues
            try:
                error_msg.encode('utf-8')
            except (UnicodeEncodeError, UnicodeDecodeError):
                error_msg = "An error occurred during analysis. Please try again."
            
            # Log the error safely
            try:
                print(f"[Analysis] OpenAI API error ({error_type}): {error_msg[:200]}")
            except UnicodeEncodeError:
                print(f"[Analysis] OpenAI API error: {error_type}")
            
            # Return specific error message based on error type
            if is_quota_error:
                detail_msg = "Quota OpenAI dépassé. Veuillez vérifier votre plan et vos détails de facturation, ou réessayer plus tard."
            elif is_auth_error:
                detail_msg = "Erreur d'authentification OpenAI. Veuillez vérifier votre clé API."
            else:
                detail_msg = f"Erreur lors de l'appel à l'API OpenAI ({error_type}). Veuillez réessayer."
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=detail_msg
            )
        
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
        current_time = datetime.now().isoformat()
        if most_recent_analysis and most_recent_index >= 0:
            # Update existing analysis with global result
            student_data["analyses"][most_recent_index]["analysis_result"] = analysis_result
            # Update created_at to reflect when the report was generated
            student_data["analyses"][most_recent_index]["created_at"] = current_time
            # Add report_generated_at field to track when report was actually generated
            student_data["analyses"][most_recent_index]["report_generated_at"] = current_time
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
                "created_at": current_time,
                "report_generated_at": current_time
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
            "texts_analyzed": len(all_texts_with_dates)
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except UnicodeEncodeError as unicode_err:
        # Handle Unicode encoding errors specifically
        try:
            print("[Analysis] Unicode encoding error occurred")
        except:
            pass  # Even printing might fail
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur d'encodage Unicode lors de l'analyse. Veuillez reessayer."
        )
    except Exception as e:
        # Safely handle any other exceptions
        error_type = type(e).__name__
        try:
            error_msg = str(e)
            # Try to encode to ensure it's UTF-8 safe
            error_msg.encode('utf-8')
            safe_msg = f"Erreur lors de l'analyse ({error_type})"
        except (UnicodeEncodeError, UnicodeDecodeError):
            # If encoding fails, use a safe message
            safe_msg = "Erreur lors de l'analyse. Veuillez reessayer."
        
        # Log safely
        try:
            print(f"[Analysis] Error occurred: {error_type}")
        except:
            print("[Analysis] Error occurred")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=safe_msg
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

