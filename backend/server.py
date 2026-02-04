from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
# Trigger reload for CORS update

from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime
import json
from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Add CORS middleware BEFORE including routes
cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
cors_origins = [origin.strip() for origin in cors_origins]  # Remove whitespace from each origin

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# AI Resume Analysis Models
class ResumeAnalysisRequest(BaseModel):
    resumeText: str
    jobDescription: Optional[str] = None
    geminiApiKey: Optional[str] = None  # User can provide their own key
    useEmergentKey: bool = True  # Default to using Emergent LLM key

class ResumeAnalysisResponse(BaseModel):
    atsScore: int
    jdMatchScore: Optional[int] = None
    structureScore: int
    hasJobDescription: bool
    candidateContext: Optional[Dict[str, Any]] = None
    keyFindings: Optional[Dict[str, Any]] = None
    suggestions: Dict[str, List[str]]
    structureAnalysis: Dict[str, Any]
    priorityActions: Optional[List[Dict[str, Any]]] = None

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# AI Resume Analysis Endpoint
@api_router.post("/analyze-resume")
async def analyze_resume(request: ResumeAnalysisRequest):
    """
    Analyze resume using Gemini AI via emergentintegrations.
    Supports both Emergent LLM key and user-provided Gemini API keys.
    """
    try:
        logger.info("Received AI resume analysis request")
        logger.info(f"Resume length: {len(request.resumeText)} chars")
        logger.info(f"Has Job Description: {bool(request.jobDescription)}")
        logger.info(f"Use Emergent Key: {request.useEmergentKey}")
        
        # Validate input
        if not request.resumeText or not request.resumeText.strip():
            raise HTTPException(status_code=400, detail="Resume text is required")
        
        # Input size validation
        MAX_RESUME_LENGTH = 50000
        MAX_JD_LENGTH = 20000
        
        if len(request.resumeText) > MAX_RESUME_LENGTH:
            raise HTTPException(
                status_code=400,
                detail=f"Resume too long ({len(request.resumeText)} chars). Max {MAX_RESUME_LENGTH} chars."
            )
        
        if request.jobDescription and len(request.jobDescription) > MAX_JD_LENGTH:
            raise HTTPException(
                status_code=400,
                detail=f"Job description too long ({len(request.jobDescription)} chars). Max {MAX_JD_LENGTH} chars."
            )
        
        # Determine which API key to use
        api_key = None
        if request.useEmergentKey:
            api_key = os.environ.get('EMERGENT_LLM_KEY')
            if not api_key:
                raise HTTPException(
                    status_code=500,
                    detail="Emergent LLM key not configured on server"
                )
            logger.info("Using Emergent LLM key")
        elif request.geminiApiKey:
            api_key = request.geminiApiKey.strip()
            logger.info("Using user-provided Gemini API key")
        else:
            raise HTTPException(
                status_code=400,
                detail="Either use Emergent key or provide your Gemini API key"
            )
        
        # Run the analysis pipeline
        result = await run_analysis_pipeline(
            api_key=api_key,
            resume_text=request.resumeText.strip(),
            job_description=request.jobDescription.strip() if request.jobDescription else None
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in analyze-resume endpoint: {str(e)}", exc_info=True)
        error_message = str(e)
        
        # Handle specific error types
        if "INVALID_API_KEY" in error_message or "API_KEY_INVALID" in error_message:
            raise HTTPException(
                status_code=401,
                detail="Invalid Gemini API key. Please check your API key and try again."
            )
        
        if "API_KEY_FORBIDDEN" in error_message or "403" in error_message:
            raise HTTPException(
                status_code=403,
                detail="API key access denied. Make sure the Generative Language API is enabled in your Google Cloud Console."
            )
        
        if "RATE_LIMITED" in error_message or "429" in error_message or "RESOURCE_EXHAUSTED" in error_message or "Quota exceeded" in error_message:
            raise HTTPException(
                status_code=429,
                detail="Gemini API rate limit reached (Free Tier). Please wait a minute or add your own API Key in the settings."
            )
        
        if "JSON_PARSE_ERROR" in error_message:
            raise HTTPException(
                status_code=502,
                detail="AI returned an invalid response. Please try again."
            )
        
        # Generic error
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {error_message}"
        )


