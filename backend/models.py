"""
Pydantic models for Matej Language Lab backend
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User role enumeration"""
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class User(BaseModel):
    """Base user model"""
    email: EmailStr
    password: str
    role: UserRole
    created_at: Optional[datetime] = Field(default_factory=datetime.now)


class Teacher(BaseModel):
    """Teacher model"""
    email: EmailStr
    name: str
    password: str
    role: UserRole = UserRole.TEACHER
    students: List[EmailStr] = Field(default_factory=list)
    created_at: Optional[datetime] = Field(default_factory=datetime.now)


class Student(BaseModel):
    """Student model"""
    email: EmailStr
    name: str
    password: str
    role: UserRole = UserRole.STUDENT
    teacher_email: Optional[EmailStr] = None
    texts_count: int = 0
    analyses: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = Field(default_factory=datetime.now)


class TextAnalysis(BaseModel):
    """Text analysis model"""
    id: str
    student_email: EmailStr
    text_content: str
    analysis_result: Optional[Dict] = None
    cecrl_level: Optional[str] = None
    errors_count: int = 0
    is_read_by_teacher: bool = False
    created_at: Optional[datetime] = Field(default_factory=datetime.now)


class LoginRequest(BaseModel):
    """Login request model"""
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    """Signup request model"""
    email: EmailStr
    password: str
    name: str
    role: UserRole
    teacher_email: Optional[EmailStr] = None


class AssignTeacherRequest(BaseModel):
    """Assign teacher request model"""
    student_email: EmailStr
    teacher_email: Optional[EmailStr] = None


class UserResponse(BaseModel):
    """User response model (without password)"""
    email: EmailStr
    name: str
    role: UserRole
    teacher_email: Optional[EmailStr] = None
    texts_count: Optional[int] = 0
    students: Optional[List[EmailStr]] = Field(default_factory=list)


class DashboardStats(BaseModel):
    """Dashboard statistics model"""
    total_students: int
    total_texts: int
    average_texts_per_student: float
    active_students: int


class AudioSession(BaseModel):
    """Audio session model for video call recordings"""
    id: str
    user_email: EmailStr
    session_id: str
    file_path: str
    file_name: str
    file_size: int  # Size in bytes
    duration: int  # Duration in seconds
    mime_type: str
    created_at: Optional[datetime] = Field(default_factory=datetime.now)
    analyzed: bool = False
    analysis_id: Optional[str] = None
