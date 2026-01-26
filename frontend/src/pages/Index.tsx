import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AnalyzerSection from "@/components/AnalyzerSection";
import ResumeGuideSection from "@/components/ResumeGuideSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <AnalyzerSection />
        <ResumeGuideSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