async def run_analysis_pipeline(api_key: str, resume_text: str, job_description: Optional[str]) -> Dict[str, Any]:
    """
    Run the complete resume analysis pipeline using Gemini via emergentintegrations.
    """
    logger.info("=== Starting Resume Analysis Pipeline ===")
    logger.info(f"JD provided: {bool(job_description)}")
    
    try:
        # Step 1: Extract resume data
        logger.info("[Step 1] Extracting resume data...")
        resume_data = await extract_resume_data(api_key, resume_text)
        
        # Step 2: Extract job requirements (if JD provided)
        jd_data = None
        gap_analysis = None
        if job_description:
            logger.info("[Step 2] Extracting job requirements...")
            jd_data = await extract_job_requirements(api_key, job_description)
            
            logger.info("[Step 3] Performing gap analysis...")
            gap_analysis = await perform_gap_analysis(api_key, resume_data, jd_data)
        
        # Step 4: Generate final analysis
        logger.info("[Step 4] Generating final analysis...")
        final_analysis = await generate_final_analysis(
            api_key, resume_text, job_description, resume_data, jd_data, gap_analysis
        )
        
        logger.info("=== Pipeline Complete ===")
        return final_analysis
        
    except Exception as e:
        logger.error(f"Pipeline error: {str(e)}", exc_info=True)
        raise


async def extract_resume_data(api_key: str, resume_text: str) -> Dict[str, Any]:
    """Extract structured data from resume using Gemini."""
    prompt = f"""You are a resume parser. Extract structured information from the following resume.

RESUME:
{resume_text}

Extract and return a JSON object with:
{{
  "candidateName": "<name or 'Not specified'>",
  "currentRole": "<most recent job title>",
  "yearsExperience": "<estimated total years>",
  "skills": ["<skill1>", "<skill2>", ...],
  "education": ["<degree1>", "<degree2>", ...],
  "certifications": ["<cert1>", "<cert2>", ...],
  "achievements": ["<quantified achievement1>", "<achievement2>", ...],
  "summary": "<brief 2-sentence summary of the candidate>"
}}

Return ONLY valid JSON, no markdown."""
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"resume_extract_{uuid.uuid4()}",
            system_message="You are a precise data extractor. Return only valid JSON."
        ).with_model("gemini", "gemini-2.0-flash")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse JSON response
        return parse_json_response(response)
    except Exception as e:
        logger.error(f"Error extracting resume data: {str(e)}")
        raise


async def extract_job_requirements(api_key: str, job_description: str) -> Dict[str, Any]:
    """Extract structured requirements from job description."""
    prompt = f"""You are a job description parser. Extract structured requirements from the following job description.

JOB DESCRIPTION:
{job_description}

Extract and return a JSON object with:
{{
  "title": "<job title>",
  "requiredYears": "<required years of experience>",
  "mustHaveSkills": ["<required skill1>", "<required skill2>", ...],
  "niceToHaveSkills": ["<optional skill1>", "<optional skill2>", ...],
  "requiredCertifications": ["<cert1>", "<cert2>", ...],
  "keyResponsibilities": ["<responsibility1>", "<responsibility2>", ...],
  "industryKeywords": ["<keyword1>", "<keyword2>", ...]
}}

Return ONLY valid JSON, no markdown."""
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"jd_extract_{uuid.uuid4()}",
            system_message="You are a precise data extractor. Return only valid JSON."
        ).with_model("gemini", "gemini-2.0-flash")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        return parse_json_response(response)
    except Exception as e:
        logger.error(f"Error extracting job requirements: {str(e)}")
        raise


