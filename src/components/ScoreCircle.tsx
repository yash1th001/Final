import { cn } from "@/lib/utils";

interface ScoreCircleProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
}

const ScoreCircle = ({ score, label, size = "md" }: ScoreCircleProps) => {
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

  const sizeClasses = {
    sm: { container: "w-20 h-20", text: "text-xl", label: "text-xs" },
    md: { container: "w-28 h-28", text: "text-3xl", label: "text-sm" },
    lg: { container: "w-36 h-36", text: "text-4xl", label: "text-base" },
  };

  const radius = size === "lg" ? 60 : size === "md" ? 48 : 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn("relative", sizeClasses[size].container)}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn("transition-all duration-1000 ease-out", getScoreRingColor(score))}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-display font-bold", sizeClasses[size].text, getScoreColor(score))}>
            {score}
          </span>
        </div>
      </div>
      <p className={cn("font-medium text-muted-foreground", sizeClasses[size].label)}>{label}</p>
    </div>
  );
};

export default ScoreCircle;
