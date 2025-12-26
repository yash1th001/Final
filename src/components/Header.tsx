import { FileText, Sparkles } from "lucide-react";
import { Button } from "./ui/button";

const Header = () => {
  return (
    <header className="w-full border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-card">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground tracking-tight">
              AIcruit
            </h1>
            <p className="text-xs text-muted-foreground">Smart Resume Analysis</p>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="#analyzer" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Analyzer
          </a>
          <a href="#guide" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Resume Guide
          </a>
        </nav>

        <Button variant="hero" size="sm" className="gap-2">
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Get Started</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;
