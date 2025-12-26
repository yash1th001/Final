import { useState } from "react";
import { Sparkles, Loader2, Brain, Zap } from "lucide-react";
import { Button } from "./ui/button";
import FileUpload from "./FileUpload";
import TextInput from "./TextInput";
import ResultsSection from "./ResultsSection";
import { toast } from "@/hooks/use-toast";

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
}

const AnalyzerSection = () => {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);

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

    // Simulate API call - Replace with actual backend call
    setTimeout(() => {
      const mockResults: AnalysisResult = {
        atsScore: 72,
        jdMatchScore: 65,
        structureScore: 78,
        suggestions: {
          additions: [
            "Add specific metrics and quantifiable achievements (e.g., 'Increased sales by 30%')",
            "Include relevant technical skills mentioned in the JD: Python, AWS, Docker",
            "Add a professional summary section highlighting key qualifications",
            "Include certifications relevant to the role",
          ],
          removals: [
            "Remove personal pronouns ('I', 'my', 'me')",
            "Eliminate graphics, images, or complex formatting",
            "Remove outdated skills or irrelevant experience (>10 years old)",
            "Remove generic phrases like 'responsible for' - use action verbs instead",
          ],
          improvements: [
            "Use stronger action verbs: 'Developed' → 'Architected', 'Worked' → 'Spearheaded'",
            "Ensure consistent date formatting throughout",
            "Align experience section with JD requirements more closely",
            "Improve keyword density for: 'machine learning', 'data analysis'",
          ],
        },
        structureAnalysis: {
          sections: [
            { name: "Contact Information", status: "good" },
            { name: "Professional Summary", status: "missing" },
            { name: "Work Experience", status: "good" },
            { name: "Education", status: "good" },
            { name: "Skills", status: "needs-improvement" },
            { name: "Certifications", status: "missing" },
          ],
          formatting: [
            "Use a single-column layout for better ATS parsing",
            "Ensure font size is between 10-12pt for body text",
            "Use standard section headings (Education, Experience, Skills)",
            "Keep resume length to 1-2 pages maximum",
          ],
        },
      };

      setResults(mockResults);
      setIsAnalyzing(false);
      toast({
        title: "Analysis Complete!",
        description: "Your resume has been analyzed. Check out the results below.",
      });
    }, 2500);
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
                    label="Upload Resume"
                    onFileSelect={setResumeFile}
                    file={resumeFile}
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
          <ResultsSection results={results} onReset={resetAnalysis} />
        )}
      </div>
    </section>
  );
};

export default AnalyzerSection;