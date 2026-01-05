import { jsPDF } from 'jspdf';

interface ParsedSection {
  type: 'header' | 'contact' | 'objective' | 'section-title' | 'education-entry' | 'project-entry' | 'skills' | 'certification' | 'achievement' | 'bullet' | 'text';
  content: string;
  subContent?: string;
  date?: string;
  location?: string;
  link?: string;
}

function parseResumeForLatexStyle(resumeText: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = resumeText.split('\n');
  
  const sectionHeaders = [
    'objective', 'summary', 'professional summary', 'profile',
    'education', 'academic background',
    'experience', 'work experience', 'professional experience', 'employment',
    'projects', 'personal projects', 'key projects',
    'skills', 'technical skills', 'core competencies',
    'certifications', 'certificates', 'licenses',
    'achievements', 'accomplishments', 'awards',
    'languages', 'interests', 'hobbies', 'publications', 'references'
  ];
  
  let currentSection = '';
  let headerFound = false;
  let contactBuffer: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const lowerLine = line.toLowerCase().replace(/[:\-–—]/g, '').trim();
    
    // Check if this is the name (first substantial line that's not a section header)
    if (!headerFound && !sectionHeaders.includes(lowerLine)) {
      // Check if it looks like a name (capitalized words, no special chars like @ or numbers)
      if (!/[@|]/.test(line) && !/\d{3}/.test(line) && line.length < 50) {
        sections.push({ type: 'header', content: line });
        headerFound = true;
        continue;
      }
    }
    
    // Collect contact info (phone, email, linkedin, github)
    if (headerFound && (
      line.includes('@') || 
      line.includes('linkedin') || 
      line.includes('github') || 
      /\+?\d{1,3}[-.\s]?\d{3,}/.test(line) ||
      line.includes('|')
    )) {
      contactBuffer.push(line);
      continue;
    }
    
    // Flush contact buffer when we hit a section
    if (contactBuffer.length > 0 && sectionHeaders.includes(lowerLine)) {
      sections.push({ type: 'contact', content: contactBuffer.join(' | ') });
      contactBuffer = [];
    }
    
    // Section headers
    if (sectionHeaders.includes(lowerLine) || sectionHeaders.some(h => lowerLine === h || lowerLine.startsWith(h + ' '))) {
      if (contactBuffer.length > 0) {
        sections.push({ type: 'contact', content: contactBuffer.join(' | ') });
        contactBuffer = [];
      }
      currentSection = lowerLine;
      sections.push({ type: 'section-title', content: line.replace(/[:\-–—]$/, '').trim().toUpperCase() });
      continue;
    }
    
    // Date pattern for entries
    const datePattern = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.\s]*\d{4}\s*[-–—to]+\s*(?:Present|Current|Expected|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.\s]*\d{4})?|\d{4}\s*[-–—to]+\s*(?:Present|Current|Expected|\d{4})/gi;
    
    // Education entries
    if (currentSection.includes('education')) {
      const dateMatch = line.match(datePattern);
      if (dateMatch || line.includes('University') || line.includes('College') || line.includes('Institute') || line.includes('B.Tech') || line.includes('M.Tech') || line.includes('Bachelor') || line.includes('Master')) {
        const cleanLine = line.replace(datePattern, '').trim();
        // Check next line for degree/title
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
        const nextDateMatch = nextLine.match(datePattern);
        
        sections.push({
          type: 'education-entry',
          content: cleanLine || line,
          date: dateMatch ? dateMatch[0] : (nextDateMatch ? nextDateMatch[0] : undefined),
          subContent: nextLine && !sectionHeaders.includes(nextLine.toLowerCase()) && !nextLine.startsWith('•') ? nextLine.replace(datePattern, '').trim() : undefined
        });
        
        if (nextLine && !sectionHeaders.includes(nextLine.toLowerCase()) && !nextLine.startsWith('•')) {
          i++; // Skip next line as we consumed it
        }
        continue;
      }
    }
    
    // Project entries
    if (currentSection.includes('project')) {
      const dateMatch = line.match(datePattern);
      const techMatch = line.match(/\|([^|]+)$/);
      
      if (!line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*') && (dateMatch || techMatch || line.includes('$|$'))) {
        const parts = line.split(/\s*\|\s*/);
        sections.push({
          type: 'project-entry',
          content: parts[0].replace(datePattern, '').trim(),
          subContent: parts.length > 1 ? parts.slice(1).join(' | ').replace(datePattern, '').trim() : undefined,
          date: dateMatch ? dateMatch[0] : undefined
        });
        continue;
      }
    }
    
    // Experience entries
    if (currentSection.includes('experience') || currentSection.includes('employment')) {
      const dateMatch = line.match(datePattern);
      if (!line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*') && dateMatch) {
        const cleanLine = line.replace(datePattern, '').trim();
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
        
        sections.push({
          type: 'education-entry', // Using same format
          content: cleanLine,
          date: dateMatch[0],
          subContent: nextLine && !sectionHeaders.includes(nextLine.toLowerCase()) && !nextLine.startsWith('•') ? nextLine.replace(datePattern, '').trim() : undefined
        });
        
        if (nextLine && !sectionHeaders.includes(nextLine.toLowerCase()) && !nextLine.startsWith('•')) {
          i++;
        }
        continue;
      }
    }
    
    // Skills section
    if (currentSection.includes('skill') || currentSection.includes('competenc')) {
      sections.push({ type: 'skills', content: line });
      continue;
    }
    
    // Certifications
    if (currentSection.includes('certif')) {
      sections.push({ type: 'certification', content: line.replace(/^[•\-*–○]\s*/, '') });
      continue;
    }
    
    // Achievements
    if (currentSection.includes('achieve') || currentSection.includes('accomplish') || currentSection.includes('award')) {
      sections.push({ type: 'achievement', content: line.replace(/^[•\-*–○]\s*/, '') });
      continue;
    }
    
    // Objective/Summary content
    if (currentSection.includes('objective') || currentSection.includes('summary') || currentSection.includes('profile')) {
      sections.push({ type: 'objective', content: line });
      continue;
    }
    
    // Bullet points
    if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.startsWith('–') || line.startsWith('○')) {
      const bulletContent = line.replace(/^[•\-*–○]\s*/, '').trim();
      // Check for GitHub link
      const linkMatch = bulletContent.match(/https?:\/\/[^\s]+/);
      sections.push({
        type: 'bullet',
        content: bulletContent.replace(/https?:\/\/[^\s]+/, '').trim(),
        link: linkMatch ? linkMatch[0] : undefined
      });
      continue;
    }
    
    // Default text
    if (line.length > 0 && !line.match(/^[{}\\]/)) {
      sections.push({ type: 'text', content: line });
    }
  }
  
  // Flush remaining contact info
  if (contactBuffer.length > 0) {
    sections.splice(1, 0, { type: 'contact', content: contactBuffer.join(' | ') });
  }
  
  return sections;
}

