import { CheckCircle, XCircle, FileText, Layout, Type, Award, Briefcase, GraduationCap, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const ResumeGuideSection = () => {
  const dos = [
    "Use a clean, single-column layout for ATS compatibility",
    "Include quantifiable achievements with specific numbers",
    "Tailor your resume for each job application",
    "Use standard section headings (Experience, Education, Skills)",
    "Keep it to 1-2 pages maximum",
    "Use action verbs to start bullet points",
    "Include relevant keywords from the job description",
    "Use consistent formatting and date formats",
    "Add a professional email address",
    "Proofread for spelling and grammar errors",
  ];

  const donts = [
    "Don't use graphics, tables, or text boxes",
    "Avoid using headers/footers for important info",
    "Don't use fancy fonts or colors",
    "Never include photos (unless culturally required)",
    "Avoid personal pronouns (I, me, my)",
    "Don't include irrelevant personal information",
    "Avoid generic phrases like 'responsible for'",
    "Don't use abbreviations without full form first",
    "Never include references on the resume",
    "Avoid including salary information",
  ];

  const sections = [
    {
      icon: FileText,
      title: "Contact Information",
      description: "Include full name, phone, email, LinkedIn, and city/state. No full address needed.",
    },
    {
      icon: Award,
      title: "Professional Summary",
      description: "3-4 lines highlighting your top qualifications and career focus. Tailor for each role.",
    },
    {
      icon: Briefcase,
      title: "Work Experience",
      description: "List in reverse chronological order. Include company, title, dates, and 3-5 achievement bullets.",
    },
    {
      icon: GraduationCap,
      title: "Education",
      description: "Degree, institution, graduation date. Include GPA if recent graduate and above 3.5.",
    },
    {
      icon: Type,
      title: "Skills",
      description: "List technical and soft skills relevant to the role. Group by category for clarity.",
    },
    {
      icon: Layout,
      title: "Additional Sections",
      description: "Certifications, projects, languages, or volunteer work. Only include if relevant.",
    },
  ];

  return (
    <section id="guide" className="py-16 lg:py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Expert Tips
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Resume Best Practices
          </h2>
          <p className="text-muted-foreground text-lg">
            Follow these guidelines to create an ATS-friendly resume that gets noticed by recruiters.
          </p>
        </div>

        {/* Do's and Don'ts */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          {/* Do's */}
          <Card className="bg-card shadow-card border-border border-t-4 border-t-score-excellent hover-lift animate-slide-right" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-12 h-12 rounded-xl bg-score-excellent/10 flex items-center justify-center transition-transform hover:scale-110 hover:rotate-3">
                  <CheckCircle className="w-6 h-6 text-score-excellent" />
                </div>
                Do's
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {dos.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm text-foreground p-2 rounded-lg hover:bg-muted/50 transition-all duration-200 animate-slide-left group"
                    style={{ animationDelay: `${0.15 + index * 0.03}s` }}
                  >
                    <CheckCircle className="w-4 h-4 text-score-excellent mt-0.5 flex-shrink-0 transition-transform group-hover:scale-110" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Don'ts */}
          <Card className="bg-card shadow-card border-border border-t-4 border-t-score-poor hover-lift animate-slide-left" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-12 h-12 rounded-xl bg-score-poor/10 flex items-center justify-center transition-transform hover:scale-110 hover:-rotate-3">
                  <XCircle className="w-6 h-6 text-score-poor" />
                </div>
                Don'ts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {donts.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm text-foreground p-2 rounded-lg hover:bg-muted/50 transition-all duration-200 animate-slide-right group"
                    style={{ animationDelay: `${0.25 + index * 0.03}s` }}
                  >
                    <XCircle className="w-4 h-4 text-score-poor mt-0.5 flex-shrink-0 transition-transform group-hover:scale-110" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Resume Structure Guide */}
        <div className="max-w-5xl mx-auto">
          <h3 className="font-display text-2xl font-bold text-foreground text-center mb-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            Ideal Resume Structure
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section, index) => (
              <Card
                key={index}
                className="bg-card shadow-card border-border hover-lift card-shine group animate-slide-up"
                style={{ animationDelay: `${0.35 + index * 0.08}s` }}
              >
                <CardContent className="pt-6">
                  <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-elevated group-hover:rotate-3">
                    <section.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h4 className="font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {section.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pro Tips */}
        <div className="max-w-4xl mx-auto mt-16">
          <Card className="bg-gradient-to-br from-secondary/80 to-secondary/60 border-0 shadow-elevated overflow-hidden animate-scale-in" style={{ animationDelay: "0.6s" }}>
            <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--primary)/0.05)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />
            <CardContent className="p-8 relative">
              <h3 className="font-display text-xl font-bold text-secondary-foreground mb-6 text-center flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-accent animate-pulse-slow" />
                Pro Tips for ATS Success
                <Sparkles className="w-5 h-5 text-accent animate-pulse-slow" style={{ animationDelay: "1s" }} />
              </h3>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-4">
                  {[
                    { num: "01", title: "Save as PDF or DOCX", desc: "Most ATS systems parse these formats best. Avoid images or scanned documents." },
                    { num: "02", title: "Mirror the job posting", desc: "Use the same terminology and keywords as the job description." },
                  ].map((tip, index) => (
                    <div key={tip.num} className="flex gap-3 p-3 rounded-lg bg-background/10 hover:bg-background/20 transition-colors animate-slide-right" style={{ animationDelay: `${0.7 + index * 0.1}s` }}>
                      <span className="text-accent font-bold font-mono">{tip.num}.</span>
                      <p className="text-secondary-foreground/80">
                        <span className="text-secondary-foreground font-medium">{tip.title}</span> — {tip.desc}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  {[
                    { num: "03", title: "Use standard fonts", desc: "Arial, Calibri, Times New Roman, or Garamond work best." },
                    { num: "04", title: "Test your resume", desc: "Run it through multiple ATS checkers before applying." },
                  ].map((tip, index) => (
                    <div key={tip.num} className="flex gap-3 p-3 rounded-lg bg-background/10 hover:bg-background/20 transition-colors animate-slide-left" style={{ animationDelay: `${0.7 + index * 0.1}s` }}>
                      <span className="text-accent font-bold font-mono">{tip.num}.</span>
                      <p className="text-secondary-foreground/80">
                        <span className="text-secondary-foreground font-medium">{tip.title}</span> — {tip.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ResumeGuideSection;