import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// LANGCHAIN-INSPIRED CONVERSATIONAL CHAIN
// ============================================

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  message: string;
  resumeText: string;
  jobDescription: string;
  analysisResults: AnalysisResults;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

interface AnalysisResults {
  atsScore: number;
  jdMatchScore: number;
  structureScore: number;
  candidateContext?: {
    name: string;
    currentRole: string;
    yearsExperience: string;
    topSkills: string[];
  };
  keyFindings?: {
    strongMatches: string[];
    criticalGaps: string[];
    quickWins: string[];
  };
  suggestions: {
    additions: string[];
    removals: string[];
    improvements: string[];
  };
  priorityActions?: Array<{
    priority: number;
    action: string;
    impact: string;
  }>;
}

// ============================================
// MEMORY MANAGEMENT (LangChain-style)
// ============================================

interface ConversationMemory {
  messages: Message[];
  context: {
    resumeText: string;
    jobDescription: string;
    analysisResults: AnalysisResults;
  };
  summaryBuffer?: string;
}

const createMemory = (
  resumeText: string,
  jobDescription: string,
  analysisResults: AnalysisResults,
  history: Array<{ role: "user" | "assistant"; content: string }> = []
): ConversationMemory => {
  return {
    messages: history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    context: {
      resumeText,
      jobDescription,
      analysisResults,
    },
  };
};

// Summarize long conversations to stay within context limits
const summarizeIfNeeded = (memory: ConversationMemory): string => {
  if (memory.messages.length <= 6) {
    return ""; // No summary needed for short conversations
  }
  
  // Create a brief summary of earlier messages
  const earlierMessages = memory.messages.slice(0, -4);
  const summary = earlierMessages
    .map((m) => `${m.role}: ${m.content.substring(0, 100)}...`)
    .join("\n");
  
  return `Previous conversation summary:\n${summary}\n\n`;
};

// ============================================
// PROMPT TEMPLATES (LangChain-style)
// ============================================

const PromptTemplates = {
  systemPrompt: (memory: ConversationMemory): string => {
    const { context } = memory;
    const candidate = context.analysisResults.candidateContext;
    const findings = context.analysisResults.keyFindings;
    const priorities = context.analysisResults.priorityActions;
    
    return `You are an expert career coach and resume consultant. You have deep knowledge of ATS systems, hiring practices, and resume optimization.

## YOUR KNOWLEDGE BASE FOR THIS CONVERSATION:

### CANDIDATE PROFILE:
${candidate ? `
- Name: ${candidate.name}
- Current Role: ${candidate.currentRole}
- Experience: ${candidate.yearsExperience}
- Top Skills: ${candidate.topSkills?.join(", ") || "Not specified"}
` : "Not yet extracted"}

### ANALYSIS SCORES:
- ATS Compatibility: ${context.analysisResults.atsScore}/100
- Job Match: ${context.analysisResults.jdMatchScore}/100
- Structure: ${context.analysisResults.structureScore}/100

### KEY FINDINGS:
${findings ? `
Strong Matches: ${findings.strongMatches?.join("; ") || "None identified"}
Critical Gaps: ${findings.criticalGaps?.join("; ") || "None identified"}
Quick Wins: ${findings.quickWins?.join("; ") || "None identified"}
` : "Not yet analyzed"}

### PRIORITY ACTIONS:
${priorities?.map((p) => `${p.priority}. [${p.impact}] ${p.action}`).join("\n") || "Not yet prioritized"}

### SUGGESTED CHANGES:
Additions: ${context.analysisResults.suggestions.additions.join("; ")}
Removals: ${context.analysisResults.suggestions.removals.join("; ")}
Improvements: ${context.analysisResults.suggestions.improvements.join("; ")}

### FULL RESUME TEXT (for specific references):
${context.resumeText}

### TARGET JOB DESCRIPTION:
${context.jobDescription || "No job description provided - focus on general resume best practices and ATS optimization."}

## CONVERSATION GUIDELINES:

1. **Be Specific**: Always reference exact content from the resume or JD when giving advice
2. **Be Actionable**: Provide step-by-step guidance, not vague suggestions
3. **Be Honest**: If something is a weakness, explain why and how to address it
4. **Prioritize**: Help the candidate focus on high-impact changes first
5. **Educate**: Explain the "why" behind ATS and hiring practices
6. **Be Concise**: Keep responses focused (2-4 paragraphs unless detailed guidance is needed)

## RESPONSE PATTERNS:

- When asked "why": Explain the reasoning with industry context
- When asked "how": Provide step-by-step implementation guidance
- When asked "what": Give specific, quoted examples from their resume
- When asked to "rewrite": Provide before/after examples
- When asked about priorities: Reference the priority actions list

Remember: You're a supportive coach. Be encouraging while being honest about areas for improvement.`;
  },

  // Intent classifier to route responses appropriately
  intentClassification: `Classify the user's intent into one of these categories:
- CLARIFICATION: Asking about a specific suggestion or score
- HOW_TO: Asking how to implement a change
- REWRITE_REQUEST: Asking you to rewrite a specific section
- PRIORITY: Asking what to focus on first
- GENERAL: General question or conversation
- COMPARISON: Comparing options or approaches

User message: {message}

Return only the category name, nothing else.`,

  // Specialized response templates based on intent
  rewriteTemplate: `The user wants you to rewrite a section of their resume.

Their request: {message}

Original text from resume: {originalText}

Provide:
1. The improved version (be specific and actionable)
2. Brief explanation of why this is better
3. Key keywords/phrases you incorporated from the JD`,

  howToTemplate: `The user wants step-by-step guidance.

Their request: {message}

Provide:
1. Clear numbered steps
2. Specific examples from their resume
3. What the end result should look like`,
};

