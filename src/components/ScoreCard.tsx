import { useState } from "react";
import { ChevronDown, ChevronUp, Target, FileCheck, Layout, Lightbulb } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";

interface ScoreCardProps {
  score: number;
  label: string;
  description: string;
  tips: string[];
  delay?: string;
}

const ScoreCard = ({ score, label, description, tips, delay = "0s" }: ScoreCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);

  // Animate score on mount
  useState(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-accent";
    if (score >= 60) return "text-primary";
    if (score >= 40) return "text-score-average";
    return "text-destructive";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-accent";
    if (score >= 60) return "bg-primary";
    if (score >= 40) return "bg-score-average";
    return "bg-destructive";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-accent/20 to-accent/5";
    if (score >= 60) return "from-primary/20 to-primary/5";
    if (score >= 40) return "from-score-average/20 to-score-average/5";
    return "from-destructive/20 to-destructive/5";
  };

  const getIcon = () => {
    switch (label) {
      case "ATS Score":
        return <Target className="w-5 h-5" />;
      case "JD Match":
        return <FileCheck className="w-5 h-5" />;
      case "Structure":
        return <Layout className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  return (
    <Card 
      className={cn(
        "bg-card border-border overflow-hidden transition-all duration-300 cursor-pointer group",
        isExpanded ? "shadow-elevated" : "shadow-card hover:shadow-card-hover hover-lift",
        "animate-slide-up"
      )}
      style={{ animationDelay: delay }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardContent className="p-0">
        {/* Score Header */}
        <div className={cn(
          "p-6 bg-gradient-to-br transition-all duration-300",
          getScoreGradient(score)
        )}>
          <div className="flex items-start justify-between mb-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
              getScoreBgColor(score),
              "text-primary-foreground"
            )}>
              {getIcon()}
            </div>
            <div className={cn(
              "flex items-center gap-1 text-muted-foreground transition-colors",
              isExpanded && "text-foreground"
            )}>
              <span className="text-xs font-medium">
                {isExpanded ? "Hide tips" : "Show tips"}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>

          {/* Score Display */}
          <div className="flex items-end gap-3 mb-2">
            <span className={cn(
              "font-display text-5xl font-bold tabular-nums transition-all duration-300",
              getScoreColor(score)
            )}>
              {displayScore}
            </span>
            <span className="text-muted-foreground text-lg mb-1">/100</span>
          </div>

          {/* Label & Description */}
          <h3 className="font-display text-lg font-semibold text-foreground mb-1">
            {label}
          </h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>

          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-muted/50 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-out",
                getScoreBgColor(score)
              )}
              style={{ width: `${displayScore}%` }}
            />
          </div>
        </div>

        {/* Expandable Tips Section */}
        <div className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="p-6 pt-4 border-t border-border/50 bg-muted/30">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-primary" />
              <h4 className="font-medium text-foreground text-sm">
                Improvement Tips
              </h4>
            </div>
            <ul className="space-y-3">
              {tips.map((tip, index) => (
                <li 
                  key={index}
                  className={cn(
                    "flex gap-3 text-sm text-muted-foreground p-2 rounded-lg hover:bg-background/50 transition-colors",
                    isExpanded && "animate-slide-left"
                  )}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <span className={cn(
                    "mt-0.5 font-mono text-xs",
                    getScoreColor(score)
                  )}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreCard;
