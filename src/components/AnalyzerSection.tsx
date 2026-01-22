import { useState } from "react";
import { Sparkles, Loader2, Brain, Zap } from "lucide-react";
import { Button } from "./ui/button";
import FileUpload from "./FileUpload";
import TextInput from "./TextInput";
import ResultsSection from "./ResultsSection";
import ResumeChat from "./ResumeChat";
import TailoredResumeSection from "./TailoredResumeSection";
import LoginPrompt from "./LoginPrompt";
import AnalysisHistory from "./AnalysisHistory";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { extractTextFromPDF, isValidPDFFile } from "@/lib/pdfParser";

export interface AnalysisResult {
  atsScore: number;
  jdMatchScore?: number;
  structureScore: number;
  hasJobDescription: boolean;
  suggestions: {
    additions: string[];
    removals: string[];
    improvements: string[];
  };
  structureAnalysis: {
    sections: { name: string; status: "good" | "needs-improvement" | "missing" }[];
    formatting: string[];
  };
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
}

const AnalyzerSection = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);

  const handleFileSelect = async (file: File | null) => {
    setResumeFile(file);
    
    if (file && isValidPDFFile(file)) {
      setIsParsing(true);
      try {
        const text = await extractTextFromPDF(file);
        setResumeText(text);
        toast({
          title: "PDF Parsed Successfully",
          description: `Extracted ${text.length} characters from your resume.`,
        });
      } catch (error) {
        console.error("PDF parsing error:", error);
        toast({
          title: "PDF Parsing Failed",
          description: "Could not extract text from PDF. Please paste your resume text manually.",
          variant: "destructive",
        });
      } finally {
        setIsParsing(false);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!resumeFile && !resumeText.trim()) {
      toast({
        title: "Missing Resume",
        description: "Please upload a resume file or paste your resume text.",
        variant: "destructive",
      });
      return;
    }

    // Job description is now optional

    setIsAnalyzing(true);

    try {
      // Get resume text - either from parsed PDF or manual input
      let finalResumeText = resumeText.trim();
      
      if (!finalResumeText && resumeFile) {
        // If we have a file but no text, try to parse it
        if (isValidPDFFile(resumeFile)) {
          finalResumeText = await extractTextFromPDF(resumeFile);
        } else {
          toast({
            title: "Unsupported File",
            description: "Please upload a PDF file or paste your resume text.",
            variant: "destructive",
          });
          setIsAnalyzing(false);
          return;
        }
      }

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          resumeText: finalResumeText,
          jobDescription: jobDescription.trim() || null,
        },
      });

      if (error) {
        console.error("Analysis error:", error);
        throw new Error(error.message || "Failed to analyze resume");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const analysisResult = data as AnalysisResult;
      setResults(analysisResult);

      // Save to database
      if (user) {
        await saveAnalysisToHistory(finalResumeText, analysisResult);
      }

      toast({
        title: "Analysis Complete!",
        description: "Your resume has been analyzed with AI. Check out the personalized results below.",
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveAnalysisToHistory = async (resumeTextToSave: string, analysisResult: AnalysisResult) => {
    try {
      await (supabase as any).from("resume_analyses").insert({
        user_id: user?.id,
        resume_text: resumeTextToSave,
        job_description: jobDescription.trim() || null,
        ats_score: analysisResult.atsScore,
        jd_match_score: analysisResult.jdMatchScore ?? null,
        structure_score: analysisResult.structureScore,
        suggestions: analysisResult.suggestions,
        structure_analysis: analysisResult.structureAnalysis,
        candidate_context: analysisResult.candidateContext ?? null,
      });
    } catch (error) {
      console.error("Failed to save analysis:", error);
    }
  };

  const resetAnalysis = () => {
    setResults(null);
    setResumeFile(null);
    setResumeText("");
    setJobDescription("");
  };

  const handleLoadAnalysis = (result: AnalysisResult, loadedResumeText: string, loadedJobDescription: string) => {
    setResults(result);
    setResumeText(loadedResumeText);
    setJobDescription(loadedJobDescription);
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <section id="analyzer" className="py-16 lg:py-24">
        <div className="container mx-auto px-4 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <section id="analyzer" className="py-16 lg:py-24 relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <Brain className="w-3.5 h-3.5" />
              Powered by AI
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Resume Analyzer
            </h2>
            <p className="text-muted-foreground text-lg">
              Sign in to analyze your resume and track your progress.
            </p>
          </div>
          <LoginPrompt />
        </div>
      </section>
    );
  }

  return (
    <section id="analyzer" className="py-16 lg:py-24 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Brain className="w-3.5 h-3.5" />
            Powered by AI
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Resume Analyzer
          </h2>
          <p className="text-muted-foreground text-lg">
            Upload your resume to get instant ATS score. Add a job description for JD match analysis.
          </p>
          
          {/* History button */}
          <div className="mt-4">
            <AnalysisHistory onLoadAnalysis={handleLoadAnalysis} />
          </div>
        </div>

        {!results ? (
          <div className="max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 p-6 md:p-8 border border-border card-shine">
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-6">
                  <FileUpload
                    label="Upload Resume (PDF)"
                    onFileSelect={handleFileSelect}
                    file={resumeFile}
                    isLoading={isParsing}
                  />
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground font-medium">OR</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <TextInput
                    label="Paste Resume Text"
                    placeholder="Paste your resume content here..."
                    value={resumeText}
                    onChange={setResumeText}
                    rows={8}
                  />
                </div>

                <div>
                  <TextInput
                    label="Job Description (Optional)"
                    placeholder="Paste the job description here for JD match analysis..."
                    value={jobDescription}
                    onChange={setJobDescription}
                    rows={16}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Add a job description to get JD match score and tailored suggestions.
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="hero"
                  size="xl"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="min-w-[220px] group relative overflow-hidden"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="animate-pulse">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12" />
                      Analyze Resume
                      <Zap className="w-4 h-4 absolute right-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0 translate-x-2" />
                    </>
                  )}
                </Button>
              </div>
              
              {/* Feature hints */}
              <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-muted-foreground">
                {["ATS Score", "Structure Analysis", "Suggestions", jobDescription.trim() ? "JD Match" : ""].filter(Boolean).map((feature) => (
                  <span key={feature} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <ResultsSection 
              results={results} 
              resumeText={resumeText}
              jobDescription={jobDescription}
              onReset={resetAnalysis} 
            />
            <TailoredResumeSection
              resumeText={resumeText}
              jobDescription={jobDescription}
              results={results}
            />
            <ResumeChat 
              resumeText={resumeText} 
              jobDescription={jobDescription} 
              analysisResults={results}
            />
          </>
        )}
      </div>
    </section>
  );
};

export default AnalyzerSection;