import { ArrowDown, FileSearch, Target, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
            <Target className="w-4 h-4" />
            AI-Powered Resume Analysis
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-slide-up leading-tight">
            Land Your Dream Job with{" "}
            <span className="gradient-hero bg-clip-text text-transparent">
              ATS-Optimized
            </span>{" "}
            Resumes
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Get instant feedback on your resume's ATS compatibility, job description match, 
            and actionable improvements to boost your chances of getting noticed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" size="xl" asChild>
              <a href="#analyzer">
                <FileSearch className="w-5 h-5" />
                Analyze My Resume
              </a>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <a href="#guide">
                <TrendingUp className="w-5 h-5" />
                Resume Best Practices
              </a>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-foreground">95%</p>
              <p className="text-sm text-muted-foreground">Accuracy Rate</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-foreground">10K+</p>
              <p className="text-sm text-muted-foreground">Resumes Analyzed</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-foreground">2x</p>
              <p className="text-sm text-muted-foreground">Interview Rate</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-12 animate-pulse-slow">
          <ArrowDown className="w-6 h-6 text-muted-foreground" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
