import { jsPDF } from 'jspdf';

interface ParsedSection {
  type: 'header' | 'contact' | 'objective' | 'section-title' | 'education-entry' | 'experience-entry' | 'project-entry' | 'skills' | 'certification' | 'achievement' | 'bullet' | 'text' | 'technologies' | 'link';
  content: string;
  subContent?: string;
  date?: string;
  location?: string;
  link?: string;
}

interface LinkPosition {
  text: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
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
    
    // Skip separator lines
    if (/^[=\-]{3,}$/.test(line)) continue;
    
    const lowerLine = line.toLowerCase().replace(/[:\-–—]/g, '').trim();
    
    // Check for Link: format
    if (line.match(/^Link:\s*(https?:\/\/[^\s]+)/i)) {
      const linkMatch = line.match(/^Link:\s*(https?:\/\/[^\s]+)/i);
      if (linkMatch) {
        sections.push({ type: 'link', content: linkMatch[1], link: linkMatch[1] });
      }
      continue;
    }
    
    // Check for Technologies: format
    if (line.match(/^Technologies?:\s*(.+)/i)) {
      const techMatch = line.match(/^Technologies?:\s*(.+)/i);
      if (techMatch) {
        sections.push({ type: 'technologies', content: techMatch[1] });
      }
      continue;
    }
    
    // Check if this is the name (first substantial line that's not a section header)
    if (!headerFound && !sectionHeaders.includes(lowerLine)) {
      // Check if it looks like a name (capitalized words, no special chars like @ or numbers for contact)
      if (!/[@|]/.test(line) && !/^\+?\d{1,3}[-.\s]?\d{3,}/.test(line) && !/^Phone:|^Email:/i.test(line) && line.length < 60) {
        sections.push({ type: 'header', content: line });
        headerFound = true;
        continue;
      }
    }
    
