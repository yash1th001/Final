import { ArrowDown, FileSearch, Target, TrendingUp, Sparkles, Zap, Shield } from "lucide-react";
import { Button } from "./ui/button";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Animated Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
        
        {/* Floating decorative elements */}
        <div className="absolute top-32 right-[15%] w-16 h-16 border border-primary/20 rounded-2xl rotate-12 animate-float opacity-60" />
        <div className="absolute bottom-32 left-[10%] w-12 h-12 bg-accent/10 rounded-xl -rotate-12 animate-float-delayed opacity-60" />
        <div className="absolute top-40 left-[20%] w-8 h-8 bg-primary/20 rounded-full animate-bounce-subtle opacity-40" />
        <div className="absolute bottom-40 right-[20%] w-6 h-6 bg-accent/30 rounded-full animate-bounce-subtle opacity-50" style={{ animationDelay: '1s' }} />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge with glow */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in hover-glow cursor-default border border-primary/20">
            <Target className="w-4 h-4 animate-pulse-slow" />
            AI-Powered Resume Analysis
            <Sparkles className="w-4 h-4" />
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold text-foreground mb-6 animate-slide-up leading-tight">
            Land Your Dream Job with{" "}
            <span className="relative inline-block">
              <span className="text-gradient animate-gradient bg-[length:200%_200%]">
                ATS-Optimized
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent rounded-full transform scale-x-0 animate-[scaleX_0.8s_ease-out_0.5s_forwards] origin-left" />
            </span>{" "}
            Resumes
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up leading-relaxed" style={{ animationDelay: "0.15s" }}>
            Get instant feedback on your resume's ATS compatibility, job description match, 
            and actionable improvements to boost your chances of getting noticed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up" style={{ animationDelay: "0.25s" }}>
            <Button variant="hero" size="xl" asChild className="group hover-glow">
              <a href="#analyzer">
                <FileSearch className="w-5 h-5 transition-transform group-hover:rotate-12" />
                Analyze My Resume
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
              </a>
            </Button>
            <Button variant="outline" size="xl" asChild className="group hover-lift">
              <a href="#guide">
                <TrendingUp className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                Resume Best Practices
              </a>
            </Button>
          </div>

          {/* Stats with enhanced styling */}
          <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto animate-slide-up" style={{ animationDelay: "0.35s" }}>
            {[
              { value: "95%", label: "Accuracy Rate", icon: Shield },
              { value: "10K+", label: "Resumes Analyzed", icon: FileSearch },
              { value: "2x", label: "Interview Rate", icon: Zap },
            ].map((stat, index) => (
              <div 
                key={stat.label}
                className="text-center group cursor-default"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <div className="relative inline-block mb-2">
                  <stat.icon className="w-5 h-5 text-primary/60 mx-auto mb-1 transition-transform group-hover:scale-110" />
                  <p className="font-display text-3xl md:text-4xl font-bold text-foreground transition-all group-hover:text-primary">
                    {stat.value}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator with bounce */}
        <div className="flex justify-center mt-16 animate-fade-in" style={{ animationDelay: "0.6s" }}>
          <a 
            href="#analyzer" 
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
          >
            <span className="text-xs font-medium uppercase tracking-wider">Scroll to analyze</span>
            <ArrowDown className="w-5 h-5 animate-bounce-subtle group-hover:text-primary" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;