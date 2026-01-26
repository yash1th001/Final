# Local Setup Guide - Resume Analyzer App

This guide will help you set up and run the Resume Analyzer application on your local machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.11 or higher) - [Download](https://www.python.org/)
- **MongoDB** (v5.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Yarn** package manager - Install with: `npm install -g yarn`
- **Git** - [Download](https://git-scm.com/)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd resume-analyzer
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or using a virtual environment (recommended):

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Install emergentintegrations (for AI features)

```bash
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
```

#### Configure Backend Environment

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env  # If you have an example file
# Or create manually:
```

Add the following to `backend/.env`:

```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=resume_analyzer_db

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# AI Integration (Emergent LLM Key - for AI features)
EMERGENT_LLM_KEY=sk-emergent-0984aD5617aB265E3A
```

**Note:** The `EMERGENT_LLM_KEY` provided above is a universal key that works with OpenAI, Anthropic, and Gemini. If you want to use your own Gemini API key, you can add it through the app's UI.

### 3. Frontend Setup

#### Install Dependencies

```bash
cd frontend
yarn install
```

#### Configure Frontend Environment

Create a `.env` file in the `frontend` directory:

```bash
cd frontend
cp .env.example .env  # If you have an example file
# Or create manually:
```

Add the following to `frontend/.env`:

```env
# Supabase Configuration (for authentication)
VITE_SUPABASE_PROJECT_ID=hcxcoxipjhzfupchssyf
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjeGNveGlwamh6ZnVwY2hzc3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTg1ODQsImV4cCI6MjA4MjY3NDU4NH0.APrd8JVPuoeSm99RB1AdILRpFwMNDAZcaYySPKTQSIc
VITE_SUPABASE_URL=https://hcxcoxipjhzfupchssyf.supabase.co

# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8001

# Development Configuration
WDS_SOCKET_PORT=0
ENABLE_HEALTH_CHECK=false
```

### 4. Start MongoDB

Ensure MongoDB is running on your local machine:

```bash
# For macOS (using Homebrew):
brew services start mongodb-community

# For Ubuntu/Linux:
sudo systemctl start mongod

# For Windows:
# Start MongoDB from the Services app or run mongod.exe
```

Verify MongoDB is running:

```bash
mongosh  # Should connect to mongodb://localhost:27017
```

### 5. Run the Application

You'll need **three terminal windows**:

#### Terminal 1: Start Backend

```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

#### Terminal 2: Start Frontend

```bash
cd frontend
yarn dev
```

You should see:
```
VITE v5.4.21  ready in XXX ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
```

#### Terminal 3: Monitor Logs (Optional)

```bash
# Watch backend logs
tail -f backend/logs/app.log

# Or check MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log
```

### 6. Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

🎉 You should now see the Resume Analyzer app running!

## 🔧 Configuration Options

### Using Your Own Gemini API Key (Optional)

The app works out-of-the-box with the Emergent universal key. However, if you want to use your own Gemini API key:

1. Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. In the app, navigate to Settings → Profile
3. Click "Add API Key" in the AI Review section
4. Paste your Gemini API key
5. The app will now use your key for AI analysis

### Environment Variables Explained

#### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `DB_NAME` | Database name | `resume_analyzer_db` |
| `CORS_ORIGINS` | Allowed CORS origins | `*` |
| `EMERGENT_LLM_KEY` | Universal AI key | Provided |

#### Frontend (`frontend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | Yes |
| `REACT_APP_BACKEND_URL` | Backend API URL | Yes |

## 🧪 Testing the Setup

### Test Backend API

```bash
# Test health check
curl http://localhost:8001/api/

# Expected response:
# {"message":"Hello World"}
```

### Test AI Analysis (Backend)

```bash
curl -X POST http://localhost:8001/api/analyze-resume \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "John Doe\nEmail: john@example.com\nPhone: 555-1234\n\nExperience:\nSoftware Engineer at Tech Corp (2020-2023)\n- Developed web applications using React\n- Led team of 3 developers\n\nEducation:\nBS Computer Science (2020)\n\nSkills: JavaScript, Python, React",
    "jobDescription": null,
    "useEmergentKey": true
  }'
```

Expected: A JSON response with analysis scores and suggestions.

### Test Frontend

1. Open http://localhost:3000 in your browser
2. Sign up or log in with email
3. Navigate to "Resume Analyzer"
4. Try both "Normal Review" and "AI Review" modes

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Error:** `MongoServerError: connect ECONNREFUSED 127.0.0.1:27017`

**Solution:**
```bash
# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
# Or start mongod.exe manually on Windows
```

### Backend Not Starting

**Error:** `ModuleNotFoundError: No module named 'emergentintegrations'`

**Solution:**
```bash
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
```

### Frontend Build Errors

**Error:** `Cannot find module '@/components/...'`

**Solution:**
```bash
cd frontend
rm -rf node_modules
yarn install
```

### CORS Errors

**Error:** `Access to fetch at 'http://localhost:8001/api/...' has been blocked by CORS`

**Solution:**
1. Check `backend/.env` has correct CORS_ORIGINS
2. Ensure backend is running on port 8001
3. Restart backend server

### AI Analysis Not Working

**Issue:** AI Review returns errors

**Solutions:**

1. **Check Emergent LLM Key:** Verify `EMERGENT_LLM_KEY` is set in `backend/.env`

2. **Check Backend Logs:**
   ```bash
   tail -f /var/log/supervisor/backend.*.log
   ```

3. **Try with your own Gemini key:** Get a free key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Port Already in Use

**Error:** `Port 3000 is already in use` or `Port 8001 is already in use`

**Solution:**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:8001 | xargs kill -9  # Backend

# Or change ports in configuration
```

## 📁 Project Structure

```
resume-analyzer/
├── backend/
│   ├── server.py           # Main FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Backend environment variables
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── lib/          # Utility functions
│   │   └── pages/        # Page components
│   ├── package.json      # Node dependencies
│   └── .env             # Frontend environment variables
├── tests/               # Test files
├── SETUP.md            # This file
└── README.md           # Project documentation
```

## 🔒 Security Notes

1. **Never commit `.env` files** to version control
2. **Rotate API keys** if exposed publicly
3. **Use environment variables** for sensitive data
4. **Enable authentication** for production deployments

## 🚢 Production Deployment

For production deployment:

1. Set `CORS_ORIGINS` to your production domain
2. Use environment variables for all sensitive data
3. Enable HTTPS
4. Use a production-ready MongoDB instance (MongoDB Atlas recommended)
5. Set up proper authentication and authorization
6. Configure rate limiting for API endpoints

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Emergent Integrations Guide](https://emergentagent.com/docs)

## 💬 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review backend logs: `tail -f /var/log/supervisor/backend.*.log`
3. Review frontend console in browser DevTools
4. Open an issue on GitHub with error details

---

**Happy Coding! 🎉**

Built with ❤️ using FastAPI, React, and AI
