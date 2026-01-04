import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  resumeText: string;
  jobDescription: string;
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
  improveResume: (resumeText: string, jobDescription: string, suggestions: string[], formatting: string[], preserveStructure: boolean) => `
You are an expert resume writer and career coach. Your task is to improve the provided resume based on the suggestions.

## ORIGINAL RESUME:
${resumeText}

## TARGET JOB DESCRIPTION:
${jobDescription}

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
5. Is tailored specifically for the target job description
6. Maintains a clean, professional structure
`}

## OUTPUT FORMAT:
Return ONLY the improved resume content in a clean, professional text format.
Do NOT include any explanations, comments, or markdown formatting. Just the pure resume text that can be directly used in a document.
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

    // Generate improved resume using Gemini with retry logic
    const prompt = PromptTemplates.improveResume(resumeText, jobDescription, suggestionsList, formatting, preserveStructure);

    const callLLM = async (model: string, retries = 3): Promise<string> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`[generate-improved-resume] Attempt ${attempt} with model ${model}`);
          
          const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: prompt }],
              temperature: 0.4,
              max_tokens: 4000,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[generate-improved-resume] API Error (attempt ${attempt}):`, errorText);
            
            // Retry on 503 or 429 errors
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

    let improvedResume: string;
    try {
      improvedResume = await callLLM("google/gemini-2.5-flash");
    } catch (error) {
      console.log("[generate-improved-resume] Primary model failed, trying fallback...");
      improvedResume = await callLLM("google/gemini-2.5-flash-lite");
    }

    console.log("[generate-improved-resume] Successfully generated improved resume");
    console.log("[generate-improved-resume] Output length:", improvedResume.length, "characters");

    return new Response(
      JSON.stringify({ 
        improvedResume,
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
