import { useState } from "react";
import { FileEdit, Loader2, Copy, Check, Download, FileText, Trophy, Target, LayoutGrid } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisResult } from "./AnalyzerSection";
import { generateResumePdf } from "@/lib/resumePdfGenerator";

interface TailoredResumeSectionProps {
  resumeText: string;
  jobDescription: string;
  results: AnalysisResult;
}

interface ResumeScores {
  atsScore: number;
  jdMatchScore?: number;
  structureScore: number;
  feedback?: string;
}

const TailoredResumeSection = ({ resumeText, jobDescription, results }: TailoredResumeSectionProps) => {
  const [tailoredResume, setTailoredResume] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scores, setScores] = useState<ResumeScores | null>(null);

  const handleGenerateTailoredResume = async () => {
    setIsGenerating(true);
    setScores(null);
    try {
      toast({
        title: "Tailoring Your Resume",
        description: "Applying suggestions and validating the result...",
      });

      const allSuggestions = [
        ...results.suggestions.additions,
        ...results.suggestions.improvements,
      ];

      const { data, error } = await supabase.functions.invoke('generate-improved-resume', {
        body: {
          resumeText,
          jobDescription: jobDescription.trim() || null,
          suggestions: allSuggestions,
          structureAnalysis: results.structureAnalysis,
          preserveStructure: true,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to generate tailored resume");
      }

      if (!data?.improvedResume) {
        throw new Error("No tailored resume content received");
      }

      setTailoredResume(data.improvedResume);
      
      // Set scores if available
      if (data.scores) {
        setScores(data.scores);
      }
      
      toast({
        title: "Resume Tailored!",
        description: data.scores 
          ? `Your resume scored ${data.scores.atsScore}% ATS compatibility.`
          : "Your resume has been updated with all suggestions applied.",
      });
    } catch (error) {
      console.error("Failed to generate tailored resume:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate tailored resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!tailoredResume) return;
    
    try {
      await navigator.clipboard.writeText(tailoredResume);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Tailored resume copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please select and copy the text manually.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadTxt = () => {
    if (!tailoredResume) return;
    
    try {
      // Clean up the resume text for download
      const cleanedResume = tailoredResume
        .replace(/^[=\-]{3,}$/gm, '') // Remove separator lines
        .replace(/\n{3,}/g, '\n\n') // Reduce excessive newlines
        .trim();
      
      const blob = new Blob([cleanedResume], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tailored-resume.txt';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast({
        title: "Downloaded!",
        description: "Your tailored resume has been saved as text.",
      });
    } catch (error) {
      console.error("Text download failed:", error);
      toast({
        title: "Download Failed",
        description: "Could not download the resume. Please try copying instead.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPdf = async () => {
    if (!tailoredResume) return;
    
    try {
      toast({
        title: "Generating PDF",
        description: "Creating your professionally formatted resume...",
      });
      
      await generateResumePdf(tailoredResume);
      
      toast({
        title: "PDF Downloaded!",
        description: "Your ATS-friendly resume PDF has been saved.",
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast({
        title: "PDF Generation Failed",
        description: "Please try again or download as text.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-card shadow-card border-border hover-lift animate-slide-up mt-8" style={{ animationDelay: "0.5s" }}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center transition-transform hover:scale-110">
              <FileEdit className="w-5 h-5 text-accent" />
            </div>
            Tailored Resume
          </div>
          {!tailoredResume && (
            <Button
              variant="hero"
              size="sm"
              onClick={handleGenerateTailoredResume}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Tailoring...
                </>
              ) : (
                <>
                  <FileEdit className="w-4 h-4" />
                  Generate Tailored Resume
                </>
              )}
            </Button>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Generate an optimized version of your resume with all suggestions applied, while preserving your original structure and formatting.
        </p>
      </CardHeader>
      <CardContent>
        {!tailoredResume && !isGenerating && (
          <div className="text-center py-12 text-muted-foreground">
            <FileEdit className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Click the button above to generate your tailored resume</p>
            <p className="text-sm mt-2">The AI will apply all suggested improvements while maintaining your original resume structure</p>
          </div>
        )}

        {isGenerating && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
            <p className="text-muted-foreground">Applying suggestions to your resume...</p>
            <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
          </div>
        )}

        {tailoredResume && (
          <div className="space-y-4">
            {/* Score Display */}
            {scores && (
              <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 rounded-xl p-4 border border-primary/20">
                <div className="flex flex-wrap items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ATS Score</p>
                      <p className="text-lg font-bold text-foreground">{scores.atsScore}%</p>
                    </div>
                  </div>
                  {scores.jdMatchScore !== undefined && (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">JD Match</p>
                        <p className="text-lg font-bold text-foreground">{scores.jdMatchScore}%</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <LayoutGrid className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Structure</p>
                      <p className="text-lg font-bold text-foreground">{scores.structureScore}%</p>
                    </div>
                  </div>
                </div>
                {scores.feedback && (
                  <p className="text-xs text-muted-foreground text-center mt-3">{scores.feedback}</p>
                )}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadPdf}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTxt}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Text
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerateTailoredResume}
                disabled={isGenerating}
                className="gap-2"
              >
                <FileEdit className="w-4 h-4" />
                Regenerate
              </Button>
            </div>
            <div className="bg-muted/30 rounded-xl p-6 border border-border max-h-[600px] overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
                {tailoredResume}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TailoredResumeSection;
