# 🚀 Quick Start Guide

Get the Resume Analyzer running in 5 minutes!

## Prerequisites
- Node.js v18+
- Python 3.11+
- MongoDB running
- Yarn package manager

## Setup Commands

### 1. Install Dependencies

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
yarn install
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=resume_analyzer_db
CORS_ORIGINS=http://localhost:3000
EMERGENT_LLM_KEY=sk-emergent-0984aD5617aB265E3A
```

**Frontend** (`frontend/.env`):
```env
VITE_SUPABASE_URL=https://hcxcoxipjhzfupchssyf.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjeGNveGlwamh6ZnVwY2hzc3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTg1ODQsImV4cCI6MjA4MjY3NDU4NH0.APrd8JVPuoeSm99RB1AdILRpFwMNDAZcaYySPKTQSIc
REACT_APP_BACKEND_URL=http://localhost:8001
```

### 3. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn dev
```

### 4. Access App

Open browser: **http://localhost:3000**

## Quick Test

```bash
# Test backend
curl http://localhost:8001/api/

# Test AI analysis
curl -X POST http://localhost:8001/api/analyze-resume \
  -H "Content-Type: application/json" \
  -d '{"resumeText": "John Doe\nSoftware Engineer\nSkills: Python, React", "useEmergentKey": true}'
```

## Common Issues

**MongoDB not running?**
```bash
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

**Port already in use?**
```bash
lsof -ti:8001 | xargs kill -9  # Kill backend
lsof -ti:3000 | xargs kill -9  # Kill frontend
```

**Missing module?**
```bash
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
```

---

For detailed setup instructions, see [SETUP.md](./SETUP.md)
