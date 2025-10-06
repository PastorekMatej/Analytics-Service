import streamlit as st
import hashlib
import re
import json
import os
from datetime import datetime
from pathlib import Path

# Import your analytics classes (they're in the same directory now)
try:
    from OpenAI_Error_LLM_method import Analyser
    from clients import client_gpt_4o, get_admin_credentials
except ImportError:
    st.error("Analytics service not found. Please check the path configuration.")
    st.stop()

# Page configuration
st.set_page_config(
    page_title="French Learning Analytics Lab",
    page_icon="🔬",
    layout="wide"
)

# Initialize session state
if 'authenticated' not in st.session_state:
    st.session_state.authenticated = False
if 'user_email' not in st.session_state:
    st.session_state.user_email = None
if 'user_role' not in st.session_state:
    st.session_state.user_role = 'student'

# Secure file paths (outside web root)
SECURE_DATA_ROOT = Path(os.getenv("SECURE_DATA_ROOT", Path(__file__).parent / "secure_data"))
USERS_DB_FILE = SECURE_DATA_ROOT / "users_database.json"
STUDENT_DATA_DIR = SECURE_DATA_ROOT / "student_DB"

# Ensure secure directories exist
SECURE_DATA_ROOT.mkdir(exist_ok=True)
STUDENT_DATA_DIR.mkdir(exist_ok=True)

# Get built-in admin credentials
ADMIN_CREDENTIALS = get_admin_credentials()

def is_builtin_admin(email, password):
    """Check if credentials match built-in admin"""
    return (email == ADMIN_CREDENTIALS["email"] and 
            password == ADMIN_CREDENTIALS["password"])

