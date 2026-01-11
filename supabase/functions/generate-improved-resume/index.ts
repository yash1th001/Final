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

## REQUIRED OUTPUT STRUCTURE (LaTeX ATS Resume Format):
The resume MUST follow this exact structure for maximum ATS compatibility:

1. **HEADER** (centered):
   - Full Name (large, bold)
   - Contact info on one line: Phone | Email | LinkedIn | GitHub

2. **OBJECTIVE/SUMMARY** (if present in original):
   - Brief 2-3 sentence professional summary

3. **EDUCATION**:
   Format each entry as:
   Institution Name | Location
   Degree - GPA/Percentage | Dates

4. **EXPERIENCE** (if present):
   Format each entry as:
   Company/Position | Location
   Role Title | Dates
   • Bullet point achievements with metrics

5. **PROJECTS**:
   Format each entry as:
   Project Name | Technologies Used | Date
   • Bullet point descriptions
   • GitHub Link (if available)

6. **SKILLS**:
   Format as:
   Languages: Python, Java, etc.
   Machine Learning: skill1, skill2, etc.
   Frameworks: framework1, framework2, etc.
   Tools: tool1, tool2, etc.

7. **CERTIFICATIONS** (if present):
   • Certification Name -- Issuing Organization

8. **ACHIEVEMENTS** (if present):
   • Achievement description

## OUTPUT FORMAT:
Return ONLY the improved resume content in clean text format following the structure above.
Use | as separators between items on the same line.
Use • for bullet points.
Do NOT include any explanations, comments, or markdown formatting.
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
