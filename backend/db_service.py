"""
JSON Database Service for Matej Language Lab
Handles all file-based database operations
"""
import json
import os
from typing import List, Optional, Dict
from pathlib import Path
from datetime import datetime
from . import config


class JSONDatabase:
    """JSON file-based database manager"""
    
    def __init__(self, base_path: str = None):
        # Use config.DATA_DIR if base_path not provided
        if base_path is None:
            base_path = config.DATA_DIR
        self.base_path = Path(base_path)
        self.users_file = self.base_path / "users_database.json"
        self.relations_file = self.base_path / "teacher_student_relations.json"
        self.student_db_path = self.base_path / "student_DB"
        
        # Ensure directories exist
        self.base_path.mkdir(exist_ok=True, parents=True)
        self.student_db_path.mkdir(exist_ok=True, parents=True)
        
        # Initialize files if they don't exist
        self._initialize_files()
    
    def _initialize_files(self):
        """Initialize JSON files if they don't exist"""
        if not self.users_file.exists():
            self._write_json(self.users_file, {"users": []})
        
        if not self.relations_file.exists():
            self._write_json(self.relations_file, {
                "relations": [],
                "last_updated": datetime.now().isoformat()
            })
    
    def _read_json(self, file_path: Path) -> Dict:
        """Read JSON file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}
    
    def _write_json(self, file_path: Path, data: Dict):
        """Write JSON file"""
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
    
    # User operations
    def get_all_users(self) -> List[Dict]:
        """Get all users"""
        data = self._read_json(self.users_file)
        return data.get("users", [])
    
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        users = self.get_all_users()
        return next((u for u in users if u["email"] == email), None)
    
    def create_user(self, user_data: Dict) -> Dict:
        """Create a new user"""
        data = self._read_json(self.users_file)
        users = data.get("users", [])
        
        # Check if user already exists
        if any(u["email"] == user_data["email"] for u in users):
            raise ValueError(f"User with email {user_data['email']} already exists")
        
        # Add created_at if not present
        if "created_at" not in user_data:
            user_data["created_at"] = datetime.now().isoformat()
        
        users.append(user_data)
        data["users"] = users
        self._write_json(self.users_file, data)
        
        return user_data
    
    def update_user(self, email: str, updates: Dict) -> Optional[Dict]:
        """Update user data"""
        data = self._read_json(self.users_file)
        users = data.get("users", [])
        
        for i, user in enumerate(users):
            if user["email"] == email:
                users[i].update(updates)
                data["users"] = users
                self._write_json(self.users_file, data)
                return users[i]
        
        return None
    
    # Teacher-Student relations
    def get_teacher_students(self, teacher_email: str) -> List[str]:
        """Get all students assigned to a teacher"""
        data = self._read_json(self.relations_file)
        relations = data.get("relations", [])
        return [
            r.get("student_email") 
            for r in relations 
            if r.get("teacher_email") == teacher_email and r.get("student_email")
        ]
    
    def assign_teacher_to_student(self, student_email: str, teacher_email: Optional[str]):
        """Assign or remove teacher from student"""
        data = self._read_json(self.relations_file)
        relations = data.get("relations", [])
        
        # Remove existing relation
        relations = [r for r in relations if r.get("student_email") != student_email]
        
        # Add new relation if teacher_email is provided
        if teacher_email:
            relations.append({
                "student_email": student_email,
                "teacher_email": teacher_email,
                "assigned_at": datetime.now().isoformat()
            })
        
        data["relations"] = relations
        data["last_updated"] = datetime.now().isoformat()
        self._write_json(self.relations_file, data)
    
    def get_student_teacher(self, student_email: str) -> Optional[str]:
        """Get the teacher assigned to a student"""
        data = self._read_json(self.relations_file)
        relations = data.get("relations", [])
        
        for r in relations:
            if r.get("student_email") == student_email:
                return r.get("teacher_email")
        
        return None
    
    # Student data operations
    def get_student_data(self, student_email: str) -> Optional[Dict]:
        """Get student analysis data"""
        safe_email = student_email.replace("@", "_at_").replace(".", "_")
        student_file = self.student_db_path / f"{safe_email}.json"
        
        if student_file.exists():
            return self._read_json(student_file)
        return None
    
    def save_student_data(self, student_email: str, data: Dict):
        """Save student analysis data"""
        safe_email = student_email.replace("@", "_at_").replace(".", "_")
        student_file = self.student_db_path / f"{safe_email}.json"
        
        self._write_json(student_file, data)
    
    def get_all_teachers(self) -> List[Dict]:
        """Get all teachers (for dropdown in student profile)"""
        users = self.get_all_users()
        return [
            {
                "email": u["email"],
                "name": u.get("name", u["email"]),
                "role": u["role"]
            }
            for u in users 
            if u.get("role") == "teacher"
        ]


# Global database instance
db = JSONDatabase()

