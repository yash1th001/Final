import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// LANGCHAIN-INSPIRED MODULAR CHAIN ARCHITECTURE
// ============================================

interface AnalysisRequest {
  resumeText: string;
  jobDescription: string | null;
  geminiApiKey?: string;
}

interface ChainContext {
  resumeText: string;
  jobDescription: string | null;
  extractedResume?: ResumeData;
  extractedJD?: JobRequirements | null;
  gapAnalysis?: GapAnalysis | null;
}

interface ResumeData {
  candidateName: string;
  currentRole: string;
  yearsExperience: string;
  skills: string[];
  education: string[];
  certifications: string[];
  achievements: string[];
  summary: string;
}

interface JobRequirements {
  title: string;
  requiredYears: string;
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  requiredCertifications: string[];
  keyResponsibilities: string[];
  industryKeywords: string[];
}

interface GapAnalysis {
  missingSkills: string[];
  underemphasizedSkills: string[];
  missingKeywords: string[];
  experienceGaps: string[];
}

// ============================================
// PROMPT TEMPLATES (LangChain-style)
// ============================================

const PromptTemplates = {
  resumeExtraction: `You are a resume parser. Extract structured information from the following resume.

RESUME:
{resumeText}

Extract and return a JSON object with:
{
  "candidateName": "<name or 'Not specified'>",
  "currentRole": "<most recent job title>",
  "yearsExperience": "<estimated total years>",
  "skills": ["<skill1>", "<skill2>", ...],
  "education": ["<degree1>", "<degree2>", ...],
  "certifications": ["<cert1>", "<cert2>", ...],
  "achievements": ["<quantified achievement1>", "<achievement2>", ...],
  "summary": "<brief 2-sentence summary of the candidate>"
}

Return ONLY valid JSON, no markdown.`,

  jdExtraction: `You are a job description parser. Extract structured requirements from the following job description.

JOB DESCRIPTION:
{jobDescription}

Extract and return a JSON object with:
{
  "title": "<job title>",
  "requiredYears": "<required years of experience>",
  "mustHaveSkills": ["<required skill1>", "<required skill2>", ...],
  "niceToHaveSkills": ["<optional skill1>", "<optional skill2>", ...],
  "requiredCertifications": ["<cert1>", "<cert2>", ...],
  "keyResponsibilities": ["<responsibility1>", "<responsibility2>", ...],
  "industryKeywords": ["<keyword1>", "<keyword2>", ...]
}

Return ONLY valid JSON, no markdown.`,

  gapAnalysis: `You are a gap analysis expert. Compare the candidate's profile against job requirements.

CANDIDATE PROFILE:
{extractedResume}

JOB REQUIREMENTS:
{extractedJD}

Identify gaps and return a JSON object:
{
  "missingSkills": ["<skills from JD not in resume>"],
  "underemphasizedSkills": ["<skills present but not highlighted enough>"],
  "missingKeywords": ["<important JD keywords absent from resume>"],
  "experienceGaps": ["<experience requirements not clearly met>"]
}

Return ONLY valid JSON, no markdown.`,

  finalAnalysisWithJD: `You are an expert ATS analyst and career coach providing personalized resume feedback.

## EXTRACTED CANDIDATE DATA:
{extractedResume}

## EXTRACTED JOB REQUIREMENTS:
{extractedJD}

## GAP ANALYSIS RESULTS:
{gapAnalysis}

## ORIGINAL RESUME TEXT (for specific quotes):
{resumeText}

## ORIGINAL JOB DESCRIPTION (for specific references):
{jobDescription}

## YOUR TASK:
Generate a comprehensive, HIGHLY PERSONALIZED analysis. Every suggestion must:
1. Quote SPECIFIC text from the resume when suggesting changes
2. Reference SPECIFIC requirements from the job description
3. Be immediately actionable

## DETERMINISTIC SCORING RUBRIC (CALCULATE EXACTLY - NO VARIANCE):

### ATS Score (0-100) - Add points for each present element:
| Criteria | Points | Check |
|----------|--------|-------|
| Contact: email present | +5 | Yes/No |
| Contact: phone present | +5 | Yes/No |
| Contact: location/city present | +5 | Yes/No |
| Professional Summary/Objective section | +10 | Yes/No |
| Work Experience section with company names | +8 | Yes/No |
| Work Experience with date ranges | +7 | Yes/No |
| Education section present | +5 | Yes/No |
| Education with dates/years | +5 | Yes/No |
| Skills section present | +10 | Yes/No |
| Standard headings (Experience/Education/Skills) | +10 | Yes/No |
| Plain text (no tables/graphics/columns) | +10 | Yes/No |
| Action verbs in bullet points | +10 | Yes/No |
| Consistent date format (MM/YYYY or Month Year) | +5 | Yes/No |
| Single column layout | +5 | Yes/No |
**Total possible: 100 points**

### JD Match Score (0-100) - Calculate mathematically:
1. Count required skills in JD: R
2. Count matched required skills in resume: M
3. Required Skills Score = (M / R) * 40
4. Count nice-to-have skills in JD: N
5. Count matched nice-to-have: MN
6. Nice-to-have Score = (MN / N) * 15 (or 0 if N=0)
7. Years experience meets requirement: +15 (or 0)
8. Certifications matched: min(matched * 10, 20)
9. Industry keywords: (matched / total) * 10
**Total = Sum of all components, round to integer**

### Structure Score (0-100) - Add points for each:
| Criteria | Points | Check |
|----------|--------|-------|
| Clear, distinct section headings | +15 | Yes/No |
| Consistent font/formatting | +10 | Yes/No |
| Consistent spacing | +5 | Yes/No |
| Uses bullet points for achievements | +15 | Yes/No |
| Has quantified achievements (%, $, numbers) | +15 | Yes/No |
| Length 1-2 pages | +10 | Yes/No |
| Readable fonts (no unusual fonts) | +5 | Yes/No |
| Adequate white space | +5 | Yes/No |
| Logical order (Summary→Experience→Skills→Education) | +10 | Yes/No |
| No obvious typos/grammar errors | +10 | Yes/No |
**Total possible: 100 points**

## CRITICAL SCORING RULES:
1. Calculate each score by going through EVERY criterion above
2. Document your calculation in your reasoning before outputting
3. The SAME resume with the SAME JD must ALWAYS produce the SAME scores
4. Round all scores to the nearest integer
5. Be strict but fair - partial credit is NOT allowed (criterion is either met or not)

## OUTPUT FORMAT (JSON only, no markdown):
{
  "atsScore": <number 0-100 calculated from rubric>,
  "jdMatchScore": <number 0-100 calculated from rubric>,
  "structureScore": <number 0-100 calculated from rubric>,
  "hasJobDescription": true,
  "candidateContext": {
    "name": "<name>",
    "currentRole": "<role>",
    "yearsExperience": "<years>",
    "topSkills": ["<skill1>", "<skill2>", "<skill3>"]
  },
  "keyFindings": {
    "strongMatches": ["<specific match with JD requirement - quote both>"],
    "criticalGaps": ["<specific gap - quote JD requirement missing from resume>"],
    "quickWins": ["<easy fix - be specific>"]
  },
  "suggestions": {
    "additions": ["Add '[exact keyword from JD]' to skills section - JD requires this skill"],
    "removals": ["Remove '[quote from resume]' - not relevant to this role"],
    "improvements": ["Change '[exact quote from resume]' to '[improved version]' for better impact"]
  },
  "structureAnalysis": {
    "sections": [
      {"name": "Contact Information", "status": "good|needs-improvement|missing", "feedback": "<specific>"},
      {"name": "Professional Summary", "status": "good|needs-improvement|missing", "feedback": "<specific>"},
      {"name": "Work Experience", "status": "good|needs-improvement|missing", "feedback": "<specific>"},
      {"name": "Skills", "status": "good|needs-improvement|missing", "feedback": "<specific>"},
      {"name": "Education", "status": "good|needs-improvement|missing", "feedback": "<specific>"},
      {"name": "Certifications", "status": "good|needs-improvement|missing", "feedback": "<specific>"}
    ],
    "formatting": ["<specific formatting recommendation>"]
  },
  "priorityActions": [
    {"priority": 1, "action": "<most impactful change>", "impact": "high|medium|low"},
    {"priority": 2, "action": "<second most impactful>", "impact": "high|medium|low"},
    {"priority": 3, "action": "<third most impactful>", "impact": "high|medium|low"}
  ]
}`,

  finalAnalysisResumeOnly: `You are an expert ATS analyst providing personalized resume feedback.

## EXTRACTED CANDIDATE DATA:
{extractedResume}

## ORIGINAL RESUME TEXT (for specific quotes):
{resumeText}

## YOUR TASK:
Generate a comprehensive ATS and structure analysis (NO job description provided). Focus on:
1. ATS compatibility and keyword optimization
2. Resume structure and formatting
3. General improvements for better readability and impact

## DETERMINISTIC SCORING RUBRIC (CALCULATE EXACTLY - NO VARIANCE):

### ATS Score (0-100) - Add points for each present element:
| Criteria | Points | Check |
|----------|--------|-------|
| Contact: email present | +5 | Yes/No |
| Contact: phone present | +5 | Yes/No |
| Contact: location/city present | +5 | Yes/No |
| Professional Summary/Objective section | +10 | Yes/No |
| Work Experience section with company names | +8 | Yes/No |
| Work Experience with date ranges | +7 | Yes/No |
| Education section present | +5 | Yes/No |
| Education with dates/years | +5 | Yes/No |
| Skills section present | +10 | Yes/No |
| Standard headings (Experience/Education/Skills) | +10 | Yes/No |
| Plain text (no tables/graphics/columns) | +10 | Yes/No |
| Action verbs in bullet points | +10 | Yes/No |
| Consistent date format (MM/YYYY or Month Year) | +5 | Yes/No |
| Single column layout | +5 | Yes/No |
**Total possible: 100 points**

### Structure Score (0-100) - Add points for each:
| Criteria | Points | Check |
|----------|--------|-------|
| Clear, distinct section headings | +15 | Yes/No |
| Consistent font/formatting | +10 | Yes/No |
| Consistent spacing | +5 | Yes/No |
| Uses bullet points for achievements | +15 | Yes/No |
| Has quantified achievements (%, $, numbers) | +15 | Yes/No |
| Length 1-2 pages | +10 | Yes/No |
| Readable fonts (no unusual fonts) | +5 | Yes/No |
| Adequate white space | +5 | Yes/No |
| Logical order (Summary→Experience→Skills→Education) | +10 | Yes/No |
| No obvious typos/grammar errors | +10 | Yes/No |
**Total possible: 100 points**

## CRITICAL SCORING RULES:
1. Calculate each score by going through EVERY criterion above
2. Document your calculation in your reasoning before outputting
3. The SAME resume must ALWAYS produce the SAME scores
4. Round all scores to the nearest integer
5. Be strict but fair - partial credit is NOT allowed (criterion is either met or not)

## OUTPUT FORMAT (JSON only, no markdown):
{
  "atsScore": <number 0-100 calculated from rubric>,
  "structureScore": <number 0-100 calculated from rubric>,
  "hasJobDescription": false,
  "candidateContext": {
    "name": "<name>",
    "currentRole": "<role>",
    "yearsExperience": "<years>",
    "topSkills": ["<skill1>", "<skill2>", "<skill3>"]
  },
  "keyFindings": {
    "strongMatches": ["<strong points in the resume>"],
    "criticalGaps": ["<areas needing improvement>"],
    "quickWins": ["<easy fix - be specific>"]
  },
  "suggestions": {
    "additions": ["Add '[keyword/section]' to improve ATS compatibility"],
    "removals": ["Remove '[quote from resume]' - too verbose or irrelevant"],
    "improvements": ["Change '[exact quote from resume]' to '[improved version]' for better readability"]
  },
  "structureAnalysis": {
    "sections": [
      {"name": "Contact Information", "status": "good|needs-improvement|missing", "feedback": "<specific>"},
      {"name": "Professional Summary", "status": "good|needs-improvement|missing", "feedback": "<specific>"},
      {"name": "Work Experience", "status": "good|needs-improvement|missing", "feedback": "<specific>"},
      {"name": "Skills", "status": "good|needs-improvement|missing", "feedback": "<specific>"},
      {"name": "Education", "status": "good|needs-improvement|missing", "feedback": "<specific>"},
      {"name": "Certifications", "status": "good|needs-improvement|missing", "feedback": "<specific>"}
    ],
    "formatting": ["<specific formatting recommendation>"]
  },
  "priorityActions": [
    {"priority": 1, "action": "<most impactful change>", "impact": "high|medium|low"},
    {"priority": 2, "action": "<second most impactful>", "impact": "high|medium|low"},
    {"priority": 3, "action": "<third most impactful>", "impact": "high|medium|low"}
  ]
}`
};

