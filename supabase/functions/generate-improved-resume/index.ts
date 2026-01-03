import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  resumeText: string;
  jobDescription: string;
  suggestions: {
    additions: string[];
    removals: string[];
    improvements: string[];
  };
  structureAnalysis: {
    sections: Array<{ name: string; status: string }>;
    formatting: string[];
  };
}

// Prompt template for resume improvement
const PromptTemplates = {
  improveResume: (resumeText: string, jobDescription: string, suggestions: GenerateRequest['suggestions'], structureAnalysis: GenerateRequest['structureAnalysis']) => `
You are an expert resume writer and career coach. Your task is to rewrite and improve the provided resume based on the analysis suggestions.

## ORIGINAL RESUME:
${resumeText}

## TARGET JOB DESCRIPTION:
${jobDescription}

## ANALYSIS SUGGESTIONS TO APPLY:

### Things to ADD:
${suggestions.additions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

### Things to REMOVE or REDUCE:
${suggestions.removals.map((s, i) => `${i + 1}. ${s}`).join('\n')}

### Things to IMPROVE:
${suggestions.improvements.map((s, i) => `${i + 1}. ${s}`).join('\n')}

### FORMATTING RECOMMENDATIONS:
${structureAnalysis.formatting.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## YOUR TASK:
Rewrite the resume incorporating ALL the suggestions above. Create a professional, ATS-optimized resume that:
1. Applies all the recommended additions (add relevant keywords, skills, achievements)
2. Removes or minimizes the items flagged for removal
3. Implements all the improvement suggestions
4. Follows the formatting recommendations
5. Uses strong action verbs and quantifiable achievements
6. Is tailored specifically for the target job description
7. Maintains a clean, professional structure

## OUTPUT FORMAT:
Return ONLY the improved resume content in a clean, professional text format. Use the following structure:
- Contact information at the top
- Professional summary (2-3 sentences)
- Skills section with relevant keywords
- Work experience with bullet points and achievements
- Education section
- Optional: Certifications, Projects, or other relevant sections

Do NOT include any explanations, comments, or markdown formatting. Just the pure resume text that can be directly used in a document.
`,
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, jobDescription, suggestions, structureAnalysis } = await req.json() as GenerateRequest;

    console.log("[generate-improved-resume] Starting resume improvement generation");
    console.log("[generate-improved-resume] Suggestions count - Additions:", suggestions.additions.length, 
      "Removals:", suggestions.removals.length, "Improvements:", suggestions.improvements.length);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Generate improved resume using Gemini
    const prompt = PromptTemplates.improveResume(resumeText, jobDescription, suggestions, structureAnalysis);

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[generate-improved-resume] API Error:", errorText);
      throw new Error(`AI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const improvedResume = data.choices?.[0]?.message?.content;

    if (!improvedResume) {
      throw new Error("No improved resume content generated");
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
