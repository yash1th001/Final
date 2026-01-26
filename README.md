# 📝 Resume Analyzer - AI-Powered Resume Analysis

A comprehensive resume analysis tool powered by AI that helps job seekers optimize their resumes for Applicant Tracking Systems (ATS) and job descriptions.

![Resume Analyzer](https://img.shields.io/badge/FastAPI-0.110.1-green) ![React](https://img.shields.io/badge/React-18.3.1-blue) ![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-green) ![AI](https://img.shields.io/badge/AI-Gemini%202.0-orange)

## ✨ Features

### 🎯 Dual Analysis Modes

**Normal Review** (TF-IDF Based)
- Fast, local analysis using keyword matching
- No API key required
- Instant results
- Privacy-focused (no data sent to external servers)

**AI Review** (Gemini 2.0 Powered)
- Advanced AI analysis using Google Gemini
- Personalized feedback and suggestions
- Works out-of-the-box with Emergent universal key
- Optional: Use your own Gemini API key

### 📊 Comprehensive Scoring

- **ATS Score** (0-100) - How well your resume passes Applicant Tracking Systems
- **Structure Score** (0-100) - Resume formatting and organization quality
- **JD Match Score** (0-100) - Compatibility with specific job descriptions (when provided)

### 💡 Intelligent Suggestions

- **Additions** - Keywords and sections to add
- **Removals** - Content that should be removed or replaced
- **Improvements** - Specific ways to enhance existing content
- **Priority Actions** - Ranked list of impactful changes

### 🔍 Detailed Analysis

- Candidate context extraction (name, role, experience, skills)
- Section-by-section feedback
- Formatting recommendations
- Gap analysis (when JD provided)
- Strong matches and critical gaps identification

### 🎨 Beautiful UI

- Modern, responsive design using Tailwind CSS
- Dark/Light mode support
- Smooth animations and transitions
- Mobile-friendly interface

### 📚 Additional Features

- **Analysis History** - Save and revisit past analyses
- **Resume Chat** - Interactive Q&A about your resume
- **Tailored Resume Generator** - Create JD-specific resume versions
- **PDF Export** - Download your optimized resume
- **User Authentication** - Secure login with Supabase

## 🚀 Quick Start

### For Developers

```bash
# See detailed setup instructions
cat SETUP.md

# Or quick start (5 minutes)
cat QUICKSTART.md
```

**TL;DR:**
1. Install: Node.js, Python, MongoDB, Yarn
2. Configure `.env` files
3. Run backend: `uvicorn server:app --reload --port 8001`
4. Run frontend: `yarn dev`
5. Open: http://localhost:3000

### For Users

1. Visit the deployed application
2. Sign up or log in
3. Upload your resume (PDF) or paste text
4. Choose analysis mode:
   - **Normal Review** - Fast, local analysis
   - **AI Review** - AI-powered insights (no setup needed!)
5. Optionally add a job description for JD matching
6. Click "Analyze" and get your results!

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database
- **Motor** - Async MongoDB driver
- **emergentintegrations** - AI model integrations
- **Python 3.11+**

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Supabase** - Authentication
- **shadcn/ui** - UI components

### AI/ML
- **Google Gemini 2.0 Flash** - AI analysis
- **TF-IDF** - Local keyword matching
- **emergentintegrations** - Unified AI API

## 📁 Project Structure

```
resume-analyzer/
├── backend/
│   ├── server.py              # FastAPI application
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Backend configuration
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── AnalyzerSection.tsx
│   │   │   ├── ResultsSection.tsx
│   │   │   ├── ResumeChat.tsx
│   │   │   └── ...
│   │   ├── lib/               # Utilities
│   │   │   ├── localResumeAnalyzer.ts
│   │   │   ├── pdfParser.ts
│   │   │   └── ...
│   │   ├── pages/             # Page components
│   │   └── main.tsx           # Entry point
│   ├── package.json           # Node dependencies
│   └── .env                   # Frontend configuration
├── SETUP.md                   # Detailed setup guide
├── QUICKSTART.md              # Quick start guide
└── README.md                  # This file
```

## 🔑 API Key Configuration

### Using Emergent Universal Key (Default)

The app comes pre-configured with an Emergent universal key that works with:
- ✅ OpenAI (GPT models)
- ✅ Anthropic (Claude models)
- ✅ Google (Gemini models)

**No setup required!** Just start using AI Review.

### Using Your Own Gemini API Key (Optional)

1. Get a free API key: [Google AI Studio](https://makersuite.google.com/app/apikey)
2. In the app: Settings → Profile → Add API Key
3. Paste your key and save
4. The app will now use your key for AI analysis

**Benefits of your own key:**
- Higher rate limits
- More control over usage
- No shared quota

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest tests/
```

### Frontend Tests

```bash
cd frontend
yarn test
```

### Manual Testing

See test cases in `/tests/` directory.

## 📊 API Endpoints

### Backend API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/` | GET | Health check |
| `/api/status` | GET/POST | Status checks |
| `/api/analyze-resume` | POST | AI resume analysis |

### Analyze Resume Request

```json
{
  "resumeText": "string",
  "jobDescription": "string | null",
  "geminiApiKey": "string | null",
  "useEmergentKey": true
}
```

### Analyze Resume Response

```json
{
  "atsScore": 85,
  "jdMatchScore": 78,
  "structureScore": 90,
  "hasJobDescription": true,
  "candidateContext": {...},
  "keyFindings": {...},
  "suggestions": {...},
  "structureAnalysis": {...},
  "priorityActions": [...]
}
```

## 🔒 Security

- ✅ Environment variables for sensitive data
- ✅ CORS configuration
- ✅ Secure authentication with Supabase
- ✅ API key encryption
- ✅ Input validation and sanitization
- ✅ Rate limiting (recommended for production)

## 🚢 Deployment

### Local Development
```bash
# See SETUP.md for detailed instructions
```

### Production Deployment

**Backend:**
- Deploy to: Heroku, AWS, GCP, or Azure
- Use: Production MongoDB (MongoDB Atlas)
- Set: Environment variables
- Enable: HTTPS, rate limiting

**Frontend:**
- Deploy to: Vercel, Netlify, or AWS S3
- Build: `yarn build`
- Set: Environment variables
- Enable: HTTPS

### Environment Variables

**Production Backend:**
```env
MONGO_URL=<production-mongodb-url>
DB_NAME=<production-db-name>
CORS_ORIGINS=<production-frontend-url>
EMERGENT_LLM_KEY=<your-key>
```

**Production Frontend:**
```env
REACT_APP_BACKEND_URL=<production-backend-url>
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-key>
```

## 📈 Performance

- **Normal Review**: < 1 second
- **AI Review**: 5-15 seconds (depends on resume length)
- **PDF Parsing**: 1-3 seconds
- **Database Queries**: < 100ms

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style

- **Backend**: Follow PEP 8
- **Frontend**: Follow ESLint configuration
- **Commits**: Use conventional commits

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
- [React](https://react.dev/) - Frontend library
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Supabase](https://supabase.com/) - Authentication
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI analysis
- [shadcn/ui](https://ui.shadcn.com/) - UI components

## 📞 Support

- **Documentation**: See [SETUP.md](./SETUP.md) and [QUICKSTART.md](./QUICKSTART.md)
- **Issues**: Open an issue on GitHub
- **Email**: support@example.com

## 🗺️ Roadmap

- [ ] Multi-language support
- [ ] Resume templates
- [ ] Cover letter generation
- [ ] Interview preparation tips
- [ ] Skills gap analysis
- [ ] Career path recommendations
- [ ] Integration with LinkedIn
- [ ] Bulk resume analysis
- [ ] Advanced analytics dashboard

## ⭐ Star History

If you find this project helpful, please consider giving it a star!

---

**Built with ❤️ by the Resume Analyzer Team**

Made possible by FastAPI, React, and cutting-edge AI technology.