// ============================================
// OUTPUT PARSERS (LangChain-style)
// ============================================

const OutputParsers = {
  parseJSON: (content: string): unknown => {
    // Remove markdown code blocks if present
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    }
    return JSON.parse(jsonContent);
  },

  validateResumeData: (data: unknown): ResumeData => {
    const d = data as ResumeData;
    return {
      candidateName: d.candidateName || "Not specified",
      currentRole: d.currentRole || "Not specified",
      yearsExperience: d.yearsExperience || "Not specified",
      skills: Array.isArray(d.skills) ? d.skills : [],
      education: Array.isArray(d.education) ? d.education : [],
      certifications: Array.isArray(d.certifications) ? d.certifications : [],
      achievements: Array.isArray(d.achievements) ? d.achievements : [],
      summary: d.summary || "",
    };
  },

  validateJobRequirements: (data: unknown): JobRequirements => {
    const d = data as JobRequirements;
    return {
      title: d.title || "Not specified",
      requiredYears: d.requiredYears || "Not specified",
      mustHaveSkills: Array.isArray(d.mustHaveSkills) ? d.mustHaveSkills : [],
      niceToHaveSkills: Array.isArray(d.niceToHaveSkills) ? d.niceToHaveSkills : [],
      requiredCertifications: Array.isArray(d.requiredCertifications) ? d.requiredCertifications : [],
      keyResponsibilities: Array.isArray(d.keyResponsibilities) ? d.keyResponsibilities : [],
      industryKeywords: Array.isArray(d.industryKeywords) ? d.industryKeywords : [],
    };
  },

  validateGapAnalysis: (data: unknown): GapAnalysis => {
    const d = data as GapAnalysis;
    return {
      missingSkills: Array.isArray(d.missingSkills) ? d.missingSkills : [],
      underemphasizedSkills: Array.isArray(d.underemphasizedSkills) ? d.underemphasizedSkills : [],
      missingKeywords: Array.isArray(d.missingKeywords) ? d.missingKeywords : [],
      experienceGaps: Array.isArray(d.experienceGaps) ? d.experienceGaps : [],
    };
  },
};