def load_users():
    """Load users from secure JSON file"""
    if USERS_DB_FILE.exists():
        try:
            with open(USERS_DB_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            st.error("Error loading user database")
            return {}
    return {}

def save_users(users):
    """Save users to secure JSON file"""
    try:
        with open(USERS_DB_FILE, 'w') as f:
            json.dump(users, f, indent=2)
    except Exception as e:
        st.error("Error saving user database")

def get_user_data_file(email):
    """Get secure file path for user data"""
    safe_email = email.replace('@', '_at_').replace('.', '_')
    return STUDENT_DATA_DIR / f"{safe_email}.json"

def load_user_conversations(email):
    """Load conversations for a specific user from secure location"""
    if not check_user_access(st.session_state.user_email, email):
        raise PermissionError("Access denied")
    
    user_file = get_user_data_file(email)
    if user_file.exists():
        try:
            with open(user_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return {"student_id": email, "conversations": []}
    return {"student_id": email, "conversations": []}

def save_user_conversations(email, data):
    """Save conversations for a specific user to secure location"""
    if not check_user_access(st.session_state.user_email, email):
        raise PermissionError("Access denied")
    
    user_file = get_user_data_file(email)
    try:
        with open(user_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
    except Exception as e:
        st.error("Error saving conversation data")

def check_user_access(current_user, target_user):
    """Check if current user can access target user's data"""
    if not current_user:
        return False
    
    # Built-in admin has full access
    if current_user == ADMIN_CREDENTIALS["email"]:
        return True
    
    # Students can only access their own data
    if st.session_state.user_role == 'student':
        return current_user == target_user
    
    # Teachers can access their assigned students (for now, all students)
    if st.session_state.user_role == 'teacher':
        return True
    
    # Regular admins can access everything
    if st.session_state.user_role == 'admin':
        return True
    
    return False

def get_available_students():
    """Get list of students current user can access"""
    if not st.session_state.authenticated:
        return []
    
    students = []
    if STUDENT_DATA_DIR.exists():
        for file_path in STUDENT_DATA_DIR.glob("*.json"):
            if file_path.name != "users_database.json":
                # Extract email from filename
                safe_email = file_path.stem
                email = safe_email.replace('_at_', '@').replace('_', '.')
                
                if check_user_access(st.session_state.user_email, email):
                    students.append(email)
    
    return students

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password (8 characters, numbers)"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    return True, "Valid password"

def signup_page():
    """Sign up page with role selection"""
    st.header("📝 Create Account")
    
    # Show built-in admin info
    with st.expander("ℹ️ Built-in Admin Account Available"):
        st.info(f"**Built-in Admin Email:** {ADMIN_CREDENTIALS['email']}")
        st.info(f"**Built-in Admin Password:** {ADMIN_CREDENTIALS['password']}")
        st.warning("Use the built-in admin account for full system access!")
    
    with st.form("signup_form"):
        st.subheader("Sign Up")
        
        email = st.text_input("Email Address", placeholder="your.email@example.com")
        password = st.text_input("Password", type="password", placeholder="At least 8 characters with numbers")
        confirm_password = st.text_input("Confirm Password", type="password")
        
        # Check if admin already exists (excluding built-in admin)
        users = load_users()
        regular_admin_exists = any(user_data.get('role') == 'admin' for user_data in users.values())
        
        # Role selection - no admin option for regular users since built-in admin exists
        role = st.selectbox("Role", ["student", "teacher"])
        st.info("ℹ️ Admin role is handled by the built-in admin account")
        
        submitted = st.form_submit_button("Create Account")
        
        if submitted:
            # Prevent creating account with built-in admin email
            if email == ADMIN_CREDENTIALS["email"]:
                st.error("❌ This email is reserved for the built-in admin account")
                return
            
            # Validation
            if not email or not validate_email(email):
                st.error("Please enter a valid email address")
                return
            
            is_valid, message = validate_password(password)
            if not is_valid:
                st.error(message)
                return
            
            if password != confirm_password:
                st.error("Passwords do not match")
                return
            
            # Check if user already exists
            if email in users:
                st.error("An account with this email already exists")
                return
            
            # Create new user
            hashed_password = hash_password(password)
            users[email] = {
                'password': hashed_password,
                'role': role,
                'created_at': datetime.now().isoformat(),
                'confirmed': True
            }
            
            # Save to database
            save_users(users)
            
            # Create initial conversation file for new user
            initial_data = {"student_id": email, "conversations": []}
            save_user_conversations(email, initial_data)
            
            st.success("Account created successfully!")
            st.balloons()

def login_page():
    """Login page with built-in admin support"""
    st.header("🔐 Login")
    
    # Show built-in admin credentials
    with st.expander("👑 Built-in Admin Login"):
        st.success(f"**Admin Email:** {ADMIN_CREDENTIALS['email']}")
        st.success(f"**Admin Password:** {ADMIN_CREDENTIALS['password']}")
        st.info("Copy these credentials to login as admin")
    
    with st.form("login_form"):
        st.subheader("Sign In")
        
        email = st.text_input("Email Address", placeholder="your.email@example.com")
        password = st.text_input("Password", type="password")
        
        submitted = st.form_submit_button("Login")
        
        if submitted:
            if not email or not password:
                st.error("Please enter both email and password")
                return
            
            # Check built-in admin first
            if is_builtin_admin(email, password):
                st.session_state.authenticated = True
                st.session_state.user_email = email
                st.session_state.user_role = 'admin'
                st.success("Built-in Admin login successful!")
                st.rerun()
                return
            
            # Check regular users
            users = load_users()
            if email not in users:
                st.error("Invalid email or password")
                return
            
            hashed_password = hash_password(password)
            if users[email]['password'] != hashed_password:
                st.error("Invalid email or password")
                return
            
            # Login successful
            st.session_state.authenticated = True
            st.session_state.user_email = email
            st.session_state.user_role = users[email].get('role', 'student')
            st.success("Login successful!")
            st.rerun()

def logout():
    """Logout function"""
    st.session_state.authenticated = False
    st.session_state.user_email = None
    st.session_state.user_role = 'student'
    st.rerun()

def message_input_page():
    """Message input page for students with automatic error analysis"""
    st.header("📝 Add New Message")
    
    # Load conversations for current user only
    data = load_user_conversations(st.session_state.user_email)
    
    st.info(f"Messages will be saved for student: {data['student_id']}")
    
    with st.form("message_form"):
        lesson_id = st.text_input("Lesson ID", placeholder="e.g., lecon_1, lecon_2")
        message_text = st.text_area(
            "Enter your French text:", 
            placeholder="Écrivez votre texte en français ici...",
            height=150
        )
        
        # Option to run analysis automatically
        auto_analysis = st.checkbox("🔍 Run automatic error analysis after saving", value=True)
        
        submitted = st.form_submit_button("Save Message")
        
        if submitted:
            if not message_text.strip() or not lesson_id.strip():
                st.error("Please enter both lesson ID and message")
            else:
                # Create new message object with metadata
                new_message = {
                    "message_id": lesson_id.strip(),
                    "date": datetime.now().isoformat() + "Z",
                    "type": "production_écrite",
                    "message": message_text.strip()
                }
                
                # Add to conversations
                data["conversations"].append(new_message)
                
                # Save to user's specific file
                save_user_conversations(st.session_state.user_email, data)
                
                st.success(f"Message saved with ID: {lesson_id}")
                
                # Run automatic analysis if enabled
                if auto_analysis:
                    with st.spinner("🔍 Running automatic error analysis..."):
                        try:
                            analysis_result = run_error_analysis(st.session_state.user_email, data)
                            if analysis_result:
                                st.success("✅ Error analysis completed!")
                                
                                # Show preview of analysis
                                with st.expander("📋 Analysis Preview"):
                                    st.text_area("Analysis Report", analysis_result[:500] + "...", height=200)
                                    st.info("View full analysis in 'My Progress' section")
                            else:
                                st.warning("⚠️ Analysis completed but no results generated")
                        except Exception as e:
                            st.error(f"❌ Error during analysis: {str(e)}")
                
                st.rerun()
    
    # Display existing messages
    st.subheader("📚 Your Previous Messages")
    
    if data["conversations"]:
        for i, conversation in enumerate(reversed(data["conversations"])):
            with st.expander(f"Message {len(data['conversations']) - i}: {conversation['message_id']}"):
                st.write(f"**Date:** {conversation['date']}")
                st.write(f"**Message ID:** {conversation['message_id']}")
                st.write(f"**Type:** {conversation.get('type', 'N/A')}")
                st.write(f"**Content:** {conversation['message']}")
    else:
        st.info("No messages yet. Add your first message above!")

def run_error_analysis(student_email, student_data):
    """Run error analysis for a student and save results"""
    try:
        # Initialize analyzer
        analyzer = Analyser(student_email)
        
        # Create temporary file for analysis
        temp_file = STUDENT_DATA_DIR / f"temp_{student_email.replace('@', '_at_').replace('.', '_')}.json"
        
        # Save student data to temp file
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(student_data, f, indent=4, ensure_ascii=False)
        
        # Load and analyze
        analyzer.load_filter_file(str(temp_file))
        analysis_result = analyzer.error_analyse(analyzer.filedata)
        
        # Save analysis result
        analysis_file = STUDENT_DATA_DIR / f"{student_email.replace('@', '_at_').replace('.', '_')}_analyse.json"
        
        # Load existing analysis data or create new
        if analysis_file.exists():
            with open(analysis_file, 'r', encoding='utf-8') as f:
                analysis_data = json.load(f)
        else:
            analysis_data = {
                "student_id": student_email,
                "rapports_production_ecrite": []
            }
        
        # Add new analysis report
        new_report = {
            "date": datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'),
            "rapport": analysis_result
        }
        
        analysis_data["rapports_production_ecrite"].append(new_report)
        
        # Save updated analysis data
        with open(analysis_file, 'w', encoding='utf-8') as f:
            json.dump(analysis_data, f, indent=4, ensure_ascii=False)
        
        # Clean up temp file
        temp_file.unlink()
        
        return analysis_result
        
    except Exception as e:
        st.error(f"Error during analysis: {str(e)}")
        return None

def load_student_analysis(student_email):
    """Load analysis reports for a student"""
    analysis_file = STUDENT_DATA_DIR / f"{student_email.replace('@', '_at_').replace('.', '_')}_analyse.json"
    
    if analysis_file.exists():
        try:
            with open(analysis_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return {"student_id": student_email, "rapports_production_ecrite": []}
    
    return {"student_id": student_email, "rapports_production_ecrite": []}

def analytics_dashboard():
    """Analytics dashboard for teachers/admins"""
    st.header("📊 Analytics Dashboard")
    
    # Show admin status
    if st.session_state.user_email == ADMIN_CREDENTIALS["email"]:
        st.success("👑 Built-in Admin Access - Full System Control")
    
    # Student selection
    available_students = get_available_students()
    
    if not available_students:
        st.warning("No student data available")
        return
    
    selected_student = st.selectbox("Select Student", available_students)
    
    if selected_student:
        # Load student data
        try:
            student_data = load_user_conversations(selected_student)
            
            # Display student info
            col1, col2 = st.columns(2)
            
            with col1:
                st.metric("Student ID", student_data["student_id"])
                st.metric("Total Messages", len(student_data["conversations"]))
            
            with col2:
                if student_data["conversations"]:
                    latest_date = max(conv["date"] for conv in student_data["conversations"])
                    st.metric("Latest Activity", latest_date[:10])
            
            # Analytics section
            st.subheader("🔍 Error Analysis")
            
            if st.button("Run Error Analysis", type="primary"):
                with st.spinner("Analyzing student texts..."):
                    try:
                        # Initialize analyzer
                        analyzer = Analyser(selected_student)
                        
                        # Create temporary file for analysis
                        temp_file = STUDENT_DATA_DIR / f"temp_{selected_student.replace('@', '_at_').replace('.', '_')}.json"
                        
                        # Save student data to temp file
                        with open(temp_file, 'w', encoding='utf-8') as f:
                            json.dump(student_data, f, indent=4, ensure_ascii=False)
                        
                        # Load and analyze
                        analyzer.load_filter_file(str(temp_file))
                        analysis_result = analyzer.error_analyse(analyzer.filedata)
                        
                        # Save analysis result
                        analysis_file = STUDENT_DATA_DIR / f"{selected_student.replace('@', '_at_').replace('.', '_')}_analyse.json"
                        analysis_data = {
                            "student_id": selected_student,
                            "analysis_date": datetime.now().isoformat(),
                            "analysis_result": analysis_result
                        }
                        
                        with open(analysis_file, 'w', encoding='utf-8') as f:
                            json.dump(analysis_data, f, indent=4, ensure_ascii=False)
                        
                        # Clean up temp file
                        temp_file.unlink()
                        
                        st.success("Analysis completed!")
                        
                        # Display results
                        st.subheader("📋 Analysis Results")
                        st.text_area("Analysis Report", analysis_result, height=400)
                        
                    except Exception as e:
                        st.error(f"Error during analysis: {str(e)}")
            
            # Display conversations
            st.subheader("💬 Student Conversations")
            
            for i, conversation in enumerate(student_data["conversations"]):
                with st.expander(f"{conversation['message_id']} - {conversation['date'][:10]}"):
                    st.write(f"**Type:** {conversation.get('type', 'N/A')}")
                    st.write(f"**Content:**")
                    st.write(conversation['message'])
                    
        except PermissionError:
            st.error("Access denied to this student's data")
        except Exception as e:
            st.error(f"Error loading student data: {str(e)}")

def my_progress_page():
    """Consolidated My Progress page with message input and progress tracking"""
    st.header("📈 My Learning Progress")
    
    # Load student data and analysis
    student_data = load_user_conversations(st.session_state.user_email)
    analysis_data = load_student_analysis(st.session_state.user_email)
    
    # Progress Overview
    st.subheader("📊 Overview")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Total Messages", len(student_data["conversations"]))
    
    with col2:
        st.metric("Analysis Reports", len(analysis_data["rapports_production_ecrite"]))
    
    with col3:
        if student_data["conversations"]:
            latest_date = max(conv["date"] for conv in student_data["conversations"])
            st.metric("Latest Activity", latest_date[:10])
        else:
            st.metric("Latest Activity", "No activity")
    
    st.divider()
    
    # ===== MESSAGE INPUT SECTION =====
    st.subheader("📝 Add New French Text")
    st.info(f"Messages will be saved for student: {student_data['student_id']}")
    
    with st.form("message_form"):
        lesson_id = st.text_input("Lesson ID", placeholder="e.g., lecon_1, lecon_2")
        
        message_text = st.text_area(
            "Enter your French text:", 
            placeholder="Écrivez votre texte en français ici...",
            height=150
        )
        
        submitted = st.form_submit_button("💾 Save Message", type="primary")
        
        if submitted:
            if not message_text.strip() or not lesson_id.strip():
                st.error("Please enter both lesson ID and message")
            else:
                # Create new message object with metadata
                new_message = {
                    "message_id": lesson_id.strip(),
                    "date": datetime.now().isoformat() + "Z",
                    "type": "production_écrite",
                    "message": message_text.strip()
                }
                
                # Add to conversations
                student_data["conversations"].append(new_message)
                
                # Save to user's specific file
                save_user_conversations(st.session_state.user_email, student_data)
                
                st.success(f"✅ Message saved with ID: {lesson_id}")
                st.info("💡 Use the 'AI Progress Analysis' button below to analyze your texts!")
                
                st.rerun()
    
    # ===== AI PROGRESS ANALYSIS SECTION =====
    st.divider()
    st.subheader("🤖 AI Progress Analysis")
    
    if student_data["conversations"]:
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.write("**Ready to analyze your French texts?**")
            st.write(f"📝 You have {len(student_data['conversations'])} message(s) ready for analysis")
            if analysis_data["rapports_production_ecrite"]:
                last_analysis = analysis_data["rapports_production_ecrite"][-1]["date"][:19]
                st.write(f"🕒 Last analysis: {last_analysis}")
        
        with col2:
            if st.button("🚀 Launch AI Progress Analysis", type="primary", use_container_width=True):
                with st.spinner("🔍 AI is analyzing your French texts..."):
                    try:
                        analysis_result = run_error_analysis(st.session_state.user_email, student_data)
                        if analysis_result:
                            st.success("✅ AI Analysis completed successfully!")
                            
                            # Show preview of analysis
                            with st.expander("📋 Analysis Preview - Click to expand"):
                                preview_text = analysis_result[:800] + "..." if len(analysis_result) > 800 else analysis_result
                                st.text_area("Latest Analysis Report", preview_text, height=300)
                                st.info("📍 View full analysis in the 'Analysis Reports' section below")
                            
                            # Auto-scroll to reports section
                            st.balloons()
                            st.rerun()
                        else:
                            st.warning("⚠️ Analysis completed but no results generated")
                    except Exception as e:
                        st.error(f"❌ Error during analysis: {str(e)}")
                        st.error("Please check your OpenAI API configuration")
    else:
        st.info("📝 Add some French texts above to enable AI analysis!")
    
    st.divider()
    
    # ===== ANALYSIS REPORTS SECTION =====
    st.subheader("📋 Analysis Reports")
    
    if analysis_data["rapports_production_ecrite"]:
        st.success(f"🎉 You have {len(analysis_data['rapports_production_ecrite'])} analysis report(s)!")
        
        # Show reports in reverse chronological order (newest first)
        for i, report in enumerate(reversed(analysis_data["rapports_production_ecrite"])):
            report_number = len(analysis_data["rapports_production_ecrite"]) - i
            report_date = report["date"][:19]  # Remove microseconds for display
            
            with st.expander(f"📊 Analysis Report #{report_number} - {report_date}", expanded=(i == 0)):  # Expand latest report
                
                # Key Insights - MAIN CONTENT (showing whole report)
                st.subheader("🎯 Key Insights")
                
                # Show the complete analysis report
                rapport_text = report["rapport"]
                st.text_area("Complete Analysis Report", rapport_text, height=500, key=f"analysis_{i}")
        
        # Progress Chart (if multiple reports)
        if len(analysis_data["rapports_production_ecrite"]) > 1:
            st.subheader("📈 Progress Trends")
            
            # Simple progress indicators
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric("Total Analyses", len(analysis_data["rapports_production_ecrite"]))
            
            with col2:
                # Calculate time span
                first_date = analysis_data["rapports_production_ecrite"][0]["date"][:10]
                last_date = analysis_data["rapports_production_ecrite"][-1]["date"][:10]
                st.metric("Learning Period", f"{first_date} to {last_date}")
            
            with col3:
                st.metric("Improvement Trend", "📈 Positive")  # This could be calculated from analysis content
            
            st.info("📊 Detailed progress visualization coming soon!")
            
    else:
        st.info("📝 No analysis reports yet.")
        
        # Helpful message
        if student_data["conversations"]:
            st.write("👆 Click the **'Launch AI Progress Analysis'** button above to get your first analysis!")
        else:
            st.write("✍️ Start by adding your first French text above!")
    
    st.divider()
    
    # ===== MESSAGES TIMELINE SECTION =====
    st.subheader("📝 Your French Texts Timeline")
    
    if student_data["conversations"]:
        # Show messages in reverse chronological order (newest first)
        for i, conversation in enumerate(reversed(student_data["conversations"])):
            message_number = len(student_data["conversations"]) - i
            
            with st.expander(f"📄 Message #{message_number}: {conversation['message_id']} - {conversation['date'][:10]}"):
                col1, col2 = st.columns([3, 1])
                
                with col1:
                    st.write(f"**📅 Date:** {conversation['date'][:19].replace('T', ' ')}")
                    st.write(f"**🏷️ Type:** {conversation.get('type', 'N/A')}")
                    st.write(f"**📝 Content:**")
                    st.write(conversation['message'])
                
                with col2:
                    st.write(f"**📊 Stats:**")
                    word_count = len(conversation['message'].split())
                    char_count = len(conversation['message'])
                    st.write(f"Words: {word_count}")
                    st.write(f"Characters: {char_count}")
                    
                    # Message quality indicator
                    if word_count > 100:
                        st.success("📈 Detailed text")
                    elif word_count > 50:
                        st.info("📝 Good length")
                    else:
                        st.warning("📏 Short text")
    else:
        st.info("📝 No messages yet. Start by adding your first French text above!")
        
        # Helpful tips for beginners
        with st.expander("💡 Tips for Getting Started"):
            st.write("""
            **Welcome to your French learning journey! Here are some tips:**
            
            📝 **What to write:**
            - Personal experiences (vacations, daily life)
            - Opinions on topics you care about
            - Descriptions of places or people
            - Short stories or diary entries
            
            🎯 **How to improve:**
            - Write regularly (even short texts)
            - Use the AI analysis to identify patterns
            - Focus on recurring errors
            - Try different text types (formal/informal)
            
            🔍 **Using the AI analysis:**
            - Click 'Launch AI Progress Analysis' after adding texts
            - Read the error patterns carefully
            - Practice the recommended exercises
            - Track your progress over time
            """)

def main_app():
    """Main application content"""
    # Main header
    st.title("🔬 French Learning Analytics Lab")
    st.markdown("Advanced analytics platform for French language learning assessment.")
    
    if st.session_state.authenticated:
        # User info and navigation at the top
        col1, col2, col3 = st.columns([2, 2, 1])
        
        with col1:
            if st.session_state.user_email == ADMIN_CREDENTIALS["email"]:
                st.success(f"👑 Built-in Admin: {st.session_state.user_email}")
            else:
                st.success(f"Welcome, {st.session_state.user_email}")
        
        with col2:
            st.info(f"Role: {st.session_state.user_role.title()}")
        
        with col3:
            if st.button("🚪 Logout", use_container_width=True):
                logout()
        
        st.divider()
        
        # Top navigation
        if st.session_state.user_role == 'student':
            page = st.selectbox(
                "📍 Navigate to:",
                ["Home", "My Progress"],
                key="main_navigation"
            )
        else:  # teacher or admin
            page = st.selectbox(
                "📍 Navigate to:",
                ["Home", "Analytics Dashboard", "System Management"],
                key="main_navigation"
            )
        
        st.divider()
        
        # Handle authenticated user pages
        if page == "Home":
            st.header("🏠 Home")
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.subheader("About")
                st.write("Advanced analytics platform for French language learning assessment using AI-powered error analysis.")
                
                if st.session_state.user_role == 'student':
                    st.write("As a student, you can:")
                    st.write("- Add your French writing exercises")
                    st.write("- View your progress over time")
                    st.write("- Get personalized feedback")
                else:
                    st.write("As an educator, you can:")
                    st.write("- Analyze student writing patterns")
                    st.write("- Generate detailed error reports")
                    st.write("- Track student progress")
            
            with col2:
                st.subheader("System Info")
                st.write(f"📅 Updated: {datetime.now().strftime('%B %d, %Y')}")
                st.write(f"👤 Your Role: {st.session_state.user_role.title()}")
                
                # Show admin status
                if st.session_state.user_email == ADMIN_CREDENTIALS["email"]:
                    st.success("👑 Built-in Admin Account")
                
                # Show available students count for teachers/admins
                if st.session_state.user_role in ['teacher', 'admin']:
                    student_count = len(get_available_students())
                    st.write(f"👥 Available Students: {student_count}")
        
        elif page == "My Progress":
            my_progress_page()
        
        elif page == "Analytics Dashboard":
            analytics_dashboard()
        
        elif page == "System Management":
            st.header("⚙️ System Management")
            if st.session_state.user_email == ADMIN_CREDENTIALS["email"]:
                st.success("👑 Built-in Admin System Management")
                
                # Show system stats
                users = load_users()
                col1, col2 = st.columns(2)
                
                with col1:
                    st.metric("Total Users", len(users))
                
                with col2:
                    st.metric("Total Students", len(get_available_students()))
                
                # Show all users
                st.subheader("👥 All Users")
                for email, data in users.items():
                    st.write(f"**{email}** - Role: {data.get('role', 'unknown')} - Created: {data.get('created_at', 'unknown')[:10]}")
            else:
                st.info("System management features coming soon!")
    
    else:
        # Handle non-authenticated users - top navigation
        st.divider()
        
        col1, col2 = st.columns([3, 1])
        
        with col1:
            st.info("Please login or create an account to access the full platform.")
        
        with col2:
            auth_option = st.selectbox(
                "Account Options:",
                ["Login", "Sign Up"],
                key="auth_navigation"
            )
        
        st.divider()
        
        if auth_option == "Login":
            login_page()
        elif auth_option == "Sign Up":
            signup_page()

# Simple footer
st.markdown("---")
st.markdown("*French Learning Analytics Lab - AI-Powered Language Assessment*")

# Run the main app
if __name__ == "__main__":
    main_app()
