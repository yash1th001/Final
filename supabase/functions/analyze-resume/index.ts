import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalysisRequest {
  resumeText: string;
  jobDescription: string;
}

// LangChain-style chain-of-thought prompting for personalized analysis
const createAnalysisChain = (resumeText: string, jobDescription: string) => {
  const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyst and career coach with deep expertise in resume optimization.

## YOUR ANALYSIS METHODOLOGY (Chain of Thought)

Follow this step-by-step reasoning process:

### STEP 1: RESUME PARSING
First, identify and extract from the resume:
- Candidate's name and contact info
- Current/most recent job title
- Years of experience
- Key technical skills
- Soft skills mentioned
- Educational background
- Certifications
- Notable achievements with metrics

### STEP 2: JOB REQUIREMENTS EXTRACTION
From the job description, identify:
- Required years of experience
- Must-have technical skills
- Nice-to-have skills
- Required certifications
- Key responsibilities
- Industry-specific keywords
- Company culture indicators

### STEP 3: GAP ANALYSIS
Compare resume vs job requirements:
- Which required skills are missing from the resume?
- Which required skills are present but not emphasized?
- What relevant experience is missing or understated?
- Which keywords from JD are absent?

### STEP 4: ATS OPTIMIZATION CHECK
Evaluate the resume for:
- Standard section headings (Education, Experience, Skills)
- Keyword density and placement
- Formatting compatibility (no tables, images, complex layouts)
- Date formatting consistency
- Use of standard job titles

### STEP 5: PERSONALIZED RECOMMENDATIONS
Based on the specific gaps found, provide:
- Exact keywords to add from the JD
- Specific achievements to highlight differently
- Sections to add or restructure
- Irrelevant content to remove
- How to reframe existing experience

## CRITICAL RULES FOR PERSONALIZATION
1. NEVER give generic advice. Every suggestion must reference specific content from THIS resume or THIS job description.
2. Quote exact phrases from the resume when suggesting changes
3. Quote exact requirements from the JD when explaining what to add
4. If the resume mentions "managed a team", suggest HOW to improve that specific bullet
5. If the JD requires "5+ years Python", check if resume shows Python experience and for how long

## OUTPUT FORMAT
Return a valid JSON object with this exact structure:
{
  "atsScore": <number 0-100>,
  "jdMatchScore": <number 0-100>,
  "structureScore": <number 0-100>,
  "candidateContext": {
    "name": "<extracted name or 'Not specified'>",
    "currentRole": "<current/recent role>",
    "yearsExperience": "<estimated years>",
    "topSkills": ["<skill1>", "<skill2>", "<skill3>"]
  },
  "keyFindings": {
    "strongMatches": ["<specific match 1>", "<specific match 2>"],
    "criticalGaps": ["<specific gap 1>", "<specific gap 2>"],
    "quickWins": ["<easy improvement 1>", "<easy improvement 2>"]
  },
  "suggestions": {
    "additions": [
      "<SPECIFIC: Add 'X technology' from JD line Y to your skills section>",
      "<SPECIFIC: Include metrics for your achievement about Z>"
    ],
    "removals": [
      "<SPECIFIC: Remove or shorten the section about X as it's not relevant to this role>",
      "<SPECIFIC: The phrase 'Y' is outdated, replace with 'Z'>"
    ],
    "improvements": [
      "<SPECIFIC: Your bullet 'managed team projects' should become 'Led cross-functional team of X members to deliver Y project, resulting in Z% improvement'>",
      "<SPECIFIC: Move your X certification higher as the JD specifically requires it>"
    ]
  },
  "structureAnalysis": {
    "sections": [
      {"name": "Contact Information", "status": "good|needs-improvement|missing"},
      {"name": "Professional Summary", "status": "good|needs-improvement|missing"},
      {"name": "Work Experience", "status": "good|needs-improvement|missing"},
      {"name": "Skills", "status": "good|needs-improvement|missing"},
      {"name": "Education", "status": "good|needs-improvement|missing"},
      {"name": "Certifications", "status": "good|needs-improvement|missing"}
    ],
    "formatting": [
      "<SPECIFIC formatting recommendation based on THIS resume>"
    ]
  }
}`;

  const userPrompt = `Analyze this specific resume against this specific job description using your chain-of-thought methodology.

Think through each step carefully and provide HIGHLY PERSONALIZED feedback.

=== CANDIDATE'S RESUME ===
${resumeText}

=== TARGET JOB DESCRIPTION ===
${jobDescription}

Remember: 
- Reference SPECIFIC content from the resume (quote exact phrases)
- Reference SPECIFIC requirements from the job description
- Do NOT give generic advice that could apply to any resume
- Every suggestion should be actionable and specific to THIS candidate for THIS role`;

  return { systemPrompt, userPrompt };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, jobDescription }: AnalysisRequest = await req.json();

    if (!resumeText || !jobDescription) {
      return new Response(
        JSON.stringify({ error: "Resume text and job description are required" }),
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

    console.log("Starting personalized resume analysis with chain-of-thought...");
    console.log("Resume length:", resumeText.length, "chars");
    console.log("JD length:", jobDescription.length, "chars");

    // Create the analysis chain prompts
    const { systemPrompt, userPrompt } = createAnalysisChain(resumeText, jobDescription);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
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

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response:", data);
      return new Response(
        JSON.stringify({ error: "No analysis generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI response received, parsing JSON...");

    // Extract JSON from the response (handle markdown code blocks)
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    }

    try {
      const analysisResult = JSON.parse(jsonContent);
      console.log("Personalized analysis complete.");
      console.log("Candidate context:", analysisResult.candidateContext?.name || "Unknown");
      console.log("ATS Score:", analysisResult.atsScore);
      console.log("Key findings:", analysisResult.keyFindings?.criticalGaps?.length || 0, "gaps identified");
      
      return new Response(
        JSON.stringify(analysisResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Raw content:", content);
      
      return new Response(
        JSON.stringify({ error: "Failed to parse analysis results" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in analyze-resume function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
