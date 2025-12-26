import { Plus, Minus, Lightbulb, CheckCircle, AlertCircle, XCircle, RotateCcw, FileText, Trophy } from "lucide-react";
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
  const overallScore = Math.round((results.atsScore + results.jdMatchScore + results.structureScore) / 3);

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
        return "bg-score-excellent/10 hover:bg-score-excellent/15";
      case "needs-improvement":
        return "bg-score-average/10 hover:bg-score-average/15";
      case "missing":
        return "bg-score-poor/10 hover:bg-score-poor/15";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Overall Score Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 rounded-2xl p-6 md:p-8 border border-primary/20 animate-scale-in">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center shadow-elevated">
              <Trophy className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Overall Resume Score</p>
              <p className="font-display text-3xl font-bold text-foreground">{overallScore}%</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-md text-center md:text-right">
            {overallScore >= 80 
              ? "Excellent! Your resume is well-optimized for ATS systems." 
              : overallScore >= 60 
                ? "Good progress! Follow the suggestions below to improve further."
                : "Your resume needs work. Apply the recommendations to boost your score."}
          </p>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { score: results.atsScore, label: "ATS Score", description: "How well your resume parses through ATS systems", delay: "0s" },
          { score: results.jdMatchScore, label: "JD Match", description: "Keyword and skill alignment with job description", delay: "0.1s" },
          { score: results.structureScore, label: "Structure", description: "Resume format and section organization", delay: "0.2s" },
        ].map((item) => (
          <Card 
            key={item.label}
            className="bg-card shadow-card border-border overflow-hidden hover-lift animate-slide-up"
            style={{ animationDelay: item.delay }}
          >
            <CardContent className="pt-6 pb-6 flex flex-col items-center">
              <ScoreCircle score={item.score} label={item.label} size="lg" />
              <p className="text-sm text-muted-foreground mt-4 text-center">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Suggestions Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Additions */}
        <Card className="bg-card shadow-card border-border hover-lift animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-10 h-10 rounded-xl bg-score-excellent/10 flex items-center justify-center transition-transform hover:scale-110">
                <Plus className="w-5 h-5 text-score-excellent" />
              </div>
              Add to Resume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {results.suggestions.additions.map((item, index) => (
                <li
                  key={index}
                  className="flex gap-3 text-sm text-foreground p-2 rounded-lg hover:bg-muted/50 transition-colors animate-slide-left"
                  style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                >
                  <span className="text-score-excellent mt-0.5 font-bold">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Removals */}
        <Card className="bg-card shadow-card border-border hover-lift animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-10 h-10 rounded-xl bg-score-poor/10 flex items-center justify-center transition-transform hover:scale-110">
                <Minus className="w-5 h-5 text-score-poor" />
              </div>
              Remove from Resume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {results.suggestions.removals.map((item, index) => (
                <li
                  key={index}
                  className="flex gap-3 text-sm text-foreground p-2 rounded-lg hover:bg-muted/50 transition-colors animate-slide-left"
                  style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                >
                  <span className="text-score-poor mt-0.5 font-bold">−</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Improvements */}
        <Card className="bg-card shadow-card border-border hover-lift animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-10 h-10 rounded-xl bg-score-good/10 flex items-center justify-center transition-transform hover:scale-110">
                <Lightbulb className="w-5 h-5 text-score-good" />
              </div>
              Improvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {results.suggestions.improvements.map((item, index) => (
                <li
                  key={index}
                  className="flex gap-3 text-sm text-foreground p-2 rounded-lg hover:bg-muted/50 transition-colors animate-slide-left"
                  style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                >
                  <span className="text-score-good mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Structure Analysis */}
      <Card className="bg-card shadow-card border-border hover-lift animate-slide-up" style={{ animationDelay: "0.4s" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center transition-transform hover:scale-110">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            Resume Structure Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Sections Check */}
            <div>
              <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Section Checklist
              </h4>
              <div className="space-y-2">
                {results.structureAnalysis.sections.map((section, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg transition-all duration-200 cursor-default animate-slide-right",
                      getStatusBg(section.status)
                    )}
                    style={{ animationDelay: `${0.5 + index * 0.05}s` }}
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
              <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                Formatting Recommendations
              </h4>
              <ul className="space-y-3">
                {results.structureAnalysis.formatting.map((tip, index) => (
                  <li 
                    key={index} 
                    className="flex gap-3 text-sm text-muted-foreground p-2 rounded-lg hover:bg-muted/50 transition-colors animate-slide-right"
                    style={{ animationDelay: `${0.6 + index * 0.05}s` }}
                  >
                    <span className="text-primary mt-0.5 font-mono text-xs">{String(index + 1).padStart(2, '0')}</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-center animate-fade-in" style={{ animationDelay: "0.7s" }}>
        <Button 
          variant="outline" 
          size="lg" 
          onClick={onReset} 
          className="gap-2 group hover-lift"
        >
          <RotateCcw className="w-4 h-4 transition-transform group-hover:-rotate-180 duration-500" />
          Analyze Another Resume
        </Button>
      </div>
    </div>
  );
};

export default ResultsSection;