export async function generateResumePdf(resumeText: string): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt', // Use points for finer control (1 pt = 1/72 inch)
    format: 'letter', // US Letter: 612 x 792 pts
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Margins matching LaTeX template (0.5in = 36pt)
  const marginLeft = 36;
  const marginRight = 36;
  const marginTop = 36;
  const marginBottom = 36;
  const contentWidth = pageWidth - marginLeft - marginRight;
  
  let yPosition = marginTop;
  const maxY = pageHeight - marginBottom;
  
  // Colors
  const black: [number, number, number] = [0, 0, 0];
  
  // Font sizes matching LaTeX (11pt base)
  const FONT_SIZE = {
    name: 16,
    contact: 9,
    section: 11,
    subheading: 10,
    subheadingItalic: 9,
    body: 9,
    small: 8
  };
  
  // Line heights
  const LINE_HEIGHT = {
    name: 20,
    contact: 12,
    section: 16,
    subheading: 13,
    body: 11,
    bullet: 11
  };
  
  const sections = parseResumeForLatexStyle(resumeText);
  
  // Helper to check page break
  const checkNewPage = (neededSpace: number): boolean => {
    if (yPosition + neededSpace > maxY) {
      doc.addPage();
      yPosition = marginTop;
      return true;
    }
    return false;
  };
  
  // Draw section title with rule line (LaTeX style)
  const drawSectionTitle = (title: string) => {
    checkNewPage(25);
    yPosition += 8;
    
    doc.setFontSize(FONT_SIZE.section);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    
    // Small caps effect - use uppercase
    doc.text(title.toUpperCase(), marginLeft, yPosition);
    
    // Draw horizontal rule below
    yPosition += 3;
    doc.setDrawColor(...black);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
    yPosition += 8;
  };
  
  // Draw two-column subheading (company/date, title/location)
  const drawSubheading = (main: string, date?: string, sub?: string, subRight?: string) => {
    checkNewPage(30);
    
    // First row: Main heading (bold) + Date (right-aligned)
    doc.setFontSize(FONT_SIZE.subheading);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text(main, marginLeft, yPosition);
    
    if (date) {
      doc.setFont('helvetica', 'normal');
      doc.text(date, pageWidth - marginRight, yPosition, { align: 'right' });
    }
    yPosition += LINE_HEIGHT.subheading;
    
    // Second row: Subtitle (italic) + Location (right-aligned, italic)
    if (sub) {
      doc.setFontSize(FONT_SIZE.subheadingItalic);
      doc.setFont('helvetica', 'italic');
      doc.text(sub, marginLeft, yPosition);
      
      if (subRight) {
        doc.text(subRight, pageWidth - marginRight, yPosition, { align: 'right' });
      }
      yPosition += LINE_HEIGHT.body + 2;
    }
  };
  
  // Draw bullet point
  const drawBullet = (text: string, hasLink?: boolean) => {
    checkNewPage(15);
    
    doc.setFontSize(FONT_SIZE.body);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...black);
    
    const bulletX = marginLeft + 10;
    const textX = marginLeft + 20;
    const maxWidth = contentWidth - 20;
    
    // Draw bullet
    doc.text('•', bulletX, yPosition);
    
    // Wrap text
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string, idx: number) => {
      if (idx > 0) checkNewPage(LINE_HEIGHT.bullet);
      doc.text(line, idx === 0 ? textX : textX, yPosition);
      yPosition += LINE_HEIGHT.bullet;
    });
    
    yPosition += 2;
  };
  
  // Process sections
  for (const section of sections) {
    switch (section.type) {
      case 'header':
        // Centered name, large bold
        doc.setFontSize(FONT_SIZE.name);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...black);
        doc.text(section.content, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += LINE_HEIGHT.name;
        break;
        
      case 'contact':
        // Contact line centered with pipe separators
        doc.setFontSize(FONT_SIZE.contact);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...black);
        
        // Clean up and format
        let contactText = section.content
          .replace(/\$\|\$/g, ' | ')
          .replace(/\\href\{[^}]+\}\{\\underline\{([^}]+)\}\}/g, '$1')
          .replace(/\s+/g, ' ')
          .trim();
        
        const contactLines = doc.splitTextToSize(contactText, contentWidth - 40);
        contactLines.forEach((line: string) => {
          doc.text(line, pageWidth / 2, yPosition, { align: 'center' });
          yPosition += LINE_HEIGHT.contact;
        });
        yPosition += 4;
        break;
        
      case 'section-title':
        drawSectionTitle(section.content);
        break;
        
      case 'objective':
        checkNewPage(20);
        doc.setFontSize(FONT_SIZE.body);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...black);
        
        const objLines = doc.splitTextToSize(section.content, contentWidth);
        objLines.forEach((line: string) => {
          checkNewPage(LINE_HEIGHT.body);
          doc.text(line, marginLeft, yPosition);
          yPosition += LINE_HEIGHT.body;
        });
        yPosition += 4;
        break;
        
      case 'education-entry':
        // Parse location from content if present
        const eduParts = section.content.split(/[,\-–—]/).map(p => p.trim());
        const location = eduParts.length > 1 ? eduParts[eduParts.length - 1] : undefined;
        const institution = eduParts.length > 1 ? eduParts.slice(0, -1).join(', ') : section.content;
        
        drawSubheading(
          institution,
          section.date,
          section.subContent,
          location
        );
        break;
        
      case 'project-entry':
        checkNewPage(20);
        
        // Project name (bold) + tech stack | date
        doc.setFontSize(FONT_SIZE.subheading);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...black);
        
        let projectTitle = section.content;
        if (section.subContent) {
          projectTitle += ' | ' + section.subContent;
        }
        
        const maxTitleWidth = section.date ? contentWidth - 80 : contentWidth;
        const titleLines = doc.splitTextToSize(projectTitle, maxTitleWidth);
        doc.text(titleLines[0], marginLeft, yPosition);
        
        if (section.date) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(FONT_SIZE.small);
          doc.text(section.date, pageWidth - marginRight, yPosition, { align: 'right' });
        }
        yPosition += LINE_HEIGHT.subheading + 2;
        break;
        
      case 'bullet':
        let bulletText = section.content;
        if (section.link) {
          bulletText += ' [GitHub]';
        }
        drawBullet(bulletText);
        break;
        
      case 'skills':
        checkNewPage(15);
        doc.setFontSize(FONT_SIZE.body);
        
        // Check if it's a "Category: Items" format
        const skillMatch = section.content.match(/^([^:]+):\s*(.+)$/);
        if (skillMatch) {
          doc.setFont('helvetica', 'bold');
          doc.text(skillMatch[1] + ': ', marginLeft, yPosition);
          
          const boldWidth = doc.getTextWidth(skillMatch[1] + ': ');
          doc.setFont('helvetica', 'normal');
          
          const remainingWidth = contentWidth - boldWidth;
          const skillLines = doc.splitTextToSize(skillMatch[2], remainingWidth);
          
          skillLines.forEach((line: string, idx: number) => {
            if (idx === 0) {
              doc.text(line, marginLeft + boldWidth, yPosition);
            } else {
              yPosition += LINE_HEIGHT.body;
              checkNewPage(LINE_HEIGHT.body);
              doc.text(line, marginLeft, yPosition);
            }
          });
        } else {
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(section.content, contentWidth);
          lines.forEach((line: string) => {
            doc.text(line, marginLeft, yPosition);
            yPosition += LINE_HEIGHT.body;
          });
          yPosition -= LINE_HEIGHT.body; // Adjust for loop
        }
        yPosition += LINE_HEIGHT.body + 2;
        break;
        
      case 'certification':
        checkNewPage(15);
        doc.setFontSize(FONT_SIZE.body);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...black);
        
        // Add bullet for certifications
        doc.text('•', marginLeft + 10, yPosition);
        const certLines = doc.splitTextToSize(section.content, contentWidth - 20);
        certLines.forEach((line: string, idx: number) => {
          doc.text(line, marginLeft + 20, yPosition);
          if (idx < certLines.length - 1) {
            yPosition += LINE_HEIGHT.body;
            checkNewPage(LINE_HEIGHT.body);
          }
        });
        yPosition += LINE_HEIGHT.body + 2;
        break;
        
      case 'achievement':
        checkNewPage(20);
        doc.setFontSize(FONT_SIZE.body);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...black);
        
        const achieveLines = doc.splitTextToSize(section.content, contentWidth - 10);
        achieveLines.forEach((line: string) => {
          checkNewPage(LINE_HEIGHT.body);
          doc.text(line, marginLeft + 5, yPosition);
          yPosition += LINE_HEIGHT.body;
        });
        yPosition += 4;
        break;
        
      case 'text':
        checkNewPage(15);
        doc.setFontSize(FONT_SIZE.body);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...black);
        
        const textLines = doc.splitTextToSize(section.content, contentWidth);
        textLines.forEach((line: string) => {
          doc.text(line, marginLeft, yPosition);
          yPosition += LINE_HEIGHT.body;
        });
        break;
    }
  }
  
  // Save the PDF
  doc.save('tailored-resume.pdf');
}
