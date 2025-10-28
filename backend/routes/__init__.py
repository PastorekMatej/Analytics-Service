"""
Routes initialization for Matej Language Lab backend
"""
from .auth import router as auth_router
from .student import router as student_router
from .teacher import router as teacher_router
from .analysis import router as analysis_router

__all__ = ["auth_router", "student_router", "teacher_router", "analysis_router"]

