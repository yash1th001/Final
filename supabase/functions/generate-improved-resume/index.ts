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
You are an expert resume writer specializing in ATS-optimized, LaTeX-style professional resumes. Your task is to create a perfectly structured resume.

## ORIGINAL RESUME:
${resumeText}

${jobDescription ? `## TARGET JOB DESCRIPTION:\n${jobDescription}` : '## NOTE: No specific job description provided. Focus on general ATS optimization.'}

## SUGGESTIONS TO APPLY:
${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

${formatting.length > 0 ? `## FORMATTING RECOMMENDATIONS:\n${formatting.map((f, i) => `${i + 1}. ${f}`).join('\n')}` : ''}

## YOUR TASK:
Create a professionally formatted resume that:
1. Applies all the recommended improvements and additions
2. Uses strong action verbs and quantifiable achievements
3. Is optimized for ATS parsing
${jobDescription ? '4. Is tailored for the target job description' : '4. Maintains strong general appeal'}
5. Has clean, consistent formatting throughout

## REQUIRED OUTPUT FORMAT (ATS-Optimized LaTeX-Style Resume):

IMPORTANT FORMATTING RULES:
- Use EXACT format shown below - this ensures proper PDF generation
- All links must be on their own line in format: Link: https://example.com
- Section headers MUST be in UPPERCASE
- Use bullet points (•) for all list items
- Keep consistent spacing and alignment
- Right-align dates using spaces (don't use pipe for date alignment)

===============================================================================
FULL NAME
Phone: +1-234-567-8901 | Email: name@email.com
LinkedIn: https://linkedin.com/in/username | GitHub: https://github.com/username
===============================================================================

OBJECTIVE
---------
[2-3 sentence professional summary that highlights key skills and career goals. Should be specific and tailored to the role.]

EDUCATION
---------
University/Institution Name                                    City, State/Country
Degree Name (Major) - GPA: X.XX/4.0                           Month Year - Month Year
• Relevant coursework: Course 1, Course 2, Course 3
• Academic achievements or honors if any

EXPERIENCE
----------
Company Name                                                   City, State/Country
Job Title                                                      Month Year - Present
• [Action verb] + [Task/Responsibility] + [Result/Impact with metrics]
• Achieved [X% improvement/growth] in [area] by implementing [solution]
• Led/Managed/Developed [project/team] resulting in [quantifiable outcome]

PROJECTS
--------
Project Name                                                   Month Year
Technologies: Python, TensorFlow, React, PostgreSQL
• [What you built and its purpose]
• [Key technical feature or challenge solved]
• [Impact or result - users, performance, metrics]
• Link: https://github.com/username/project-name

Another Project                                                Month Year
Technologies: Node.js, MongoDB, Docker, AWS
• [Description of the project]
• [Technical implementation details]
• Link: https://live-demo-url.com

SKILLS
------
Programming Languages: Python, JavaScript, TypeScript, Java, C++
Frameworks & Libraries: React, Node.js, TensorFlow, PyTorch, Express.js
Databases: PostgreSQL, MongoDB, Redis, MySQL
Cloud & DevOps: AWS, Docker, Kubernetes, CI/CD, Git
Soft Skills: Leadership, Communication, Problem-solving, Team Collaboration

CERTIFICATIONS
--------------
• Certification Name - Issuing Organization (Month Year)
• Another Certification - Organization (Month Year)

ACHIEVEMENTS
------------
• [Specific achievement with context and measurable impact]
• [Award or recognition with details]

## CRITICAL REQUIREMENTS:
1. ALL URLs must be on their own line with format "Link: https://..."
2. LinkedIn and GitHub URLs must be on the header line
3. Phone should use format: Phone: +X-XXX-XXX-XXXX
4. Email should use format: Email: name@domain.com
5. Technologies for projects must be on their own line: "Technologies: tech1, tech2, tech3"
6. Section headers in UPPERCASE followed by a line of dashes (---------)
7. Use bullet points (•) for all list items
8. Dates should be right-aligned (use natural language spacing)
9. Keep to single page if possible by being concise

## OUTPUT:
Return ONLY the resume text in the exact format shown above.
Do NOT include explanations, markdown (no ** or ##), or code blocks.
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
              temperature: 0.3,
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

    // Clean up the resume text
    improvedResume = improvedResume
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/^#+\s*/gm, '') // Remove markdown headers
      .trim();

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
      // Also try to extract JSON directly if no code block
      const directJsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (directJsonMatch) {
        jsonContent = directJsonMatch[0];
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
