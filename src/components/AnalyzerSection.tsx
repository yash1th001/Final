import { useState } from "react";
import { Sparkles, Loader2, Brain, Zap } from "lucide-react";
import { Button } from "./ui/button";
import FileUpload from "./FileUpload";
import TextInput from "./TextInput";
import ResultsSection from "./ResultsSection";
import ResumeChat from "./ResumeChat";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { extractTextFromPDF, isValidPDFFile } from "@/lib/pdfParser";
export interface AnalysisResult {
  atsScore: number;
  jdMatchScore: number;
  structureScore: number;
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

    if (!jobDescription.trim()) {
      toast({
        title: "Missing Job Description",
        description: "Please paste the job description for matching analysis.",
        variant: "destructive",
      });
      return;
    }

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
          jobDescription: jobDescription.trim(),
        },
      });

      if (error) {
        console.error("Analysis error:", error);
        throw new Error(error.message || "Failed to analyze resume");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResults(data as AnalysisResult);
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

  const resetAnalysis = () => {
    setResults(null);
    setResumeFile(null);
    setResumeText("");
    setJobDescription("");
  };

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
            Upload your resume and paste the job description to get instant ATS score and improvement suggestions.
          </p>
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
                    label="Job Description"
                    placeholder="Paste the job description here for matching analysis..."
                    value={jobDescription}
                    onChange={setJobDescription}
                    rows={16}
                  />
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
                {["ATS Score", "JD Match", "Suggestions", "Structure Analysis"].map((feature) => (
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
            <ResultsSection results={results} onReset={resetAnalysis} />
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