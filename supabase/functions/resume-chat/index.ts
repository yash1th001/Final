import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  message: string;
  resumeText: string;
  jobDescription: string;
  analysisResults: {
    atsScore: number;
    jdMatchScore: number;
    structureScore: number;
    suggestions: {
      additions: string[];
      removals: string[];
      improvements: string[];
    };
  };
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      message, 
      resumeText, 
      jobDescription, 
      analysisResults,
      conversationHistory = []
    }: ChatRequest = await req.json();

    if (!message || !resumeText || !jobDescription || !analysisResults) {
      return new Response(
        JSON.stringify({ error: "Message, resume, job description, and analysis results are required" }),
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

    console.log("Processing chat message:", message.substring(0, 50) + "...");

    const systemPrompt = `You are a friendly and knowledgeable career coach assistant helping a candidate improve their resume. You have access to their complete resume, the job description they're targeting, and the analysis results.

## CONTEXT YOU HAVE ACCESS TO:

### THE CANDIDATE'S RESUME:
${resumeText}

### THE TARGET JOB DESCRIPTION:
${jobDescription}

### ANALYSIS RESULTS:
- ATS Score: ${analysisResults.atsScore}/100
- JD Match Score: ${analysisResults.jdMatchScore}/100
- Structure Score: ${analysisResults.structureScore}/100

Suggested Additions: ${analysisResults.suggestions.additions.join("; ")}
Suggested Removals: ${analysisResults.suggestions.removals.join("; ")}
Suggested Improvements: ${analysisResults.suggestions.improvements.join("; ")}

## YOUR ROLE:
1. Answer questions about the analysis results
2. Explain WHY certain suggestions were made
3. Help the candidate understand how to implement changes
4. Provide specific, actionable advice based on their actual resume content
5. Clarify any doubts about ATS optimization
6. Help prioritize which changes to make first
7. Explain industry-specific best practices

## GUIDELINES:
- Be conversational and supportive
- Always reference specific content from their resume when giving advice
- If asked about a suggestion, explain the reasoning with examples
- Provide step-by-step guidance when asked how to implement a change
- Be honest about trade-offs and priorities
- If you're unsure about something specific to their industry, say so
- Keep responses concise but helpful (aim for 2-4 paragraphs unless more detail is needed)`;

    // Build messages array with conversation history
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
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
        JSON.stringify({ error: "Failed to process your question. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      console.error("No content in AI response:", data);
      return new Response(
        JSON.stringify({ error: "No response generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Chat response generated successfully");
    
    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in resume-chat function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
