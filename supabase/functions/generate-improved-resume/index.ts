import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  resumeText: string;
  jobDescription: string | null;
  suggestions: string[] | {
    additions: string[];
    removals: string[];
    improvements: string[];
  };
  structureAnalysis?: {
    sections: Array<{ name: string; status: string }>;
    formatting: string[];
  };
  preserveStructure?: boolean;
}

// Prompt template for resume improvement
const PromptTemplates = {
  improveResume: (resumeText: string, jobDescription: string | null, suggestions: string[], formatting: string[], preserveStructure: boolean) => `
You are an expert resume writer and career coach. Your task is to improve the provided resume based on the suggestions.

## ORIGINAL RESUME:
${resumeText}

${jobDescription ? `## TARGET JOB DESCRIPTION:\n${jobDescription}` : '## NOTE: No specific job description provided. Focus on general ATS optimization and professional improvements.'}

## SUGGESTIONS TO APPLY:
${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

${formatting.length > 0 ? `## FORMATTING RECOMMENDATIONS:\n${formatting.map((f, i) => `${i + 1}. ${f}`).join('\n')}` : ''}

## YOUR TASK:
${preserveStructure ? `
IMPORTANT: You MUST preserve the EXACT structure, section order, and general alignment of the original resume.
- Keep the same sections in the same order
- Maintain the same formatting style (bullet points, spacing, etc.)
- Only modify the content within each section to apply the suggestions
- Do not add new sections or remove existing sections unless explicitly suggested
- Preserve the visual layout as much as possible

Rewrite the resume by:
1. Applying the keyword and skill additions within existing sections
2. Improving bullet points with stronger action verbs and metrics
3. Optimizing content for ATS without changing the structure
4. Keeping the candidate's authentic voice and experience
` : `
Rewrite the resume incorporating ALL the suggestions above. Create a professional, ATS-optimized resume that:
1. Applies all the recommended additions (add relevant keywords, skills, achievements)
2. Implements all the improvement suggestions
3. Follows the formatting recommendations
4. Uses strong action verbs and quantifiable achievements
${jobDescription ? '5. Is tailored specifically for the target job description' : '5. Is optimized for general ATS compatibility'}
6. Maintains a clean, professional structure
`}

## REQUIRED OUTPUT STRUCTURE (Professional ATS Resume Format):
The resume MUST follow this EXACT structure for maximum ATS compatibility. Include ALL sections with proper headings:

================================================================================
[CANDIDATE NAME]
[Phone] | [Email] | [LinkedIn URL] | [GitHub URL]
================================================================================

OBJECTIVE
---------
[2-3 sentence professional summary/objective statement]

EDUCATION
---------
[Institution Name]                                                    [Location]
[Degree Name] - [GPA/Percentage]                                      [Dates]

[Previous Institution]                                                [Location]
[Degree/Certificate] - [Score]                                        [Dates]

PROJECTS
--------
[Project Title] | [Technologies: Tech1, Tech2, Tech3]                 [Date]
• [Description of what you built and key features]
• [Quantified impact or technical achievement]
• GitHub: [link]

[Project Title] | [Technologies: Tech1, Tech2, Tech3]                 [Date]
• [Description of what you built and key features]
• [Quantified impact or technical achievement]
• GitHub: [link]

EXPERIENCE (if present)
-----------------------
[Company Name]                                                        [Location]
[Job Title]                                                           [Dates]
• [Achievement with metrics]
• [Responsibility with impact]

SKILLS
------
Languages: [Language1], [Language2], [Language3]
Machine Learning: [Skill1], [Skill2], [Skill3]
Frameworks: [Framework1], [Framework2]
Developer Tools: [Tool1], [Tool2]
Soft Skills: [Skill1], [Skill2]

CERTIFICATIONS
--------------
• [Certification Name] -- [Issuing Organization]
• [Certification Name] -- [Issuing Organization]

ACHIEVEMENTS
------------
• [Achievement description with context and impact]

## CRITICAL REQUIREMENTS:
1. ALWAYS include section headers in UPPERCASE followed by a line of dashes
2. Project entries MUST have: Title | Technologies | Date format
3. Each project MUST list technologies used after the pipe symbol
4. Use bullet points (•) for all list items
5. Right-align dates and locations
6. Include GitHub links for projects if available
7. Keep consistent spacing and alignment throughout

## OUTPUT FORMAT:
Return ONLY the improved resume content in clean text format.
Do NOT include any explanations, markdown formatting (no **, no ##), or code blocks.
`,

  scoreResume: (resumeText: string, jobDescription: string | null) => `
You are an ATS scoring expert. Evaluate the following resume and provide scores.

## RESUME:
${resumeText}

${jobDescription ? `## JOB DESCRIPTION:\n${jobDescription}` : ''}

## SCORING CRITERIA:
- ATS Score (0-100): Keyword optimization, standard sections, parsability, formatting
${jobDescription ? '- JD Match Score (0-100): Skills alignment, experience match, keyword coverage' : ''}
- Structure Score (0-100): Organization, formatting, section completeness

Return ONLY a JSON object:
{
  "atsScore": <number>,
  ${jobDescription ? '"jdMatchScore": <number>,' : ''}
  "structureScore": <number>,
  "feedback": "<brief feedback on areas to improve>"
}
`,
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, jobDescription, suggestions, structureAnalysis, preserveStructure = false } = await req.json() as GenerateRequest;

    console.log("[generate-improved-resume] Starting resume improvement generation");
    console.log("[generate-improved-resume] Preserve structure:", preserveStructure);
    console.log("[generate-improved-resume] Has job description:", !!jobDescription);

    // Normalize suggestions to array format
    let suggestionsList: string[] = [];
    if (Array.isArray(suggestions)) {
      suggestionsList = suggestions;
    } else if (suggestions && typeof suggestions === 'object') {
      suggestionsList = [
        ...(suggestions.additions || []),
        ...(suggestions.improvements || []),
      ];
    }

    console.log("[generate-improved-resume] Suggestions count:", suggestionsList.length);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const formatting = structureAnalysis?.formatting || [];

    const callLLM = async (promptText: string, model: string, retries = 3): Promise<string> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`[generate-improved-resume] Attempt ${attempt} with model ${model}`);
          
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: promptText }],
              temperature: 0.4,
              max_tokens: 4000,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[generate-improved-resume] API Error (attempt ${attempt}):`, errorText);
            
            if ((response.status === 503 || response.status === 429) && attempt < retries) {
              const delay = Math.pow(2, attempt) * 1000;
              console.log(`[generate-improved-resume] Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            throw new Error(`AI API request failed: ${response.status}`);
          }

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          
          if (!content) {
            throw new Error("No content in response");
          }
          
          return content;
        } catch (error) {
          if (attempt === retries) throw error;
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`[generate-improved-resume] Error, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      throw new Error("Max retries exceeded");
    };

    // Step 1: Generate improved resume
    const improvePrompt = PromptTemplates.improveResume(resumeText, jobDescription, suggestionsList, formatting, preserveStructure);
    
    let improvedResume: string;
    try {
      improvedResume = await callLLM(improvePrompt, "google/gemini-2.5-flash");
    } catch (error) {
      console.log("[generate-improved-resume] Primary model failed, trying fallback...");
      improvedResume = await callLLM(improvePrompt, "google/gemini-2.5-flash-lite");
    }

    console.log("[generate-improved-resume] Successfully generated improved resume");
    console.log("[generate-improved-resume] Output length:", improvedResume.length, "characters");

    // Step 2: Score the improved resume to validate quality
    let scores = null;
    try {
      const scorePrompt = PromptTemplates.scoreResume(improvedResume, jobDescription);
      const scoreResponse = await callLLM(scorePrompt, "google/gemini-2.5-flash-lite");
      
      // Parse the JSON response
      let jsonContent = scoreResponse;
      const jsonMatch = scoreResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      }
      scores = JSON.parse(jsonContent);
      console.log("[generate-improved-resume] Resume scores:", scores);
    } catch (scoreError) {
      console.log("[generate-improved-resume] Could not score resume, continuing without scores:", scoreError);
    }

    return new Response(
      JSON.stringify({ 
        improvedResume,
        scores,
        success: true 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate improved resume";
    console.error("[generate-improved-resume] Error:", errorMessage);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
