import { jsPDF } from 'jspdf';
import { AnalysisResult } from '@/components/AnalyzerSection';

export async function generateAnalysisReport(results: AnalysisResult): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = 20;
  
  // Colors matching theme
  const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo
  const accentColor: [number, number, number] = [16, 185, 129]; // Emerald
  const destructiveColor: [number, number, number] = [239, 68, 68]; // Red
  const textColor: [number, number, number] = [31, 41, 55];
  const mutedColor: [number, number, number] = [107, 114, 128];
  
  const getScoreColor = (score: number): [number, number, number] => {
    if (score >= 80) return accentColor;
    if (score >= 60) return primaryColor;
    if (score >= 40) return [245, 158, 11]; // Amber
    return destructiveColor;
  };
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('AIcruit Resume Analysis', margin, 28);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, margin, 38);
  
  yPosition = 60;
  
  // Overall Score Section
  const overallScore = Math.round((results.atsScore + results.jdMatchScore + results.structureScore) / 3);
  
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Score', margin, yPosition);
  
  yPosition += 10;
  
  // Score display
  doc.setFontSize(36);
  doc.setTextColor(...getScoreColor(overallScore));
  doc.text(`${overallScore}%`, margin, yPosition + 12);
  
  // Score bar background
  doc.setFillColor(229, 231, 235);
  doc.roundedRect(margin + 50, yPosition, contentWidth - 50, 10, 3, 3, 'F');
  
  // Score bar fill
  doc.setFillColor(...getScoreColor(overallScore));
  const barWidth = ((contentWidth - 50) * overallScore) / 100;
  doc.roundedRect(margin + 50, yPosition, barWidth, 10, 3, 3, 'F');
  
  yPosition += 30;
  
  // Individual Scores
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('Score Breakdown', margin, yPosition);
  
  yPosition += 12;
  
  const scores = [
    { label: 'ATS Compatibility', score: results.atsScore },
    { label: 'Job Description Match', score: results.jdMatchScore },
    { label: 'Resume Structure', score: results.structureScore },
  ];
  
  scores.forEach((item) => {
    // Label
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    doc.text(item.label, margin, yPosition);
    
    // Score
    doc.setTextColor(...getScoreColor(item.score));
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.score}%`, margin + 100, yPosition);
    
    // Mini bar
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(margin + 120, yPosition - 4, 50, 6, 2, 2, 'F');
    
    doc.setFillColor(...getScoreColor(item.score));
    const miniBarWidth = (50 * item.score) / 100;
    doc.roundedRect(margin + 120, yPosition - 4, miniBarWidth, 6, 2, 2, 'F');
    
    yPosition += 12;
  });
  
  yPosition += 10;
  
  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  
  yPosition += 15;
  
  // Suggestions Section
  const addSection = (title: string, items: string[], color: [number, number, number], symbol: string) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text(title, margin, yPosition);
    
    yPosition += 10;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    
    items.forEach((item) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      const lines = doc.splitTextToSize(`${symbol} ${item}`, contentWidth - 5);
      lines.forEach((line: string) => {
        doc.text(line, margin + 5, yPosition);
        yPosition += 5;
      });
      yPosition += 3;
    });
    
    yPosition += 8;
  };
  
  addSection('Add to Resume', results.suggestions.additions, accentColor, '+');
  addSection('Remove from Resume', results.suggestions.removals, destructiveColor, '−');
  addSection('Improvements', results.suggestions.improvements, primaryColor, '→');
  
  // Structure Analysis
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  
  yPosition += 15;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('Structure Analysis', margin, yPosition);
  
  yPosition += 12;
  
  // Sections checklist
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...mutedColor);
  doc.text('Section Checklist:', margin, yPosition);
  
  yPosition += 10;
  
  results.structureAnalysis.sections.forEach((section) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    
    const statusColor = section.status === 'good' ? accentColor : 
                        section.status === 'needs-improvement' ? [245, 158, 11] as [number, number, number] : 
                        destructiveColor;
    const statusSymbol = section.status === 'good' ? '✓' : 
                         section.status === 'needs-improvement' ? '○' : '✗';
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...statusColor);
    doc.text(statusSymbol, margin + 5, yPosition);
    
    doc.setTextColor(...textColor);
    doc.text(section.name, margin + 15, yPosition);
    
    doc.setTextColor(...mutedColor);
    doc.text(section.status.replace('-', ' '), margin + 80, yPosition);
    
    yPosition += 8;
  });
  
  yPosition += 10;
  
  // Formatting tips
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...mutedColor);
  doc.text('Formatting Recommendations:', margin, yPosition);
  
  yPosition += 10;
  
  results.structureAnalysis.formatting.forEach((tip, index) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);
    doc.text(`${String(index + 1).padStart(2, '0')}`, margin + 5, yPosition);
    
    doc.setTextColor(...textColor);
    const lines = doc.splitTextToSize(tip, contentWidth - 20);
    lines.forEach((line: string) => {
      doc.text(line, margin + 18, yPosition);
      yPosition += 5;
    });
    yPosition += 3;
  });
  
  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.text(
      `Page ${i} of ${pageCount} • Generated by AIcruit`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save the PDF
  doc.save('resume-analysis-report.pdf');
}
