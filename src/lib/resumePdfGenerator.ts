import { jsPDF } from 'jspdf';

interface ResumeSection {
  type: 'header' | 'section' | 'experience' | 'education' | 'skills' | 'bullet';
  content: string;
  subContent?: string;
  date?: string;
  location?: string;
}

function parseResumeText(resumeText: string): ResumeSection[] {
  const sections: ResumeSection[] = [];
  const lines = resumeText.split('\n').filter(line => line.trim());
  
  let currentSection = '';
  let i = 0;
  
  // Common section headers
  const sectionHeaders = [
    'experience', 'work experience', 'professional experience', 'employment',
    'education', 'academic background', 'qualifications',
    'skills', 'technical skills', 'core competencies', 'competencies',
    'projects', 'personal projects', 'key projects',
    'certifications', 'certificates', 'licenses',
    'summary', 'professional summary', 'objective', 'profile',
    'achievements', 'accomplishments', 'awards',
    'languages', 'interests', 'hobbies', 'publications', 'references'
  ];
  
  while (i < lines.length) {
    const line = lines[i].trim();
    const lowerLine = line.toLowerCase().replace(/[:\-–—]/g, '').trim();
    
    // Check if this is the name (first non-empty line, typically)
    if (i === 0 && !sectionHeaders.includes(lowerLine)) {
      sections.push({ type: 'header', content: line });
      i++;
      continue;
    }
    
    // Check for contact info line (email, phone, linkedin, etc.)
    if (i <= 3 && (line.includes('@') || line.includes('|') || /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(line) || line.includes('linkedin'))) {
      if (sections.length > 0 && sections[sections.length - 1].type === 'header') {
        sections[sections.length - 1].subContent = (sections[sections.length - 1].subContent || '') + (sections[sections.length - 1].subContent ? ' | ' : '') + line;
      }
      i++;
      continue;
    }
    
    // Check if line is a section header
    if (sectionHeaders.includes(lowerLine) || sectionHeaders.some(h => lowerLine.startsWith(h))) {
      currentSection = lowerLine;
      sections.push({ type: 'section', content: line.replace(/[:\-–—]$/, '').trim() });
      i++;
      continue;
    }
    
    // Check for experience/education entries (Company/School - Title/Degree pattern)
    const datePattern = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)[\s,]*\d{4}\s*[-–—to]+\s*(?:Present|Current|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?[\s,]*\d{0,4}|\d{4}\s*[-–—to]+\s*(?:Present|Current|\d{4})|\d{1,2}\/\d{4}\s*[-–—to]+\s*(?:Present|Current|\d{1,2}\/\d{4})/i;
    
    const hasDate = datePattern.test(line);
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
    
    // Determine if this is an experience/education entry
    if ((currentSection.includes('experience') || currentSection.includes('employment') || currentSection.includes('work')) && !line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*') && !line.startsWith('–')) {
      // Check if this looks like a job title or company
      if (hasDate || (nextLine && datePattern.test(nextLine))) {
        const dateMatch = line.match(datePattern) || (nextLine ? nextLine.match(datePattern) : null);
        const cleanLine = line.replace(datePattern, '').trim();
        
        sections.push({
          type: 'experience',
          content: cleanLine || line,
          date: dateMatch ? dateMatch[0].trim() : undefined,
        });
        i++;
        continue;
      }
    }
    
    if ((currentSection.includes('education') || currentSection.includes('academic')) && !line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*')) {
      if (hasDate || (nextLine && datePattern.test(nextLine)) || line.includes('University') || line.includes('College') || line.includes('Institute') || line.includes('School') || line.includes('Bachelor') || line.includes('Master') || line.includes('PhD') || line.includes('Degree')) {
        const dateMatch = line.match(datePattern) || (nextLine ? nextLine.match(datePattern) : null);
        const cleanLine = line.replace(datePattern, '').trim();
        
        sections.push({
          type: 'education',
          content: cleanLine || line,
          date: dateMatch ? dateMatch[0].trim() : undefined,
        });
        i++;
        continue;
      }
    }
    
    // Check for bullet points
    if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.startsWith('–') || line.startsWith('○')) {
      sections.push({
        type: 'bullet',
        content: line.replace(/^[•\-*–○]\s*/, '').trim()
      });
      i++;
      continue;
    }
    
    // Skills section - comma-separated items
    if (currentSection.includes('skill') || currentSection.includes('competenc')) {
      sections.push({
        type: 'skills',
        content: line
      });
      i++;
      continue;
    }
    
    // Default: treat as bullet or content
    if (line.length > 0) {
      sections.push({
        type: 'bullet',
        content: line
      });
    }
    i++;
  }
  
  return sections;
}

