import { FileText, Github, Linkedin, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display font-bold text-lg">AIcruit</p>
              <p className="text-sm text-muted-foreground">Smart Resume Analysis</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Powered by LangChain + Gemini AI
          </p>

          <div className="flex items-center gap-4">
            <a
              href="#"
              className="w-9 h-9 rounded-lg bg-muted/20 hover:bg-muted/40 flex items-center justify-center transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="w-9 h-9 rounded-lg bg-muted/20 hover:bg-muted/40 flex items-center justify-center transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="w-9 h-9 rounded-lg bg-muted/20 hover:bg-muted/40 flex items-center justify-center transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/20 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} AIcruit. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
