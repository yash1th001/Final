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

## SCORING CRITERIA:
- ATS Score (0-100): Keyword optimization, formatting, standard sections, parsability
- JD Match Score (0-100): Skills alignment, experience match, requirement coverage
- Structure Score (0-100): Organization, formatting, readability, completeness

## OUTPUT FORMAT (JSON only, no markdown):
{
  "atsScore": <number>,
  "jdMatchScore": <number>,
  "structureScore": <number>,
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
    "additions": ["<SPECIFIC: Add '[exact keyword from JD]' to skills - JD states: '[quote JD]'>"],
    "removals": ["<SPECIFIC: Remove/shorten '[quote from resume]' - not relevant to this role>"],
    "improvements": ["<SPECIFIC: Change '[exact quote from resume]' to '[improved version]' to highlight [JD requirement]>"]
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

## SCORING CRITERIA:
- ATS Score (0-100): Keyword optimization, formatting, standard sections, parsability
- Structure Score (0-100): Organization, formatting, readability, completeness

## OUTPUT FORMAT (JSON only, no markdown):
{
  "atsScore": <number>,
  "structureScore": <number>,
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
    "additions": ["<SPECIFIC: Add '[keyword/section]' to improve ATS compatibility>"],
    "removals": ["<SPECIFIC: Remove/shorten '[quote from resume]' - too verbose or irrelevant>"],
    "improvements": ["<SPECIFIC: Change '[exact quote from resume]' to '[improved version]'>"]
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

const callLLM = async (
  apiKey: string,
  systemContent: string,
  userContent: string,
  model: string = "google/gemini-2.5-flash",
  retries: number = 3
): Promise<string> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`[LLM] Attempt ${attempt + 1}/${retries} with model: ${model}`);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemContent },
            { role: "user", content: userContent },
          ],
        }),
      });

      if (response.status === 503 || response.status === 429) {
        console.log(`[LLM] Got ${response.status}, retrying after delay...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
        continue;
      }

      if (!response.ok) {
        const status = response.status;
        if (status === 429) throw new Error("RATE_LIMIT");
        if (status === 402) throw new Error("PAYMENT_REQUIRED");
        throw new Error(`LLM call failed: ${status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (error) {
      console.error(`[LLM] Attempt ${attempt + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on these specific errors
      if (lastError.message === "RATE_LIMIT" || lastError.message === "PAYMENT_REQUIRED") {
        throw lastError;
      }
      
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
      }
    }
  }
  
  throw lastError || new Error("All LLM retry attempts failed");
};

// Chain 1: Extract Resume Data
const extractResumeChain = async (apiKey: string, resumeText: string): Promise<ResumeData> => {
  console.log("[Chain 1] Extracting resume data...");
  const prompt = PromptTemplates.resumeExtraction.replace("{resumeText}", resumeText);
  const response = await callLLM(apiKey, "You are a precise data extractor. Return only valid JSON.", prompt);
  const parsed = OutputParsers.parseJSON(response);
  return OutputParsers.validateResumeData(parsed);
};

// Chain 2: Extract Job Requirements
const extractJDChain = async (apiKey: string, jobDescription: string): Promise<JobRequirements> => {
  console.log("[Chain 2] Extracting job requirements...");
  const prompt = PromptTemplates.jdExtraction.replace("{jobDescription}", jobDescription);
  const response = await callLLM(apiKey, "You are a precise data extractor. Return only valid JSON.", prompt);
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
  const response = await callLLM(apiKey, "You are a gap analysis expert. Return only valid JSON.", prompt);
  const parsed = OutputParsers.parseJSON(response);
  return OutputParsers.validateGapAnalysis(parsed);
};

// Chain 4: Final Analysis (uses all previous chain outputs)
const finalAnalysisChain = async (
  apiKey: string,
  context: ChainContext
): Promise<unknown> => {
  console.log("[Chain 4] Generating final personalized analysis...");
  
  let prompt: string;
  if (context.jobDescription && context.extractedJD && context.gapAnalysis) {
    // Full analysis with JD
    prompt = PromptTemplates.finalAnalysisWithJD
      .replace("{extractedResume}", JSON.stringify(context.extractedResume, null, 2))
      .replace("{extractedJD}", JSON.stringify(context.extractedJD, null, 2))
      .replace("{gapAnalysis}", JSON.stringify(context.gapAnalysis, null, 2))
      .replace("{resumeText}", context.resumeText)
      .replace("{jobDescription}", context.jobDescription);
  } else {
    // Resume-only analysis
    prompt = PromptTemplates.finalAnalysisResumeOnly
      .replace("{extractedResume}", JSON.stringify(context.extractedResume, null, 2))
      .replace("{resumeText}", context.resumeText);
  }
  
  const response = await callLLM(
    apiKey,
    "You are an expert ATS analyst. Provide personalized, specific feedback. Return only valid JSON.",
    prompt,
    "google/gemini-2.5-pro" // Use pro model for final analysis
  );
  return OutputParsers.parseJSON(response);
};

// ============================================
// SEQUENTIAL CHAIN (LangChain-style pipeline)
// ============================================

const runAnalysisPipeline = async (
  apiKey: string,
  resumeText: string,
  jobDescription: string | null
): Promise<unknown> => {
  console.log("=== Starting LangChain-style Analysis Pipeline ===");
  console.log("Has Job Description:", !!jobDescription);
  
  const context: ChainContext = { resumeText, jobDescription };

  if (jobDescription) {
    // Run extraction chains in parallel for efficiency (with JD)
    console.log("[Pipeline] Running parallel extraction chains with JD...");
    const [extractedResume, extractedJD] = await Promise.all([
      extractResumeChain(apiKey, resumeText),
      extractJDChain(apiKey, jobDescription),
    ]);

    context.extractedResume = extractedResume;
    context.extractedJD = extractedJD;

    console.log("[Pipeline] Resume extracted:", extractedResume.candidateName);
    console.log("[Pipeline] JD extracted:", extractedJD.title);

    // Run gap analysis (depends on extraction results)
    context.gapAnalysis = await gapAnalysisChain(apiKey, extractedResume, extractedJD);
    console.log("[Pipeline] Gaps identified:", context.gapAnalysis.missingSkills.length, "missing skills");
  } else {
    // Resume-only extraction
    console.log("[Pipeline] Running resume-only extraction...");
    context.extractedResume = await extractResumeChain(apiKey, resumeText);
    context.extractedJD = null;
    context.gapAnalysis = null;
    console.log("[Pipeline] Resume extracted:", context.extractedResume.candidateName);
  }

  // Run final analysis (uses all context)
  const finalResult = await finalAnalysisChain(apiKey, context);
  console.log("=== Pipeline Complete ===");

  return finalResult;
};

// ============================================
// HTTP HANDLER
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, jobDescription }: AnalysisRequest = await req.json();

    if (!resumeText) {
      return new Response(
        JSON.stringify({ error: "Resume text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Received analysis request");
    console.log("Resume length:", resumeText.length, "chars");
    console.log("JD provided:", !!jobDescription);
    if (jobDescription) console.log("JD length:", jobDescription.length, "chars");

    const result = await runAnalysisPipeline(LOVABLE_API_KEY, resumeText, jobDescription || null);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-resume function:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage === "RATE_LIMIT") {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (errorMessage === "PAYMENT_REQUIRED") {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Failed to analyze resume. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
