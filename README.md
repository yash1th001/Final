# AICruit - AI-Powered Resume Analyzer

AICruit is an intelligent resume analysis tool that helps job seekers optimize their resumes for Applicant Tracking Systems (ATS) and improve their chances of landing interviews.

## Features

- **ATS Score Analysis**: Get a detailed score showing how well your resume performs with automated screening systems
- **Job Description Matching**: See how closely your resume aligns with specific job requirements
- **Structure Analysis**: Receive feedback on resume formatting and organization
- **Smart Suggestions**: Get actionable recommendations for improvements, additions, and removals
- **PDF Report Generation**: Download a comprehensive analysis report
- **Dark/Light Theme**: Toggle between themes for comfortable viewing

## Project Structure

```
├── src/                          # 📁 FRONTEND (React + TypeScript)
│   ├── components/               # React components
│   │   ├── ui/                   # Reusable UI components (shadcn/ui)
│   │   ├── AnalyzerSection.tsx   # Main resume analyzer component
│   │   ├── FileUpload.tsx        # PDF file upload handler
│   │   ├── ResultsSection.tsx    # Analysis results display
│   │   ├── ScoreCard.tsx         # Interactive score cards
│   │   ├── Header.tsx            # App header with navigation
│   │   ├── Footer.tsx            # App footer
│   │   └── ...                   # Other UI components
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-theme.tsx         # Dark/light theme management
│   │   └── use-toast.ts          # Toast notifications
│   ├── lib/                      # Utility functions
│   │   ├── pdfParser.ts          # PDF text extraction
│   │   ├── pdfGenerator.ts       # PDF report generation
│   │   └── utils.ts              # General utilities
│   ├── pages/                    # Page components
│   │   ├── Index.tsx             # Main landing page
│   │   └── NotFound.tsx          # 404 page
│   ├── integrations/             # External service integrations
│   │   └── supabase/             # Supabase client configuration
│   ├── App.tsx                   # Main app component
│   ├── main.tsx                  # App entry point
│   └── index.css                 # Global styles & design tokens
│
├── supabase/                     # 📁 BACKEND (Edge Functions)
│   ├── functions/                # Serverless functions
│   │   └── analyze-resume/       # Resume analysis endpoint
│   │       └── index.ts          # AI-powered analysis logic
│   └── config.toml               # Supabase configuration
│
├── public/                       # Static assets
├── index.html                    # HTML entry point
├── tailwind.config.ts            # Tailwind CSS configuration
├── vite.config.ts                # Vite build configuration
└── package.json                  # Dependencies and scripts
```

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
- **Deno** - Runtime for edge functions
- **Google Gemini AI** - Resume analysis powered by AI

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or bun

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Environment Variables

The following environment variables are automatically configured:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key

Backend secrets (configured in Supabase):
- `LOVABLE_API_KEY` - AI gateway API key

## Usage

1. **Upload Resume**: Click the upload area or drag and drop a PDF resume
2. **Paste Job Description**: Enter the job description you're targeting
3. **Analyze**: Click "Analyze Resume" to get your scores
4. **Review Results**: Click on score cards to see detailed improvement tips
5. **Download Report**: Get a PDF report of your analysis

## API Endpoints

### POST `/functions/v1/analyze-resume`

Analyzes a resume against a job description.

**Request Body:**
```json
{
  "resumeText": "string",
  "jobDescription": "string"
}
```

**Response:**
```json
{
  "atsScore": 85,
  "jdMatchScore": 78,
  "structureScore": 90,
  "suggestions": {
    "additions": ["Add quantifiable achievements..."],
    "removals": ["Remove outdated skills..."],
    "improvements": ["Strengthen action verbs..."]
  },
  "structureAnalysis": {
    "sections": ["Contact", "Experience", "Education"],
    "formatting": ["Use consistent date formats..."]
  }
}
```

## How to Edit This Code

### Use Lovable
Simply visit the Lovable Project and start prompting. Changes made via Lovable will be committed automatically to this repo.

### Use Your Preferred IDE
Clone this repo and push changes. Pushed changes will also be reflected in Lovable.

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Deployment

Open Lovable and click on Share → Publish to deploy your app.

## Custom Domain

To connect a custom domain, navigate to Project → Settings → Domains and click Connect Domain.

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

Built with ❤️ using [Lovable](https://lovable.dev)
