import { CheckCircle, XCircle, FileText, Layout, Type, Award, Briefcase, GraduationCap } from "lucide-react";
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
    <section id="guide" className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
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
          <Card className="bg-card shadow-card border-border border-t-4 border-t-score-excellent">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 rounded-xl bg-score-excellent/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-score-excellent" />
                </div>
                Do's
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {dos.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm text-foreground animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <CheckCircle className="w-4 h-4 text-score-excellent mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Don'ts */}
          <Card className="bg-card shadow-card border-border border-t-4 border-t-score-poor">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 rounded-xl bg-score-poor/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-score-poor" />
                </div>
                Don'ts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {donts.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm text-foreground animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <XCircle className="w-4 h-4 text-score-poor mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Resume Structure Guide */}
        <div className="max-w-5xl mx-auto">
          <h3 className="font-display text-2xl font-bold text-foreground text-center mb-8">
            Ideal Resume Structure
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section, index) => (
              <Card
                key={index}
                className="bg-card shadow-card border-border hover:shadow-card-hover transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center mb-4">
                    <section.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h4 className="font-display font-semibold text-foreground mb-2">
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
          <Card className="bg-secondary/50 border-0 shadow-elevated">
            <CardContent className="p-8">
              <h3 className="font-display text-xl font-bold text-foreground mb-4 text-center">
                💡 Pro Tips for ATS Success
              </h3>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span className="text-primary font-bold">01.</span>
                    <p className="text-muted-foreground">
                      <span className="text-foreground font-medium">Save as PDF or DOCX</span> — Most ATS systems parse these formats best. Avoid images or scanned documents.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-primary font-bold">02.</span>
                    <p className="text-muted-foreground">
                      <span className="text-foreground font-medium">Mirror the job posting</span> — Use the same terminology and keywords as the job description.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span className="text-primary font-bold">03.</span>
                    <p className="text-muted-foreground">
                      <span className="text-foreground font-medium">Use standard fonts</span> — Arial, Calibri, Times New Roman, or Garamond work best.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-primary font-bold">04.</span>
                    <p className="text-muted-foreground">
                      <span className="text-foreground font-medium">Test your resume</span> — Run it through multiple ATS checkers before applying.
                    </p>
                  </div>
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