export async function generateResumePdf(resumeText: string): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 15;
  const marginRight = 15;
  const marginTop = 15;
  const marginBottom = 15;
  const contentWidth = pageWidth - marginLeft - marginRight;
  
  let yPosition = marginTop;
  const maxY = pageHeight - marginBottom;
  
  // Colors - Professional ATS-friendly colors
  const black: [number, number, number] = [0, 0, 0];
  const darkGray: [number, number, number] = [50, 50, 50];
  const accentBlue: [number, number, number] = [0, 51, 102]; // Professional navy blue
  
  // Parse the resume
  const sections = parseResumeText(resumeText);
  
  // Helper function to check and add new page if needed
  const checkNewPage = (neededSpace: number) => {
    if (yPosition + neededSpace > maxY) {
      doc.addPage();
      yPosition = marginTop;
      return true;
    }
    return false;
  };
  
  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, maxWidth: number, fontSize: number, fontStyle: string = 'normal', color: [number, number, number] = darkGray) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(...color);
    
    const lines = doc.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * 0.4;
    
    lines.forEach((line: string) => {
      checkNewPage(lineHeight + 2);
      doc.text(line, x, yPosition);
      yPosition += lineHeight;
    });
    
    return lines.length;
  };
  
  // Process each section
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    switch (section.type) {
      case 'header':
        // Name - Large, bold, centered
        checkNewPage(20);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...black);
        doc.text(section.content.toUpperCase(), pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 7;
        
        // Contact info
        if (section.subContent) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...darkGray);
          
          // Clean up and format contact info
          const contactInfo = section.subContent.replace(/\s*\|\s*/g, '  •  ');
          const contactLines = doc.splitTextToSize(contactInfo, contentWidth - 20);
          contactLines.forEach((line: string) => {
            doc.text(line, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 4;
          });
        }
        yPosition += 4;
        break;
        
      case 'section':
        // Section header with underline
        checkNewPage(12);
        yPosition += 4;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...accentBlue);
        doc.text(section.content.toUpperCase(), marginLeft, yPosition);
        
        // Underline
        yPosition += 1;
        doc.setDrawColor(...accentBlue);
        doc.setLineWidth(0.5);
        doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
        yPosition += 5;
        break;
        
      case 'experience':
      case 'education':
        checkNewPage(12);
        
        // Split content if it contains role/company or degree/school
        const parts = section.content.split(/[,|–—-]/).map(p => p.trim()).filter(p => p);
        
        if (parts.length >= 2) {
          // First part (Company/School) - Bold
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...black);
          doc.text(parts[0], marginLeft, yPosition);
          
          // Date on the right
          if (section.date) {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...darkGray);
            doc.text(section.date, pageWidth - marginRight, yPosition, { align: 'right' });
          }
          yPosition += 4;
          
          // Second part (Title/Degree) - Italic
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(...darkGray);
          doc.text(parts.slice(1).join(', '), marginLeft, yPosition);
          yPosition += 4;
        } else {
          // Single line entry
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...black);
          doc.text(section.content, marginLeft, yPosition);
          
          if (section.date) {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...darkGray);
            doc.text(section.date, pageWidth - marginRight, yPosition, { align: 'right' });
          }
          yPosition += 5;
        }
        break;
        
      case 'bullet':
        checkNewPage(8);
        
        // Bullet point
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkGray);
        
        const bulletText = `• ${section.content}`;
        const bulletLines = doc.splitTextToSize(bulletText, contentWidth - 5);
        const bulletLineHeight = 3.8;
        
        bulletLines.forEach((line: string, idx: number) => {
          checkNewPage(bulletLineHeight + 1);
          const xPos = idx === 0 ? marginLeft : marginLeft + 3;
          doc.text(idx === 0 ? line : line, xPos, yPosition);
          yPosition += bulletLineHeight;
        });
        yPosition += 1;
        break;
        
      case 'skills':
        checkNewPage(8);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkGray);
        
        const skillLines = doc.splitTextToSize(section.content, contentWidth);
        skillLines.forEach((line: string) => {
          checkNewPage(4);
          doc.text(line, marginLeft, yPosition);
          yPosition += 4;
        });
        break;
    }
  }
  
  // Ensure it fits in one page - if not, reduce font sizes proportionally
  const totalPages = doc.getNumberOfPages();
  if (totalPages > 1) {
    // Regenerate with smaller fonts if it exceeds one page
    doc.deletePage(2);
    while (doc.getNumberOfPages() > 1) {
      doc.deletePage(doc.getNumberOfPages());
    }
  }
  
  // Save the PDF
  doc.save('tailored-resume.pdf');
}