// ============================================
// CHAIN EXECUTORS
// ============================================

const callLLM = async (
  apiKey: string,
  messages: Message[],
  model: string = "google/gemini-2.5-flash"
): Promise<string> => {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 429) throw new Error("RATE_LIMIT");
    if (status === 402) throw new Error("PAYMENT_REQUIRED");
    throw new Error(`LLM call failed: ${status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
};

// Main conversational chain
const conversationalChain = async (
  apiKey: string,
  userMessage: string,
  memory: ConversationMemory
): Promise<string> => {
  console.log("[ConversationalChain] Processing message...");
  
  // Build messages array with memory
  const conversationSummary = summarizeIfNeeded(memory);
  const systemPrompt = PromptTemplates.systemPrompt(memory);
  
  const messages: Message[] = [
    { role: "system", content: systemPrompt },
  ];

  // Add conversation summary if needed
  if (conversationSummary) {
    messages.push({
      role: "system",
      content: conversationSummary,
    });
  }

  // Add recent conversation history (last 4 exchanges)
  const recentHistory = memory.messages.slice(-8);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    });
  }

  // Add current user message
  messages.push({
    role: "user",
    content: userMessage,
  });

  console.log("[ConversationalChain] Message count:", messages.length);

  const response = await callLLM(apiKey, messages);
  return response;
};

// ============================================
// HTTP HANDLER
// ============================================

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
      conversationHistory = [],
    }: ChatRequest = await req.json();

    if (!message || !resumeText || !analysisResults) {
      return new Response(
        JSON.stringify({
          error: "Message, resume, and analysis results are required",
        }),
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
    console.log("Conversation history length:", conversationHistory.length);

    // Initialize memory with context and history
    const memory = createMemory(
      resumeText,
      jobDescription,
      analysisResults,
      conversationHistory
    );

    // Run conversational chain
    const reply = await conversationalChain(LOVABLE_API_KEY, message, memory);

    console.log("Chat response generated successfully");

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in resume-chat function:", error);

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
      JSON.stringify({ error: "Failed to process your question. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