    // Collect contact info (phone, email, linkedin, github)
    if (headerFound && (
      line.includes('@') || 
      /linkedin\.com|github\.com/i.test(line) ||
      /^Phone:|^Email:|^LinkedIn:|^GitHub:/i.test(line) ||
      /\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3,}/.test(line) ||
      (line.includes('|') && !sectionHeaders.includes(lowerLine))
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
    const datePattern = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.\s]*\d{4}\s*[-–—to]+\s*(?:Present|Current|Expected|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.\s]*\d{4})?|\d{4}\s*[-–—to]+\s*(?:Present|Current|Expected|\d{4})|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*\d{4}/gi;
    
    // Education entries
    if (currentSection.includes('education')) {
      const dateMatch = line.match(datePattern);
      if (dateMatch || line.includes('University') || line.includes('College') || line.includes('Institute') || line.includes('B.Tech') || line.includes('M.Tech') || line.includes('Bachelor') || line.includes('Master') || line.includes('GPA')) {
        const cleanLine = line.replace(datePattern, '').trim();
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
        const nextDateMatch = nextLine.match(datePattern);
        
        // Skip if it's just a continuation bullet
        if (!line.startsWith('•') && !line.startsWith('-')) {
          sections.push({
            type: 'education-entry',
            content: cleanLine || line,
            date: dateMatch ? dateMatch[0] : (nextDateMatch ? nextDateMatch[0] : undefined),
            subContent: nextLine && !sectionHeaders.includes(nextLine.toLowerCase()) && !nextLine.startsWith('•') && !nextLine.startsWith('-') && !nextLine.match(/^[=\-]{3,}$/) ? nextLine.replace(datePattern, '').trim() : undefined
          });
          
          if (nextLine && !sectionHeaders.includes(nextLine.toLowerCase()) && !nextLine.startsWith('•') && !nextLine.startsWith('-') && !nextLine.match(/^[=\-]{3,}$/)) {
            i++;
          }
          continue;
        }
      }
    }
    
    // Project entries
    if (currentSection.includes('project')) {
      const dateMatch = line.match(datePattern);
      
      if (!line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*') && !line.match(/^Technologies?:/i) && !line.match(/^Link:/i)) {
        if (dateMatch || (line.length < 80 && !line.includes('•'))) {
          sections.push({
            type: 'project-entry',
            content: line.replace(datePattern, '').trim(),
            date: dateMatch ? dateMatch[0] : undefined
          });
          continue;
        }
      }
    }
    
    // Experience entries
    if (currentSection.includes('experience') || currentSection.includes('employment')) {
      const dateMatch = line.match(datePattern);
      if (!line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*')) {
        if (dateMatch) {
          const cleanLine = line.replace(datePattern, '').trim();
          const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
          
          sections.push({
            type: 'experience-entry',
            content: cleanLine,
            date: dateMatch[0],
            subContent: nextLine && !sectionHeaders.includes(nextLine.toLowerCase()) && !nextLine.startsWith('•') && !nextLine.startsWith('-') ? nextLine.replace(datePattern, '').trim() : undefined
          });
          
          if (nextLine && !sectionHeaders.includes(nextLine.toLowerCase()) && !nextLine.startsWith('•') && !nextLine.startsWith('-')) {
            i++;
          }
          continue;
        }
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
      const linkMatch = bulletContent.match(/https?:\/\/[^\s]+/);
      sections.push({
        type: 'bullet',
        content: bulletContent,
        link: linkMatch ? linkMatch[0] : undefined
      });
      continue;
    }
    
    // Default text
    if (line.length > 0 && !line.match(/^[{}\\]/) && !line.match(/^[=\-]{3,}$/)) {
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
    unit: 'pt',
    format: 'letter',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Margins matching LaTeX template
  const marginLeft = 40;
  const marginRight = 40;
  const marginTop = 40;
  const marginBottom = 40;
  const contentWidth = pageWidth - marginLeft - marginRight;
  
  let yPosition = marginTop;
  const maxY = pageHeight - marginBottom;
  
  // Colors
  const black: [number, number, number] = [0, 0, 0];
  const linkBlue: [number, number, number] = [0, 0, 180];
  
  // Font sizes
  const FONT_SIZE = {
    name: 18,
    contact: 9,
    section: 11,
    subheading: 10,
    subheadingItalic: 9,
    body: 9,
    small: 8
  };
  
  // Line heights
  const LINE_HEIGHT = {
    name: 22,
    contact: 11,
    section: 16,
    subheading: 13,
    body: 11,
    bullet: 11
  };
  
  const sections = parseResumeForLatexStyle(resumeText);
  const linkPositions: LinkPosition[] = [];
  
  // Helper to check page break
  const checkNewPage = (neededSpace: number): boolean => {
    if (yPosition + neededSpace > maxY) {
      doc.addPage();
      yPosition = marginTop;
      return true;
    }
    return false;
  };
  
  // Helper to draw a clickable link
  const drawLink = (text: string, url: string, x: number, y: number) => {
    doc.setTextColor(...linkBlue);
    doc.setFont('helvetica', 'normal');
    doc.text(text, x, y);
    const textWidth = doc.getTextWidth(text);
    
    // Add underline
    doc.setDrawColor(...linkBlue);
    doc.setLineWidth(0.5);
    doc.line(x, y + 1.5, x + textWidth, y + 1.5);
    
    // Store link position for adding to PDF
    linkPositions.push({
      text,
      url,
      x,
      y: y - 8,
      width: textWidth,
      height: 10
    });
    
    doc.setTextColor(...black);
    return textWidth;
  };
  
  // Draw section title with rule line
  const drawSectionTitle = (title: string) => {
    checkNewPage(25);
    yPosition += 10;
    
    doc.setFontSize(FONT_SIZE.section);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    
    doc.text(title.toUpperCase(), marginLeft, yPosition);
    
    yPosition += 3;
    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(0.75);
    doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
    yPosition += 10;
  };
  
  // Draw entry with right-aligned date
  const drawEntry = (main: string, date?: string, sub?: string, location?: string) => {
    checkNewPage(30);
    
    // First row: Main heading (bold) + Date (right-aligned)
    doc.setFontSize(FONT_SIZE.subheading);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    
    const mainWidth = date ? contentWidth - 100 : contentWidth;
    const mainLines = doc.splitTextToSize(main, mainWidth);
    doc.text(mainLines[0], marginLeft, yPosition);
    
    if (date) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONT_SIZE.small);
      doc.text(date, pageWidth - marginRight, yPosition, { align: 'right' });
    }
    yPosition += LINE_HEIGHT.subheading;
    
    // Handle multi-line main text
    for (let i = 1; i < mainLines.length; i++) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(FONT_SIZE.subheading);
      doc.text(mainLines[i], marginLeft, yPosition);
      yPosition += LINE_HEIGHT.subheading;
    }
    
    // Second row: Subtitle (italic) + Location (right-aligned)
    if (sub) {
      doc.setFontSize(FONT_SIZE.subheadingItalic);
      doc.setFont('helvetica', 'italic');
      doc.text(sub, marginLeft, yPosition);
      
      if (location) {
        doc.text(location, pageWidth - marginRight, yPosition, { align: 'right' });
      }
      yPosition += LINE_HEIGHT.body + 2;
    }
  };
  
  // Draw bullet point
  const drawBullet = (text: string, link?: string) => {
    checkNewPage(15);
    
    doc.setFontSize(FONT_SIZE.body);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...black);
    
    const bulletX = marginLeft + 8;
    const textX = marginLeft + 18;
    const maxWidth = contentWidth - 18;
    
    // Draw bullet
    doc.text('•', bulletX, yPosition);
    
    // Check for inline links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let textToDraw = text;
    let inlineLink: string | null = null;
    
    if (link || urlRegex.test(text)) {
      const urlMatch = text.match(urlRegex);
      if (urlMatch) {
        inlineLink = urlMatch[0];
        textToDraw = text.replace(urlRegex, '').trim();
      }
    }
    
    // Wrap and draw text
    const lines = doc.splitTextToSize(textToDraw, maxWidth);
    lines.forEach((line: string, idx: number) => {
      if (idx > 0) {
        checkNewPage(LINE_HEIGHT.bullet);
      }
      doc.text(line, textX, yPosition);
      yPosition += LINE_HEIGHT.bullet;
    });
    
    // Draw link on new line if present
    if (inlineLink) {
      checkNewPage(LINE_HEIGHT.bullet);
      doc.setFontSize(FONT_SIZE.small);
      const linkX = textX + 5;
      drawLink(inlineLink, inlineLink, linkX, yPosition);
      yPosition += LINE_HEIGHT.bullet;
    }
    
    yPosition += 1;
  };
  
  // Process sections
  for (const section of sections) {
    switch (section.type) {
      case 'header':
        doc.setFontSize(FONT_SIZE.name);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...black);
        doc.text(section.content, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += LINE_HEIGHT.name;
        break;
        
      case 'contact':
        doc.setFontSize(FONT_SIZE.contact);
        doc.setFont('helvetica', 'normal');
        
        // Parse and format contact info
        let contactText = section.content
          .replace(/\$\|\$/g, ' | ')
          .replace(/\\href\{[^}]+\}\{\\underline\{([^}]+)\}\}/g, '$1')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Split by pipe and process each part
        const contactParts = contactText.split(/\s*\|\s*/);
        let currentX = marginLeft;
        let lineY = yPosition;
        const spacing = 8;
        
        // Calculate total width to center
        let totalWidth = 0;
        contactParts.forEach((part, idx) => {
          const cleanPart = part.replace(/^(Phone|Email|LinkedIn|GitHub):\s*/i, '');
          totalWidth += doc.getTextWidth(cleanPart);
          if (idx < contactParts.length - 1) {
            totalWidth += doc.getTextWidth(' | ') + spacing;
          }
        });
        
        currentX = (pageWidth - totalWidth) / 2;
        
        contactParts.forEach((part, idx) => {
          const isUrl = part.includes('http') || part.includes('linkedin') || part.includes('github');
          let displayText = part.replace(/^(Phone|Email|LinkedIn|GitHub):\s*/i, '');
          const urlMatch = part.match(/https?:\/\/[^\s]+/);
          
          if (isUrl && urlMatch) {
            const linkWidth = drawLink(displayText.replace(urlMatch[0], urlMatch[0]), urlMatch[0], currentX, lineY);
            currentX += linkWidth;
          } else {
            doc.setTextColor(...black);
            doc.text(displayText, currentX, lineY);
            currentX += doc.getTextWidth(displayText);
          }
          
          if (idx < contactParts.length - 1) {
            doc.setTextColor(...black);
            doc.text(' | ', currentX, lineY);
            currentX += doc.getTextWidth(' | ') + spacing / 2;
          }
        });
        
        yPosition += LINE_HEIGHT.contact + 4;
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
      case 'experience-entry':
        const parts = section.content.split(/[,]/).map(p => p.trim());
        const location = parts.length > 1 && parts[parts.length - 1].length < 30 ? parts[parts.length - 1] : undefined;
        const institution = location ? parts.slice(0, -1).join(', ') : section.content;
        
        drawEntry(
          institution,
          section.date,
          section.subContent,
          location
        );
        break;
        
      case 'project-entry':
        checkNewPage(20);
        
        doc.setFontSize(FONT_SIZE.subheading);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...black);
        
        const projectTitle = section.content;
        const maxTitleWidth = section.date ? contentWidth - 90 : contentWidth;
        const titleLines = doc.splitTextToSize(projectTitle, maxTitleWidth);
        doc.text(titleLines[0], marginLeft, yPosition);
        
        if (section.date) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(FONT_SIZE.small);
          doc.text(section.date, pageWidth - marginRight, yPosition, { align: 'right' });
        }
        yPosition += LINE_HEIGHT.subheading + 2;
        break;
        
      case 'technologies':
        checkNewPage(15);
        doc.setFontSize(FONT_SIZE.body);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(80, 80, 80);
        
        const techText = 'Technologies: ' + section.content;
        const techLines = doc.splitTextToSize(techText, contentWidth - 10);
        techLines.forEach((line: string) => {
          doc.text(line, marginLeft + 5, yPosition);
          yPosition += LINE_HEIGHT.body;
        });
        doc.setTextColor(...black);
        yPosition += 2;
        break;
        
      case 'link':
        checkNewPage(15);
        doc.setFontSize(FONT_SIZE.small);
        if (section.link) {
          drawLink(section.link, section.link, marginLeft + 10, yPosition);
        }
        yPosition += LINE_HEIGHT.body + 2;
        break;
        
      case 'bullet':
        drawBullet(section.content, section.link);
        break;
        
      case 'skills':
        checkNewPage(15);
        doc.setFontSize(FONT_SIZE.body);
        
        const skillMatch = section.content.match(/^([^:]+):\s*(.+)$/);
        if (skillMatch) {
          doc.setFont('helvetica', 'bold');
          const label = skillMatch[1] + ': ';
          doc.text(label, marginLeft, yPosition);
          
          const boldWidth = doc.getTextWidth(label);
          doc.setFont('helvetica', 'normal');
          
          const remainingWidth = contentWidth - boldWidth;
          const skillLines = doc.splitTextToSize(skillMatch[2], remainingWidth);
          
          skillLines.forEach((line: string, idx: number) => {
            if (idx === 0) {
              doc.text(line, marginLeft + boldWidth, yPosition);
            } else {
              yPosition += LINE_HEIGHT.body;
              checkNewPage(LINE_HEIGHT.body);
              doc.text(line, marginLeft + boldWidth, yPosition);
            }
          });
        } else {
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(section.content, contentWidth);
          lines.forEach((line: string) => {
            doc.text(line, marginLeft, yPosition);
            yPosition += LINE_HEIGHT.body;
          });
          yPosition -= LINE_HEIGHT.body;
        }
        yPosition += LINE_HEIGHT.body + 3;
        break;
        
      case 'certification':
        checkNewPage(15);
        doc.setFontSize(FONT_SIZE.body);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...black);
        
        doc.text('•', marginLeft + 8, yPosition);
        const certLines = doc.splitTextToSize(section.content, contentWidth - 18);
        certLines.forEach((line: string, idx: number) => {
          doc.text(line, marginLeft + 18, yPosition);
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
        
        doc.text('•', marginLeft + 8, yPosition);
        const achieveLines = doc.splitTextToSize(section.content, contentWidth - 18);
        achieveLines.forEach((line: string, idx: number) => {
          doc.text(line, marginLeft + 18, yPosition);
          if (idx < achieveLines.length - 1) {
            yPosition += LINE_HEIGHT.body;
            checkNewPage(LINE_HEIGHT.body);
          }
        });
        yPosition += LINE_HEIGHT.body + 3;
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
  
  // Add clickable links to the PDF
  linkPositions.forEach(linkPos => {
    doc.link(linkPos.x, linkPos.y, linkPos.width, linkPos.height, { url: linkPos.url });
  });
  
  // Save the PDF
  doc.save('tailored-resume.pdf');
}
