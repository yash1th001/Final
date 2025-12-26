import { Plus, Minus, Lightbulb, CheckCircle, AlertCircle, XCircle, RotateCcw, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import ScoreCircle from "./ScoreCircle";
import { cn } from "@/lib/utils";
import { AnalysisResult } from "./AnalyzerSection";

interface ResultsSectionProps {
  results: AnalysisResult;
  onReset: () => void;
}

const ResultsSection = ({ results, onReset }: ResultsSectionProps) => {
  const getStatusIcon = (status: "good" | "needs-improvement" | "missing") => {
    switch (status) {
      case "good":
        return <CheckCircle className="w-4 h-4 text-score-excellent" />;
      case "needs-improvement":
        return <AlertCircle className="w-4 h-4 text-score-average" />;
      case "missing":
        return <XCircle className="w-4 h-4 text-score-poor" />;
    }
  };

  const getStatusBg = (status: "good" | "needs-improvement" | "missing") => {
    switch (status) {
      case "good":
        return "bg-score-excellent/10";
      case "needs-improvement":
        return "bg-score-average/10";
      case "missing":
        return "bg-score-poor/10";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Score Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-card shadow-card border-border overflow-hidden">
          <CardContent className="pt-6 pb-6 flex flex-col items-center">
            <ScoreCircle score={results.atsScore} label="ATS Score" size="lg" />
            <p className="text-sm text-muted-foreground mt-4 text-center">
              How well your resume parses through ATS systems
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card border-border overflow-hidden">
          <CardContent className="pt-6 pb-6 flex flex-col items-center">
            <ScoreCircle score={results.jdMatchScore} label="JD Match" size="lg" />
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Keyword and skill alignment with job description
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card border-border overflow-hidden">
          <CardContent className="pt-6 pb-6 flex flex-col items-center">
            <ScoreCircle score={results.structureScore} label="Structure" size="lg" />
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Resume format and section organization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Suggestions Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Additions */}
        <Card className="bg-card shadow-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-score-excellent/10 flex items-center justify-center">
                <Plus className="w-4 h-4 text-score-excellent" />
              </div>
              Add to Resume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {results.suggestions.additions.map((item, index) => (
                <li
                  key={index}
                  className="flex gap-3 text-sm text-foreground animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className="text-score-excellent mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Removals */}
        <Card className="bg-card shadow-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-score-poor/10 flex items-center justify-center">
                <Minus className="w-4 h-4 text-score-poor" />
              </div>
              Remove from Resume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {results.suggestions.removals.map((item, index) => (
                <li
                  key={index}
                  className="flex gap-3 text-sm text-foreground animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className="text-score-poor mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Improvements */}
        <Card className="bg-card shadow-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-score-good/10 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-score-good" />
              </div>
              Improvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {results.suggestions.improvements.map((item, index) => (
                <li
                  key={index}
                  className="flex gap-3 text-sm text-foreground animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className="text-score-good mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Structure Analysis */}
      <Card className="bg-card shadow-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            Resume Structure Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Sections Check */}
            <div>
              <h4 className="font-medium text-foreground mb-4">Section Checklist</h4>
              <div className="space-y-2">
                {results.structureAnalysis.sections.map((section, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      getStatusBg(section.status)
                    )}
                  >
                    <span className="text-sm font-medium text-foreground">{section.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground capitalize">
                        {section.status.replace("-", " ")}
                      </span>
                      {getStatusIcon(section.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formatting Tips */}
            <div>
              <h4 className="font-medium text-foreground mb-4">Formatting Recommendations</h4>
              <ul className="space-y-3">
                {results.structureAnalysis.formatting.map((tip, index) => (
                  <li key={index} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5">→</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-center">
        <Button variant="outline" size="lg" onClick={onReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Analyze Another Resume
        </Button>
      </div>
    </div>
  );
};

export default ResultsSection;
