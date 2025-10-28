# 🧪 Guide de Tests Manuels - Frontend-Backend

## Prérequis
- ✅ Backend running sur `http://localhost:8000`
- ✅ Frontend running sur `http://localhost:5173`

---

## Test 1: Vérification des Endpoints API

### Backend Health Check
```bash
curl http://localhost:8000/api/health
```
**Résultat attendu:** `{"status":"healthy","service":"Matej Language Lab API"}`

### Documentation API (Swagger)
Ouvrir dans le navigateur: `http://localhost:8000/docs`

**Vérifications:**
- ✅ Page Swagger UI s'affiche
- ✅ Groupes visibles: authentication, student, teacher, analysis
- ✅ Tous les endpoints listés

---

## Test 2: Inscription (Signup)

### Étapes:
1. Ouvrir `http://localhost:5173/signup`
2. Remplir le formulaire:
   - **Nom:** Test Étudiant
   - **Email:** student.test@example.com
   - **Mot de passe:** Test1234!
   - **Confirmer:** Test1234!
   - **Rôle:** Étudiant
   - **Enseignant:** (laisser vide ou choisir si disponible)
3. Cliquer sur "S'inscrire"

**Résultat attendu:**
- ✅ Message de succès s'affiche
- ✅ Redirection automatique vers `/login` après 2 secondes
- ❌ Si erreur: vérifier console navigateur (F12)

### Vérification Backend:
```bash
# Vérifier que l'utilisateur a été créé
cat secure_data/users_database.json
```

---

## Test 3: Connexion (Login)

### Étapes:
1. Ouvrir `http://localhost:5173/login`
2. Utiliser les identifiants:
   - **Email:** student.test@example.com
   - **Mot de passe:** Test1234!
3. Cliquer sur "Se connecter"

