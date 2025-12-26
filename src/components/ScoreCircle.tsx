import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ScoreCircleProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
}

const ScoreCircle = ({ score, label, size = "md" }: ScoreCircleProps) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // Animate score counting up
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
  }, [score]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-score-excellent";
    if (score >= 60) return "text-score-good";
    if (score >= 40) return "text-score-average";
    return "text-score-poor";
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return "stroke-score-excellent";
    if (score >= 60) return "stroke-score-good";
    if (score >= 40) return "stroke-score-average";
    return "stroke-score-poor";
  };

  const getScoreGlow = (score: number) => {
    if (score >= 80) return "drop-shadow-[0_0_15px_hsl(160_84%_39%/0.4)]";
    if (score >= 60) return "drop-shadow-[0_0_15px_hsl(48_96%_53%/0.4)]";
    if (score >= 40) return "drop-shadow-[0_0_15px_hsl(38_92%_50%/0.4)]";
    return "drop-shadow-[0_0_15px_hsl(0_84%_60%/0.4)]";
  };

  const sizeClasses = {
    sm: { container: "w-20 h-20", text: "text-xl", label: "text-xs" },
    md: { container: "w-28 h-28", text: "text-3xl", label: "text-sm" },
    lg: { container: "w-36 h-36", text: "text-4xl", label: "text-base" },
  };

  const radius = size === "lg" ? 60 : size === "md" ? 48 : 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className={cn(
      "flex flex-col items-center gap-2 transition-all duration-500",
      isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
    )}>
      <div className={cn("relative group", sizeClasses[size].container)}>
        <svg 
          className={cn(
            "w-full h-full -rotate-90 transition-all duration-300",
            getScoreGlow(displayScore)
          )} 
          viewBox="0 0 140 140"
        >
          {/* Background circle with subtle pattern */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/50"
          />
          {/* Progress circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn(
              "transition-all duration-1000 ease-out",
              getScoreRingColor(displayScore)
            )}
            style={{
              filter: "drop-shadow(0 0 6px currentColor)",
            }}
          />
        </svg>
        
        {/* Center content with hover effect */}
        <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-110">
          <span className={cn(
            "font-display font-bold tabular-nums transition-all duration-300",
            sizeClasses[size].text, 
            getScoreColor(displayScore)
          )}>
            {displayScore}
          </span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
        
        {/* Decorative ring on hover */}
        <div className={cn(
          "absolute inset-0 rounded-full border-2 border-primary/0 transition-all duration-300",
          "group-hover:border-primary/20 group-hover:scale-110"
        )} />
      </div>
      
      <p className={cn(
        "font-medium text-muted-foreground transition-colors duration-300 group-hover:text-foreground",
        sizeClasses[size].label
      )}>
        {label}
      </p>
    </div>
  );
};

export default ScoreCircle;