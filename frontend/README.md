# AICruit - AI-Powered Resume Analyzer

AICruit is an intelligent resume analysis tool that helps job seekers optimize their resumes for Applicant Tracking Systems (ATS) and improve their chances of landing interviews.

## Features

- **Dual Analysis Modes**: Choose between Normal Review (local) and AI Review (Gemini-powered)
- **ATS Score Analysis**: Get a detailed score showing how well your resume performs with automated screening systems
- **Job Description Matching**: See how closely your resume aligns with specific job requirements
- **Structure Analysis**: Receive feedback on resume formatting and organization
- **Smart Suggestions**: Get actionable recommendations for improvements, additions, and removals
- **Export Improved Resume**: Download an AI-generated improved version with all suggestions applied
- **PDF Report Generation**: Download a comprehensive analysis report
- **AI Career Coach Chat**: Get personalized answers to your resume questions
- **Secure API Key Storage**: One-time API key setup stored in your profile
- **Dark/Light Theme**: Toggle between themes for comfortable viewing

## User Flow

### 1. Account Creation
1. Click "Sign In" in the header
2. Create an account with email and password
3. Your profile is automatically created (no API key required at this stage)

### 2. Resume Analysis Workflow

#### Normal Review Mode (No API Key Required)
1. Upload your resume (PDF) or paste resume text
2. Optionally add a job description for JD match analysis
3. Select "Normal Review" mode
4. Click "Analyze Resume"
5. View your scores and suggestions

#### AI Review Mode (Requires Gemini API Key)
1. Upload your resume (PDF) or paste resume text
2. Optionally add a job description
3. Select "AI Review" mode
4. Click "AI Analyze"
5. **First-time only**: You'll be prompted to enter your Gemini API key
6. Your key is securely stored in your profile
7. View AI-powered analysis results

### 3. API Key Lifecycle

| Stage | Action |
|-------|--------|
| **Request** | Only requested on first AI analysis attempt |
| **Storage** | Securely stored in your user profile (database) |
| **Reuse** | Automatically used for all future AI analyses |
| **Update** | Can be changed via Profile Settings (user menu → Settings) |
| **Delete** | Can be removed via Profile Settings |

### 4. Managing Your API Key
1. Click your username in the header
2. Select "Settings"
3. In the API Key section:
   - View status (Configured/Not configured)
   - Enter a new key to replace the existing one
   - Remove the key entirely

## Analysis Modes Comparison

| Feature | Normal Review | AI Review |
|---------|---------------|-----------|
| API Key Required | No | Yes (one-time setup) |
| Analysis Method | TF-IDF keyword matching | Google Gemini AI |
| Speed | Instant | 5-15 seconds |
| JD Match Analysis | Basic keyword overlap | Semantic understanding |
| Suggestions Quality | Rule-based | Context-aware AI |

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **jsPDF** - PDF report generation

### Backend
- **Supabase Edge Functions** - Serverless API endpoints
- **Supabase Auth** - User authentication
- **Supabase Database** - PostgreSQL with RLS
- **Deno** - Runtime for edge functions
- **Google Gemini AI** - Resume analysis powered by AI

## Project Structure

```
src/
├── components/
│   ├── ui/                   # Reusable UI components (shadcn/ui)
│   ├── auth/                 # Authentication components
│   ├── profile/              # Profile & settings components
│   ├── AnalyzerSection.tsx   # Main resume analyzer
│   ├── ResultsSection.tsx    # Analysis results display
│   └── ...
├── hooks/
│   ├── use-auth.tsx          # Authentication hook
│   ├── use-profile.tsx       # Profile & API key management
│   └── use-theme.tsx         # Dark/light theme
├── lib/
│   ├── localResumeAnalyzer.ts # TF-IDF based local analysis
│   ├── pdfParser.ts          # PDF text extraction
│   └── pdfGenerator.ts       # PDF report generation
└── pages/
    └── Index.tsx             # Main landing page

supabase/functions/
├── analyze-resume/           # AI resume analysis endpoint
├── resume-chat/              # AI career coach chat
└── generate-improved-resume/ # Export improved resume
```

## Database Schema

### profiles
Stores user preferences and API keys.
- `id` - UUID primary key
- `user_id` - References auth.users
- `gemini_api_key` - Encrypted API key (optional)
- `display_name` - User display name (optional)
- `created_at`, `updated_at` - Timestamps

### resume_analyses
Stores analysis history per user.
- `id` - UUID primary key
- `user_id` - References auth.users
- `resume_text`, `job_description` - Input data
- `ats_score`, `jd_match_score`, `structure_score` - Scores
- `suggestions`, `structure_analysis` - JSON data

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Create an account and start analyzing resumes!

## Getting a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your key and paste it when prompted in AICruit

---

Built with ❤️ using [Lovable](https://lovable.dev)