**Résultat attendu:**
- ✅ Connexion réussie
- ✅ Redirection vers `/` (page d'accueil)
- ✅ Navigation visible avec email et rôle
- ✅ Menu adapté au rôle (étudiant)

### Vérification Console (F12):
```javascript
// Aucune erreur CORS
// Aucune erreur 401/403/500
```

---

## Test 4: Liste des Enseignants

### Test via Swagger:
1. Ouvrir `http://localhost:8000/docs`
2. Trouver `GET /api/auth/teachers`
3. Cliquer sur "Try it out"
4. Cliquer sur "Execute"

**Résultat attendu:**
```json
{
  "success": true,
  "teachers": []  // ou liste des enseignants si créés
}
```

---

## Test 5: Créer un Enseignant

### Via Swagger (POST /api/auth/signup):
```json
{
  "email": "teacher.test@example.com",
  "password": "Teacher1234!",
  "name": "Prof. Dubois",
  "role": "teacher",
  "teacher_email": null
}
```

**Résultat attendu:**
```json
{
  "success": true,
  "message": "Compte créé avec succès",
  "user": {
    "email": "teacher.test@example.com",
    "name": "Prof. Dubois",
    "role": "teacher",
    "teacher_email": null
  }
}
```

---

## Test 6: Assigner un Enseignant à un Étudiant

### Via Swagger (POST /api/student/assign-teacher):
```json
{
  "student_email": "student.test@example.com",
  "teacher_email": "teacher.test@example.com"
}
```

**Résultat attendu:**
```json
{
  "success": true,
  "message": "Enseignant assigné avec succès",
  "teacher_email": "teacher.test@example.com"
}
```

### Vérification:
```bash
cat backend/teacher_student_relations.json
```

---

## Test 7: Connexion Enseignant

### Étapes:
1. Se déconnecter si connecté
2. Se connecter avec:
   - **Email:** teacher.test@example.com
   - **Mot de passe:** Teacher1234!
3. Vérifier que le dashboard enseignant s'affiche

**Résultat attendu:**
- ✅ Connexion réussie
- ✅ Redirection vers `/dashboard`
- ✅ Liste des étudiants affichée (1 étudiant: student.test@example.com)
- ✅ Statistiques du dashboard

---

## Test 8: Test d'Analyse (via Swagger)

### POST /api/analysis/submit:
```json
{
  "student_email": "student.test@example.com",
  "text_content": "Je suis allé au marché hier. J'ai acheté des pommes et des oranges. C'était très bon.",
  "text_type": "written"
}
```

**⚠️ IMPORTANT:** Ce test nécessite une clé OpenAI API valide configurée.

**Résultat attendu (si API configurée):**
```json
{
  "success": true,
  "message": "Analyse effectuée avec succès",
  "analysis_id": "uuid-here",
  "analysis": "## Niveau CECRL estimé...",
  "texts_count": 1
}
```

**Si erreur OpenAI:**
- Vérifier que la variable `OPENAI_API_KEY` est définie
- Créer un fichier `.env` à la racine avec: `OPENAI_API_KEY=your_key_here`

---

## Test 9: Récupérer les Analyses d'un Étudiant

### GET /api/analysis/student/{student_email}:
```
GET http://localhost:8000/api/analysis/student/student.test@example.com
```

**Résultat attendu:**
```json
{
  "success": true,
  "student_email": "student.test@example.com",
  "analyses": [
    {
      "id": "uuid",
      "student_email": "student.test@example.com",
      "text_content": "...",
      "analysis_result": "...",
      "created_at": "2025-10-28T..."
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

---

## Test 10: Dashboard Enseignant

### Via API (GET /api/teacher/{teacher_email}/dashboard):
```
GET http://localhost:8000/api/teacher/teacher.test@example.com/dashboard
```

**Résultat attendu:**
```json
{
  "success": true,
  "stats": {
    "total_students": 1,
    "total_texts": 1,
    "average_texts_per_student": 1.0,
    "active_students": 1
  }
}
```

---

## ✅ Checklist de Tests

### Authentification
- [ ] Inscription étudiant fonctionne
- [ ] Inscription enseignant fonctionne
- [ ] Connexion étudiant fonctionne
- [ ] Connexion enseignant fonctionne
- [ ] Liste des enseignants fonctionne
- [ ] Déconnexion fonctionne

### Relations Enseignant-Étudiant
- [ ] Assignation d'enseignant fonctionne
- [ ] Récupération de l'enseignant d'un étudiant fonctionne
- [ ] Liste des étudiants d'un enseignant fonctionne

### Analyses
- [ ] Soumission de texte fonctionne (si API OpenAI configurée)
- [ ] Récupération des analyses fonctionne
- [ ] Dashboard enseignant affiche les statistiques

### Frontend
- [ ] Navigation entre pages fonctionne
- [ ] Formulaires valident correctement
- [ ] Messages d'erreur s'affichent
- [ ] Design responsive fonctionne

---

## 🐛 Débogage

### Erreurs CORS
Si vous voyez des erreurs CORS dans la console:
```
Access to fetch at 'http://localhost:8000' has been blocked by CORS policy
```

**Solution:** Vérifier `backend/main.py`:
```python
allow_origins=[
    "http://localhost:5173",
    "http://localhost:3000",
]
```

### Erreur 404
Si endpoints retournent 404:
- Vérifier que le backend est bien démarré
- Vérifier l'URL dans `authService.js` et `analysisService.js`
- Vérifier que les routes sont bien enregistrées dans `backend/main.py`

### Erreur OpenAI
```
Error during analysis: OpenAI API key is required
```

**Solution:** Créer un fichier `.env`:
```bash
OPENAI_API_KEY=sk-your-key-here
PROVIDER=OPENAI
```

---

## 📊 Résultats Attendus

### Services Opérationnels
- ✅ Backend API: http://localhost:8000
- ✅ Backend Docs: http://localhost:8000/docs
- ✅ Frontend: http://localhost:5173

### Données Créées
- ✅ `secure_data/users_database.json` - Utilisateurs
- ✅ `backend/teacher_student_relations.json` - Relations
- ✅ `secure_data/student_DB/student_test_at_example_com.json` - Analyses

---

**Date du test:** 28 octobre 2025  
**Version:** Phase 1 - Backend API Integration

