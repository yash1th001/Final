import { FileText, Sparkles, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`w-full sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-card/90 backdrop-blur-lg border-b border-border shadow-card" 
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-card transition-all duration-300 group-hover:shadow-elevated group-hover:scale-105">
            <FileText className="w-5 h-5 text-primary-foreground transition-transform group-hover:rotate-6" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
              AIcruit
            </h1>
            <p className="text-xs text-muted-foreground">Smart Resume Analysis</p>
          </div>
        </a>
        
        <nav className="hidden md:flex items-center gap-8">
          {[
            { href: "#analyzer", label: "Analyzer" },
            { href: "#guide", label: "Resume Guide" },
          ].map((link) => (
            <a 
              key={link.href}
              href={link.href} 
              className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary rounded-full transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="hero" size="sm" className="gap-2 group">
            <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12" />
            <span className="hidden sm:inline">Get Started</span>
          </Button>
          
          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-card/95 backdrop-blur-lg border-b border-border shadow-elevated animate-slide-down">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {[
              { href: "#analyzer", label: "Analyzer" },
              { href: "#guide", label: "Resume Guide" },
            ].map((link) => (
              <a 
                key={link.href}
                href={link.href} 
                className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 px-4 py-3 rounded-lg transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;