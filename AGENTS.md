## Workflow & Process

### Development Process
1. **Plan First**: Write task spec with goals, approach, and acceptance criteria
2. **Get Approval**: Wait for approval before coding (for features and major changes)
3. **Create Branch**: `git checkout -b feat/feature-name`
4. **Test Locally**: Test each change before committing
5. **Atomic Commits**: One logical change per commit with clear message format
   - `feat:` for features, `fix:` for bugs, `refactor:`, `docs:`, etc.
6. **Final Check**: All tests pass, no secrets committed, docs updated
7. **Push & PR**: Push to branch, create pull request, wait for review

### Commit Rules
- **ALWAYS ask for human permission before committing changes**
- Test before every commit
- One logical change per commit
- Use conventional commit format
- No debug code or print statements
- No commented-out code

### Documentation Rules
- **After EVERY feature, bug fix, document, code or test refactor:**
  1. Update README.md with the changes
  2. Add commit hash and description to relevant section
  3. Update phase status (✅ COMPLETE, 🚧 IN PROGRESS, 🔜 PLANNED)
  4. Update API endpoints list if routes changed
  5. Create a separate `docs:` commit for documentation updates
- **README structure to maintain:**
  - Current Status section (top)
  - Feature Implementation Phases with commits
  - API Endpoints documentation
  - Development Phases progress
- Keep README accurate and up-to-date as single source of truth
- **NEVER create additional documentation files** (GETTING_STARTED.md, CONTRIBUTING.md, etc.) unless explicitly requested by the user
- All project documentation must be in README.md only
- **NEVER include sensitive information in documentation:**
  - ❌ No passwords (admin passwords, API keys, database credentials)
  - ❌ No API keys (OpenAI, Pinecone, etc.)
  - ❌ No email addresses with actual passwords
  - ❌ No database connection strings with credentials
  - ❌ No private tokens or secrets
  - ✅ Use placeholder examples: "your_api_key_here", "ADMIN_EMAIL (see .env)"
  - ✅ Reference environment variables: "Configure in .env file"


## General Principles
- Clear, maintainable code with meaningful names
- Handle all errors gracefully with proper messages
- Keep functions small and focused
- Never hardcode secrets or API keys

## Backend (Python/FastAPI)

### Code Style
- Follow PEP 8 (88 char line length)
- Use type hints and f-strings
- Use async/await for I/O operations
- Use logging module, not print()

### Architecture
- Pydantic models for validation
- Environment variables for config (.env file)
- Separate business logic from routes
- Use try-except blocks for external API calls
- Add timeouts to all external requests

### Security & Testing
- Validate all inputs with Pydantic
- Use CORS with specific origins in production
- Write pytest unit tests (>80% coverage)
- Mock external API calls in tests

### Documentation
- Docstrings for all functions/classes (Google/NumPy format)
- Update README after every feature/fix with commit hashes
- Maintain API endpoint documentation in README
- Keep phase status current (✅🚧🔜)

## Frontend (React/JavaScript)

### Code Style
- ES6+ syntax only (const/let, arrow functions)
- Functional components with hooks (no classes)
- PascalCase for components, camelCase for functions
- Use semicolons consistently

### Architecture
- One component per file, keep them small
- Extract reusable logic into custom hooks
- Centralize API calls in service files
- Always handle loading and error states

### Best Practices
- Use React.memo(), useCallback, useMemo for performance
- Keep state close to where it's used
- Avoid prop drilling (>2 levels use Context)
- Use semantic HTML and ARIA labels
- Add JSDoc for complex functions

## Dependencies
- Keep requirements.txt and package.json updated
- Pin major versions
- Use venv for Python isolation
- Lock dependencies (package-lock.json)

## Git
- **Always request human approval before executing git commit**
- Meaningful commit messages (conventional commits)
- Feature branches for new work
- Never commit .env files or secrets
- Test before committing