async def perform_gap_analysis(api_key: str, resume_data: Dict, jd_data: Dict) -> Dict[str, Any]:
    """Perform gap analysis between resume and job requirements."""
    prompt = f"""You are a gap analysis expert. Compare the candidate's profile against job requirements.

CANDIDATE PROFILE:
{json.dumps(resume_data, indent=2)}

JOB REQUIREMENTS:
{json.dumps(jd_data, indent=2)}

Identify gaps and return a JSON object:
{{
  "missingSkills": ["<skills from JD not in resume>"],
  "underemphasizedSkills": ["<skills present but not highlighted enough>"],
  "missingKeywords": ["<important JD keywords absent from resume>"],
  "experienceGaps": ["<experience requirements not clearly met>"]
}}

Return ONLY valid JSON, no markdown."""
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"gap_analysis_{uuid.uuid4()}",
            system_message="You are a gap analysis expert. Return only valid JSON."
        ).with_model("gemini", "gemini-2.0-flash")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        return parse_json_response(response)
    except Exception as e:
        logger.error(f"Error performing gap analysis: {str(e)}")
        raise


async def generate_final_analysis(
    api_key: str,
    resume_text: str,
    job_description: Optional[str],
    resume_data: Dict,
    jd_data: Optional[Dict],
    gap_analysis: Optional[Dict]
) -> Dict[str, Any]:
    """Generate comprehensive final analysis."""
    
    if job_description and jd_data and gap_analysis:
        prompt = f"""You are an expert ATS analyst and career coach providing personalized resume feedback.

## EXTRACTED CANDIDATE DATA:
{json.dumps(resume_data, indent=2)}

## EXTRACTED JOB REQUIREMENTS:
{json.dumps(jd_data, indent=2)}

## GAP ANALYSIS RESULTS:
{json.dumps(gap_analysis, indent=2)}

## ORIGINAL RESUME TEXT:
{resume_text[:5000]}

## ORIGINAL JOB DESCRIPTION:
{job_description[:3000]}

Generate a comprehensive analysis following these scoring rubrics:

### ATS Score (0-100) - Calculate based on:
- Contact info (email, phone, location): 15 points
- Professional summary: 10 points
- Work experience section: 15 points
- Education section: 10 points
- Skills section: 10 points
- Standard headings: 10 points
- Plain text format: 10 points
- Action verbs: 10 points
- Consistent dates: 5 points
- Single column: 5 points

### JD Match Score (0-100) - Calculate based on:
- Required skills match: 40 points
- Nice-to-have skills: 15 points
- Years of experience: 15 points
- Certifications: 20 points
- Industry keywords: 10 points

### Structure Score (0-100) - Calculate based on:
- Clear section headings: 15 points
- Consistent formatting: 10 points
- Bullet points: 15 points
- Quantified achievements: 15 points
- Proper length: 10 points
- White space: 15 points
- Logical order: 10 points
- No typos: 10 points

Return ONLY valid JSON in this exact format:
{{
  "atsScore": <number 0-100>,
  "jdMatchScore": <number 0-100>,
  "structureScore": <number 0-100>,
  "hasJobDescription": true,
  "candidateContext": {{
    "name": "<name>",
    "currentRole": "<role>",
    "yearsExperience": "<years>",
    "topSkills": ["<skill1>", "<skill2>", "<skill3>"]
  }},
  "keyFindings": {{
    "strongMatches": ["<specific match with JD>"],
    "criticalGaps": ["<specific gap from JD>"],
    "quickWins": ["<easy improvement>"]
  }},
  "suggestions": {{
    "additions": ["<specific addition suggestion>"],
    "removals": ["<specific removal suggestion>"],
    "improvements": ["<specific improvement suggestion>"]
  }},
  "structureAnalysis": {{
    "sections": [
      {{"name": "Contact Information", "status": "good|needs-improvement|missing", "feedback": "<specific feedback>"}},
      {{"name": "Professional Summary", "status": "good|needs-improvement|missing", "feedback": "<specific feedback>"}},
      {{"name": "Work Experience", "status": "good|needs-improvement|missing", "feedback": "<specific feedback>"}},
      {{"name": "Skills", "status": "good|needs-improvement|missing", "feedback": "<specific feedback>"}},
      {{"name": "Education", "status": "good|needs-improvement|missing", "feedback": "<specific feedback>"}},
      {{"name": "Certifications", "status": "good|needs-improvement|missing", "feedback": "<specific feedback>"}}
    ],
    "formatting": ["<specific formatting recommendation>"]
  }},
  "priorityActions": [
    {{"priority": 1, "action": "<most impactful change>", "impact": "high"}},
    {{"priority": 2, "action": "<second most impactful>", "impact": "medium"}},
    {{"priority": 3, "action": "<third most impactful>", "impact": "low"}}
  ]
}}"""
    else:
        prompt = f"""You are an expert ATS analyst providing personalized resume feedback.

## EXTRACTED CANDIDATE DATA:
{json.dumps(resume_data, indent=2)}

## ORIGINAL RESUME TEXT:
{resume_text[:5000]}

Generate a comprehensive ATS and structure analysis (NO job description provided).

### ATS Score (0-100) - Calculate based on:
- Contact info: 15 points
- Professional summary: 10 points
- Work experience: 15 points
- Education: 10 points
- Skills: 10 points
- Standard headings: 10 points
- Plain text: 10 points
- Action verbs: 10 points
- Consistent dates: 5 points
- Single column: 5 points

### Structure Score (0-100) - Calculate based on:
- Clear headings: 15 points
- Consistent formatting: 10 points
- Bullet points: 15 points
- Quantified achievements: 15 points
- Proper length: 10 points
- White space: 15 points
- Logical order: 10 points
- No typos: 10 points

Return ONLY valid JSON in this exact format:
{{
  "atsScore": <number 0-100>,
  "structureScore": <number 0-100>,
  "hasJobDescription": false,
  "candidateContext": {{
    "name": "<name>",
    "currentRole": "<role>",
    "yearsExperience": "<years>",
    "topSkills": ["<skill1>", "<skill2>", "<skill3>"]
  }},
  "keyFindings": {{
    "strongMatches": ["<strong point in resume>"],
    "criticalGaps": ["<area needing improvement>"],
    "quickWins": ["<easy fix>"]
  }},
  "suggestions": {{
    "additions": ["<specific addition>"],
    "removals": ["<specific removal>"],
    "improvements": ["<specific improvement>"]
  }},
  "structureAnalysis": {{
    "sections": [
      {{"name": "Contact Information", "status": "good|needs-improvement|missing", "feedback": "<specific>"}},
      {{"name": "Professional Summary", "status": "good|needs-improvement|missing", "feedback": "<specific>"}},
      {{"name": "Work Experience", "status": "good|needs-improvement|missing", "feedback": "<specific>"}},
      {{"name": "Skills", "status": "good|needs-improvement|missing", "feedback": "<specific>"}},
      {{"name": "Education", "status": "good|needs-improvement|missing", "feedback": "<specific>"}},
      {{"name": "Certifications", "status": "good|needs-improvement|missing", "feedback": "<specific>"}}
    ],
    "formatting": ["<specific recommendation>"]
  }},
  "priorityActions": [
    {{"priority": 1, "action": "<most impactful>", "impact": "high"}},
    {{"priority": 2, "action": "<second most impactful>", "impact": "medium"}},
    {{"priority": 3, "action": "<third most impactful>", "impact": "low"}}
  ]
}}"""
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"final_analysis_{uuid.uuid4()}",
            system_message="You are an expert ATS analyst. Return only valid JSON matching the exact schema specified."
        ).with_model("gemini", "gemini-2.0-flash")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        return parse_json_response(response)
    except Exception as e:
        logger.error(f"Error generating final analysis: {str(e)}")
        raise


def parse_json_response(content: str) -> Dict[str, Any]:
    """Parse JSON from AI response, handling markdown code blocks."""
    try:
        # Remove markdown code blocks if present
        json_content = content
        
        # Try to extract from markdown code block
        import re
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', content)
        if json_match:
            json_content = json_match.group(1).strip()
        
        # Try to extract JSON object if there's extra text
        object_match = re.search(r'\{[\s\S]*\}', json_content)
        if object_match:
            json_content = object_match.group(0)
        
        return json.loads(json_content)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse failed: {e}. Content: {content[:500]}")
        raise Exception("JSON_PARSE_ERROR: Failed to parse AI response. Please try again.")


# Include the router in the main app
app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
