import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalysisRequest {
  resumeText: string;
  jobDescription: string;
}

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

    console.log("Starting resume analysis...");
    console.log("Resume length:", resumeText.length, "chars");
    console.log("JD length:", jobDescription.length, "chars");

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyst and career coach. Your job is to analyze resumes against job descriptions and provide actionable, personalized feedback.

IMPORTANT: You must return a valid JSON object with this exact structure:
{
  "atsScore": <number 0-100>,
  "jdMatchScore": <number 0-100>,
  "structureScore": <number 0-100>,
  "suggestions": {
    "additions": [<array of specific things to add based on the JD>],
    "removals": [<array of specific things to remove or modify>],
    "improvements": [<array of specific improvements to make>]
  },
  "structureAnalysis": {
    "sections": [
      {"name": "<section name>", "status": "<good|needs-improvement|missing>"}
    ],
    "formatting": [<array of formatting recommendations>]
  }
}

Scoring Guidelines:
- ATS Score: How well the resume will parse in ATS systems (formatting, keywords, structure)
- JD Match Score: How well skills/experience match the job description requirements
- Structure Score: How well organized and formatted the resume is

Be SPECIFIC and PERSONALIZED:
- Reference actual content from the resume
- Reference specific requirements from the job description
- Suggest exact keywords from the JD that are missing
- Point out specific sections that need improvement
- Give actionable advice, not generic tips`;

    const userPrompt = `Analyze this resume against the job description:

=== RESUME ===
${resumeText}

=== JOB DESCRIPTION ===
${jobDescription}

Provide a detailed, personalized analysis. Reference specific content from both documents in your suggestions.`;

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
      console.log("Analysis complete. ATS Score:", analysisResult.atsScore);
      
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