// ============================================
// CHAIN EXECUTORS (LangChain-style)
// ============================================

const callGeminiLLM = async (
  apiKey: string,
  systemContent: string,
  userContent: string,
  retries: number = 3,
  temperature: number = 0.1
): Promise<string> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`[Gemini LLM] Attempt ${attempt + 1}/${retries}, temp: ${temperature}`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemContent + "\n\n" + userContent }
                ]
              }
            ],
            generationConfig: {
              temperature: temperature,
              maxOutputTokens: 4096,
            }
          }),
        }
      );

      if (response.status === 429) {
        console.log(`[Gemini] Rate limited, retrying after delay...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Gemini] API error: ${response.status}`, errorText);
        
        if (response.status === 400 && errorText.includes("API_KEY_INVALID")) {
          throw new Error("INVALID_API_KEY");
        }
        
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      if (!content) {
        throw new Error("Empty response from Gemini");
      }
      
      return content;
    } catch (error) {
      console.error(`[Gemini] Attempt ${attempt + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (lastError.message === "INVALID_API_KEY") {
        throw lastError;
      }
      
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
      }
    }
  }
  
  throw lastError || new Error("All Gemini retry attempts failed");
};

// Chain 1: Extract Resume Data
const extractResumeChain = async (apiKey: string, resumeText: string): Promise<ResumeData> => {
  console.log("[Chain 1] Extracting resume data...");
  const prompt = PromptTemplates.resumeExtraction.replace("{resumeText}", resumeText);
  const response = await callGeminiLLM(apiKey, "You are a precise data extractor. Return only valid JSON.", prompt);
  const parsed = OutputParsers.parseJSON(response);
  return OutputParsers.validateResumeData(parsed);
};

// Chain 2: Extract Job Requirements
const extractJDChain = async (apiKey: string, jobDescription: string): Promise<JobRequirements> => {
  console.log("[Chain 2] Extracting job requirements...");
  const prompt = PromptTemplates.jdExtraction.replace("{jobDescription}", jobDescription);
  const response = await callGeminiLLM(apiKey, "You are a precise data extractor. Return only valid JSON.", prompt);
  const parsed = OutputParsers.parseJSON(response);
  return OutputParsers.validateJobRequirements(parsed);
};

// Chain 3: Gap Analysis
const gapAnalysisChain = async (
  apiKey: string, 
  extractedResume: ResumeData, 
  extractedJD: JobRequirements
): Promise<GapAnalysis> => {
  console.log("[Chain 3] Performing gap analysis...");
  const prompt = PromptTemplates.gapAnalysis
    .replace("{extractedResume}", JSON.stringify(extractedResume, null, 2))
    .replace("{extractedJD}", JSON.stringify(extractedJD, null, 2));
  const response = await callGeminiLLM(apiKey, "You are a gap analysis expert. Return only valid JSON.", prompt);
  const parsed = OutputParsers.parseJSON(response);
  return OutputParsers.validateGapAnalysis(parsed);
};

// Chain 4: Final Analysis
const finalAnalysisChain = async (
  apiKey: string,
  context: ChainContext
): Promise<unknown> => {
  console.log("[Chain 4] Generating final analysis...");
  
  let prompt: string;
  if (context.jobDescription && context.extractedJD && context.gapAnalysis) {
    prompt = PromptTemplates.finalAnalysisWithJD
      .replace("{extractedResume}", JSON.stringify(context.extractedResume, null, 2))
      .replace("{extractedJD}", JSON.stringify(context.extractedJD, null, 2))
      .replace("{gapAnalysis}", JSON.stringify(context.gapAnalysis, null, 2))
      .replace("{resumeText}", context.resumeText)
      .replace("{jobDescription}", context.jobDescription);
  } else {
    prompt = PromptTemplates.finalAnalysisResumeOnly
      .replace("{extractedResume}", JSON.stringify(context.extractedResume, null, 2))
      .replace("{resumeText}", context.resumeText);
  }
  
  const response = await callGeminiLLM(
    apiKey, 
    "You are an expert ATS analyst. Return only valid JSON matching the exact schema specified.", 
    prompt
  );
  return OutputParsers.parseJSON(response);
};

// ============================================
// PIPELINE ORCHESTRATOR
// ============================================

const runAnalysisPipeline = async (
  apiKey: string,
  resumeText: string,
  jobDescription: string | null
): Promise<unknown> => {
  console.log("=== Starting LangChain-style Analysis Pipeline ===");
  console.log(`JD provided: ${!!jobDescription}`);
  
  const context: ChainContext = {
    resumeText,
    jobDescription,
  };
  
  if (jobDescription) {
    console.log("[Pipeline] Running parallel extraction...");
    const [extractedResume, extractedJD] = await Promise.all([
      extractResumeChain(apiKey, resumeText),
      extractJDChain(apiKey, jobDescription),
    ]);
    
    context.extractedResume = extractedResume;
    context.extractedJD = extractedJD;
    
    console.log("[Pipeline] Running gap analysis...");
    context.gapAnalysis = await gapAnalysisChain(apiKey, extractedResume, extractedJD);
  } else {
    console.log("[Pipeline] Running resume-only extraction...");
    context.extractedResume = await extractResumeChain(apiKey, resumeText);
  }
  
  console.log("[Pipeline] Running final analysis...");
  const result = await finalAnalysisChain(apiKey, context);
  
  console.log("=== Pipeline Complete ===");
  return result;
};

// ============================================
// HTTP HANDLER
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, jobDescription, geminiApiKey } = await req.json() as AnalysisRequest;
    
    console.log("Received AI analysis request");
    console.log(`Resume length: ${resumeText?.length || 0} chars`);
    console.log(`Has Job Description: ${!!jobDescription}`);
    console.log(`Has Gemini API Key: ${!!geminiApiKey}`);
    
    if (!resumeText || resumeText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Resume text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!geminiApiKey || geminiApiKey.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Gemini API key is required for AI analysis mode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const result = await runAnalysisPipeline(
      geminiApiKey.trim(),
      resumeText.trim(),
      jobDescription?.trim() || null
    );
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in analyze-resume function:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage === "INVALID_API_KEY") {
      return new Response(
        JSON.stringify({ error: "Invalid Gemini API key. Please check your API key and try again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Analysis failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
