import { useState, useEffect, useRef } from 'react';
import analysisService from '../services/analysisService';
import './Dashboard.css';

// Parse analysis result into structured sections
const parseAnalysisResult = (analysisText) => {
  if (!analysisText) return null;

  const sections = {
    niveau: '',
    conclusion: '',
    erreursRecurrentes: '',
    erreursPersistantes: '',
    tendancesEvolution: ''
  };

  const lines = analysisText.split('\n');
  let currentSection = null;
  let currentContent = [];
  let evolutionContent = '';
  
  console.log('[parseAnalysisResult] Starting parse, total lines:', lines.length);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const originalLine = lines[i]; // Keep original for content collection
    
    // Detect section headers (must be at start of line or with minimal indentation)
    const isEvolutionHeader = (line === 'ÉVOLUTION_GLOBALE' || line === 'ÉVOLUTION GLOBALE' || 
                                line.startsWith('ÉVOLUTION_GLOBALE') || line.startsWith('ÉVOLUTION GLOBALE'));
    const isErreursHeader = (line === 'ERREURS_RÉCURRENTES' || line === 'ERREURS RÉCURRENTES' ||
                             line.startsWith('ERREURS_RÉCURRENTES') || line.startsWith('ERREURS RÉCURRENTES'));
    
    // Debug logging for evolution section
    if (currentSection === 'evolutionGlobale' && i < 20) {
      console.log(`[parseAnalysisResult] Line ${i}:`, {
        trimmed: line.substring(0, 50),
        original: originalLine.substring(0, 50),
        currentContentLength: currentContent.length,
        isErreursHeader: isErreursHeader,
        willCollect: currentSection && !(line === '' && currentContent.length === 0 && currentSection)
      });
    }
    
    if (isEvolutionHeader) {
      if (currentSection === 'erreursRecurrentes') {
        sections[currentSection] = currentContent.join('\n');
      }
      currentSection = 'evolutionGlobale';
      currentContent = [];
      continue; // Skip the header line itself
    }
    if (isErreursHeader) {
      console.log('[parseAnalysisResult] Detected ERREURS_RÉCURRENTES at line', i, ':', {
        line: line,
        originalLine: originalLine,
        currentSection: currentSection,
        currentContentLength: currentContent.length,
        currentContentPreview: currentContent.slice(0, 5)
      });
      // Save evolution content before switching
      if (currentSection === 'evolutionGlobale') {
        const evolutionContent = currentContent.join('\n');
        sections['evolutionGlobale'] = evolutionContent;
        console.log('[parseAnalysisResult] Saving evolutionGlobale content:', {
          length: evolutionContent.length,
          preview: evolutionContent.substring(0, 500),
          lineCount: currentContent.length,
          firstFewLines: currentContent.slice(0, 10),
          allLines: currentContent
        });
        extractEvolutionData(evolutionContent, sections);
      }
      currentSection = 'erreursRecurrentes';
      currentContent = [];
      continue; // Skip the header line itself
    }
    if (line.includes('TENDANCES D\'ÉVOLUTION') || line.includes("TENDANCES D'ÉVOLUTION")) {
      if (currentSection === 'erreursRecurrentes') {
        sections[currentSection] = currentContent.join('\n');
      }
      currentSection = 'tendancesEvolution';
      currentContent = [];
      continue;
    }
    if (line.includes('ERREURS_PERSISTANTES') || line.includes('ERREURS PERSISTANTES')) {
      if (currentSection === 'erreursRecurrentes') {
        sections[currentSection] = currentContent.join('\n');
      }
      currentSection = 'erreursPersistantes';
      currentContent = [];
      continue;
    }
    // Detect CONCLUSION section header - but NOT "résumé: >" which is part of evolution globale
    // Only match standalone conclusion/résumé headers that are NOT indented and NOT followed by >
    const isConclusionHeader = (
      !line.includes('>') && // Don't match lines with ">" (like "résumé: >")
      !line.match(/^\s+/) && // Don't match indented lines (résumé: > is indented)
      (line === 'CONCLUSION' || 
       line === 'RÉSUMÉ' ||
       line.startsWith('CONCLUSION:') || 
       line.startsWith('RÉSUMÉ:') ||
       line.match(/^##?\s*(?:RÉSUMÉ|CONCLUSION)/i) || // Markdown headers like "## Résumé"
       line.match(/^\*\*(?:RÉSUMÉ|CONCLUSION)\*\*/i)) // Bold headers like "**Résumé**"
    );
    
    if (isConclusionHeader) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n');
        if (currentSection === 'evolutionGlobale') {
           extractEvolutionData(sections['evolutionGlobale'], sections);
        }
      }
      currentSection = 'conclusion';
      currentContent = [];
      continue;
    }

    // Skip empty lines ONLY at the very start of a section (before any content)
    // But keep empty lines that come after we've started collecting (they're part of the content)
    if (line === '' && currentContent.length === 0 && currentSection) {
      continue;
    }

    // Collect content for current section (use original line to preserve formatting)
    if (currentSection) {
      currentContent.push(originalLine);
      // Debug: log when we collect lines in evolution section
      if (currentSection === 'evolutionGlobale' && i < 10) {
        console.log(`[parseAnalysisResult] ✅ Collected line ${i} into evolutionGlobale:`, {
          line: originalLine.substring(0, 60),
          currentContentLength: currentContent.length,
          isResumeLine: originalLine.toLowerCase().includes('résumé')
        });
      }
    }
  }

  // Save last section
  if (currentSection === 'erreursPersistantes') {
    sections[currentSection] = currentContent.join('\n');
  } else if (currentSection === 'evolutionGlobale') {
    sections['evolutionGlobale'] = currentContent.join('\n');
    extractEvolutionData(sections['evolutionGlobale'], sections);
  } else if (currentSection === 'conclusion') {
    const conclusionContent = currentContent.join('\n');
    // Only set conclusion if we have content AND it's not already set from evolution globale
    // OR if the new content is better (longer/more complete)
    if (conclusionContent.trim()) {
      if (!sections['conclusion'] || sections['conclusion'].trim().length === 0 || conclusionContent.trim().length > sections['conclusion'].trim().length) {
        sections['conclusion'] = conclusionContent;
      }
    }
  } else if (currentSection) {
    sections[currentSection] = currentContent.join('\n');
  }

  return sections;
};

// Extract niveau and conclusion from evolution globale section
const extractEvolutionData = (content, sections) => {
  if (!content) {
    console.log('[extractEvolutionData] No content provided');
    return;
  }
  
  console.log('[extractEvolutionData] Processing content:', {
    contentLength: content.length,
    preview: content.substring(0, 300),
    hasResume: content.toLowerCase().includes('résumé')
  });
  
  const fullContent = content;
  let niveauMatch = null;
  let resumeContent = '';
  
  // Extract niveau - look for patterns like "A2 → B1+" or "évolution de niveau: "A2 → B1+"
  const niveauPatterns = [
    /évolution de niveau[:\s]*[""]([A-Z0-9+\s→]+)[""]/i,
    /évolution de niveau[:\s]*([A-Z0-9+\s→]+)/i,
    /evolution de niveau[:\s]*[""]([A-Z0-9+\s→]+)[""]/i,
    /evolution de niveau[:\s]*([A-Z0-9+\s→]+)/i,
    /[""]([A-Z0-9+\s→]+)[""]/,
    /([A-Z][0-9]+\s*→\s*[A-Z][0-9+]+)/,
    /^([A-Z][0-9]+(?:\+)?)$/m,
    /^Niveau[:\s]*([A-Z][0-9]+(?:\+)?)/im,
    /Niveau estimé[:\s]*([A-Z][0-9]+(?:\+)?)/im
  ];
  
  for (const pattern of niveauPatterns) {
    const match = fullContent.match(pattern);
    if (match && match[1]) {
      niveauMatch = match[1].trim();
      break;
    }
  }
  
  // Extract résumé/conclusion using line-by-line parsing (more reliable)
  const lines = fullContent.split('\n');
  let resumeStartIndex = -1;
  
  // Find the line with "résumé: >" or "résumé:" (can be indented)
  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].toLowerCase().trim();
    // Match "résumé:" or "résumé: >" (the > can be on same line or next)
    if (trimmedLine.includes('résumé') && trimmedLine.includes(':')) {
      resumeStartIndex = i;
      break;
    }
  }
  
  if (resumeStartIndex >= 0) {
    // Collect lines after "résumé:" until we hit a section header
    const resumeLines = [];
    let startCollecting = false;
    
    // Check if the ">" is on the same line or next line
    const resumeLine = lines[resumeStartIndex].trim();
    if (resumeLine.includes('>')) {
      startCollecting = true; // Start collecting from next line
    } else {
      startCollecting = true; // Start collecting from next line anyway
    }
    
    for (let i = resumeStartIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      const upperLine = trimmedLine.toUpperCase();
      
      // Stop if we hit a major section header (check for unindented section headers)
      if (upperLine === 'ERREURS_RÉCURRENTES' || 
          upperLine === 'ERREURS RÉCURRENTES' ||
          upperLine.startsWith('ERREURS_RÉCURRENTES') ||
          upperLine.startsWith('ERREURS RÉCURRENTES') ||
          upperLine.startsWith('TENDANCES') ||
          upperLine.startsWith('ERREURS_PERSISTANTES') ||
          upperLine === 'GRAMMAIRE:' ||
          upperLine === 'VOCABULAIRE:' ||
          upperLine === 'STYLE:') {
        // Only stop if it's not indented (section headers shouldn't be indented)
        if (!line.match(/^\s{4,}/)) {
          break;
        }
      }
      
      // Skip lines that are just ">" or completely empty at the start
      if (trimmedLine === '>' && resumeLines.length === 0) {
        continue; // Skip standalone ">" line
      }
      
      // Collect all other lines (including empty lines for paragraph breaks)
      if (startCollecting) {
        resumeLines.push(line);
      }
    }
    
    if (resumeLines.length > 0) {
      resumeContent = resumeLines
        .map((l, idx) => {
          // Remove leading ">" if present
          let cleaned = l.replace(/^>\s*/, '');
          // Remove excessive indentation (8+ spaces down to 4, keep structure)
          cleaned = cleaned.replace(/^\s{8,}/, '    ').replace(/^\s{4}/, '');
          return cleaned.trim();
        })
        .filter((l, idx, arr) => {
          // Keep non-empty lines, or empty lines that aren't at the very end
          return l.length > 0 || idx < arr.length - 1;
        })
        .join('\n')
        .trim();
      
      console.log('[extractEvolutionData] Extracted résumé via line-by-line:', {
        resumeStartIndex,
        resumeLine: lines[resumeStartIndex],
        linesCollected: resumeLines.length,
        contentLength: resumeContent.length,
        preview: resumeContent.substring(0, 200),
        fullContent: resumeContent
      });
    } else {
      console.log('[extractEvolutionData] No résumé lines collected after finding résumé header');
    }
  } else {
    console.log('[extractEvolutionData] Could not find résumé line in content. Content preview:', fullContent.substring(0, 500));
  }
  
  // Fallback: Try regex patterns if line-by-line didn't work
  if (!resumeContent || resumeContent.trim().length === 0) {
    const resumePattern1 = /\s*résumé[:\s]*>\s*\n([\s\S]*?)(?=\n\s*(?:ERREURS_RÉCURRENTES|ERREURS RÉCURRENTES|TENDANCES|ERREURS_PERSISTANTES|$))/i;
    let match1 = fullContent.match(resumePattern1);
    
    if (match1 && match1[1] && match1[1].trim().length > 0) {
      resumeContent = match1[1]
        .split('\n')
        .map(l => l.replace(/^>\s*/, '').replace(/^\s{4,}/, '').trim())
        .filter(l => l.length > 0)
        .join('\n')
        .trim();
    }
  }
  
  if (niveauMatch) {
    sections.niveau = niveauMatch;
  }
  
  // If we still don't have resume content, try to extract it from lines after "résumé" keyword
  if (!resumeContent || resumeContent.trim().length === 0) {
    const lines = fullContent.split('\n');
    let resumeStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (line.includes('résumé') && (line.includes(':') || line.includes('>'))) {
        resumeStartIndex = i;
        break;
      }
    }
    if (resumeStartIndex >= 0) {
      // Take everything after the résumé line until we hit a section header or end
      const remainingLines = lines.slice(resumeStartIndex + 1);
      const resumeLines = [];
      for (const line of remainingLines) {
        const upperLine = line.toUpperCase().trim();
        if (upperLine.includes('ERREURS') || upperLine.includes('TENDANCES') || upperLine.includes('GRAMMAIRE') || upperLine.includes('VOCABULAIRE')) {
          break;
        }
        resumeLines.push(line);
      }
      if (resumeLines.length > 0) {
        resumeContent = resumeLines
          .join('\n')
          .trim()
          .split('\n')
          .map(l => l.replace(/^>\s*/, '').replace(/^\s{4,}/, '').trim())
          .filter(l => l.length > 0)
          .join('\n')
          .trim();
      }
    }
  }
  
  // Always set conclusion if we found resume content
  // The extractEvolutionData should take priority for résumé content
  if (resumeContent && resumeContent.trim().length > 0) {
    sections.conclusion = resumeContent;
    console.log('[extractEvolutionData] ✅ Successfully extracted résumé content:', {
      length: resumeContent.length,
      preview: resumeContent.substring(0, 200),
      fullContent: resumeContent
    });
  } else {
    console.log('[extractEvolutionData] ❌ No résumé content extracted. Content searched:', {
      contentLength: fullContent.length,
      contentPreview: fullContent.substring(0, 500),
      linesCount: fullContent.split('\n').length
    });
  }
};

// Helper to process bold text
const processBoldText = (text, keyPrefix) => {
  if (!text.includes('**')) return text;
  
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span key={`bold-${keyPrefix}`}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.replace(/\*\*/g, '')}</strong>;
        }
        return part;
      })}
    </span>
  );
};

// Helper to render error block
const renderErrorBlock = (block, key, accentColor = 'blue') => {
  // Parse block lines into structured data
  const data = {
    pattern: '',
    occurrences: '',
    examples: '',
    explanation: '',
    others: []
  };

  block.lines.forEach(line => {
    const l = line.trim();
    if (l.toLowerCase().startsWith('pattern:')) {
      data.pattern = l.replace(/pattern:\s*/i, '');
    } else if (l.toLowerCase().startsWith('occurrences:')) {
      data.occurrences = l.replace(/occurrences:\s*/i, '');
    } else if (l.toLowerCase().startsWith('exemples:')) {
      data.examples = l.replace(/exemples:\s*/i, '');
    } else if (l.toLowerCase().startsWith('explication:')) {
      data.explanation = l.replace(/explication:\s*/i, '');
    } else {
      data.others.push(l);
    }
  });

  return (
    <div key={`error-${key}`} className={`analysis-error-card theme-${accentColor}`}>
      <div className="error-card-header">
        <div className="error-type-wrapper">
          <span className="error-type-label">Type</span>
          <span className="error-type-value">{block.type.replace(/type:\s*/i, '').replace(/erreur:\s*/i, '')}</span>
        </div>
      </div>
      <div className="error-card-body">
        <div className="error-grid-row">
          {data.pattern && (
            <div className="error-section error-pattern">
              <span className="error-label">Pattern</span>
              <span className="error-content">{data.pattern}</span>
            </div>
          )}
          {data.occurrences && (
            <div className="error-section error-occurrences">
              <span className="error-label">Occurrences</span>
              <span className="error-badge">{data.occurrences}</span>
            </div>
          )}
        </div>
        
        {data.examples && (
          <div className="error-section error-examples">
            <span className="error-label">Examples</span>
            <div className="examples-list">
              {data.examples.split('/').map((ex, i) => (
                <div key={i} className="example-item">
                  {ex.trim()}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.explanation && (
          <div className="error-section error-explanation">
            <span className="error-label">Explanation</span>
            <p className="explanation-text">{data.explanation}</p>
          </div>
        )}

        {data.others.length > 0 && (
          <div className="error-section error-others">
            {data.others.map((line, idx) => (
              <div key={idx} className="other-detail">{line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Format section content for display
const formatSectionContent = (content, accentColor = 'blue') => {
  if (!content) return null;

  const lines = content.split('\n');
  const formattedElements = [];
  let currentErrorBlock = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines, unless we need to close a block or it's significant
    if (!line) {
        if (currentErrorBlock) {
             formattedElements.push(renderErrorBlock(currentErrorBlock, i, accentColor));
             currentErrorBlock = null;
        }
        continue;
    }

    // Handle headers (## Titre or GRAMMAIRE:, VOCABULAIRE:, STYLE:)
    if (line.startsWith('## ') || line.match(/^(GRAMMAIRE|VOCABULAIRE|STYLE):$/)) {
      if (currentErrorBlock) {
        formattedElements.push(renderErrorBlock(currentErrorBlock, i, accentColor));
        currentErrorBlock = null;
      }
      formattedElements.push(
        <h4 key={`header-${i}`} className={`analysis-section-title text-${accentColor}`}>
          {line.replace(/^##\s*/, '').replace(':', '')}
        </h4>
      );
      continue;
    }

    // Detect error block start (type: G01, etc.)
    // We look for "type:" or "erreur:" at the start of the line, possibly preceded by a bullet
    const typeMatch = line.match(/^[-•*]?\s*(type|erreur)\s*:/i);
    if (typeMatch) {
      if (currentErrorBlock) {
        formattedElements.push(renderErrorBlock(currentErrorBlock, i, accentColor));
      }
      // Clean up the type line (remove bullet if present)
      const cleanType = line.replace(/^[-•*]\s*/, '');
      currentErrorBlock = { type: cleanType, lines: [] };
      continue;
    }

    // If inside an error block, collect lines
    if (currentErrorBlock) {
      // Check if this line looks like part of the error block
      // We accept almost anything indented or that looks like a key:value or list item
      // We also accept lines that are clearly NOT new sections
      const isHeader = line.startsWith('## ') || line.match(/^(GRAMMAIRE|VOCABULAIRE|STYLE):$/);
      const isNewType = line.match(/^[-•*]?\s*(type|erreur)\s*:/i);
      
      if (!isHeader && !isNewType) {
        // Clean up leading bullets from keys inside the block if they exist
        // e.g. "- pattern: ..." -> "pattern: ..."
        let cleanLine = line;
        if (line.match(/^[-•*]\s*(pattern|occurrences|exemples|explication)\s*:/i)) {
          cleanLine = line.replace(/^[-•*]\s*/, '');
        }
        currentErrorBlock.lines.push(cleanLine);
        continue;
      } else {
        // If it looks like a new section or new error block, close current one
        formattedElements.push(renderErrorBlock(currentErrorBlock, i, accentColor));
        currentErrorBlock = null;
        // Fall through to process this line as start of something new
      }
    }

    // Handle list items
    if (line.startsWith('-') || line.startsWith('•')) {
      formattedElements.push(
        <li key={`list-${i}`} className="analysis-list-item">
          {processBoldText(line.replace(/^[-•]\s*/, ''), i)}
        </li>
      );
      continue;
    }
    
    // Handle numbered items
    if (line.match(/^\d+\./)) {
      formattedElements.push(
        <li key={`list-${i}`} className="analysis-list-item">
          {processBoldText(line.replace(/^\d+\.\s*/, ''), i)}
        </li>
      );
      continue;
    }
    
    // Regular paragraphs
    formattedElements.push(
      <p key={`p-${i}`} className="analysis-paragraph">
        {processBoldText(line, i)}
      </p>
    );
  }

  // Close any remaining error block
  if (currentErrorBlock) {
    formattedElements.push(renderErrorBlock(currentErrorBlock, lines.length, accentColor));
  }

  return formattedElements;
};

// Split recurrent errors into grammar, vocabulary and style
const splitRecurrentErrors = (content) => {
  if (!content) return { grammaire: '', vocabulaire: '', style: '' };
  
  const lines = content.split('\n');
  const result = { grammaire: '', vocabulaire: '', style: '' };
  let currentSection = 'grammaire'; // Default to grammar if no header found first
  let currentBuffer = [];
  
  for (const line of lines) {
    const upperLine = line.toUpperCase().trim();
    if (upperLine.includes('VOCABULAIRE') && (upperLine.endsWith(':') || upperLine.startsWith('##'))) {
      if (currentSection) {
        result[currentSection] = currentBuffer.join('\n');
      }
      currentSection = 'vocabulaire';
      currentBuffer = [];
      continue;
    } else if (upperLine.includes('GRAMMAIRE') && (upperLine.endsWith(':') || upperLine.startsWith('##'))) {
       if (currentSection) {
        result[currentSection] = currentBuffer.join('\n');
      }
      currentSection = 'grammaire';
      currentBuffer = [];
      continue;
    } else if (upperLine.includes('STYLE') && (upperLine.endsWith(':') || upperLine.startsWith('##'))) {
      if (currentSection) {
       result[currentSection] = currentBuffer.join('\n');
     }
     currentSection = 'style';
     currentBuffer = [];
     continue;
   }
    currentBuffer.push(line);
  }
  
  if (currentSection) {
    result[currentSection] = currentBuffer.join('\n');
  }
  
  return result;
};

// Analysis Section Component (Collapsible)
const AnalysisSection = ({ title, content, icon, accentColor = 'blue', defaultOpen = false, count = 0 }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  if (!content || content.trim().length === 0) return null;
  
  return (
    <div className={`analysis-accordion-item theme-${accentColor}`}>
      <button 
        className={`analysis-accordion-header ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="accordion-title-wrapper">
          <span className={`accordion-icon text-${accentColor}-500`}>{icon}</span>
          <span className="accordion-title">{title}</span>
          {count > 0 && <span className={`accordion-count bg-${accentColor}-500`}>{count}</span>}
        </div>
        <div className={`accordion-arrow text-${accentColor}-400`}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </button>
      
      {isOpen && (
        <div className="analysis-accordion-content">
          <div className="analysis-text">
            {formatSectionContent(content, accentColor)}
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = ({ userRole, userEmail }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState([]);
  const [analyzingAnalyses, setAnalyzingAnalyses] = useState({});
  const [analysisProgress, setAnalysisProgress] = useState({});
  const progressIntervals = useRef({});

  useEffect(() => {
    const loadData = async () => {
      if (userRole === 'student') {
        // Load analyses for student
        try {
          console.log('[Dashboard] Loading initial analyses for:', userEmail);
          const response = await analysisService.getStudentAnalyses(userEmail);
          console.log('[Dashboard] Initial analyses loaded:', {
            total: response.analyses?.length || 0,
            analyses: response.analyses?.map(a => ({
              id: a.id,
              has_result: !!a.analysis_result,
              result_length: a.analysis_result?.length || 0
            })) || []
          });
          setAnalyses(response.analyses || []);
        } catch (error) {
          console.error('[Dashboard] Error loading analyses:', error);
          setAnalyses([]);
        }
        setLoading(false);
      } else {
        // Load students for teacher/admin
        setTimeout(() => {
          // Get all users from localStorage
          const users = JSON.parse(localStorage.getItem('users') || '{}');
          
          // Filter students based on teacher
          let filteredStudents = [];
          
          if (userRole === 'admin') {
            // Admin sees all students
            filteredStudents = Object.entries(users)
              .filter(([email, data]) => data.role === 'student')
              .map(([email, data]) => ({
                email,
                textsCount: Math.floor(Math.random() * 30),
                lastActivity: new Date().toISOString().split('T')[0],
                hasNewTexts: Math.random() > 0.5,
                teacherId: data.teacherId
              }));
          } else if (userRole === 'teacher') {
            // Teachers see only their assigned students
            filteredStudents = Object.entries(users)
              .filter(([email, data]) => data.role === 'student' && data.teacherId === userEmail)
              .map(([email, data]) => ({
                email,
                textsCount: Math.floor(Math.random() * 30),
                lastActivity: new Date().toISOString().split('T')[0],
                hasNewTexts: Math.random() > 0.5,
                teacherId: data.teacherId
              }));
          }
          
          setStudents(filteredStudents);
          setLoading(false);
        }, 1000);
      }
    };

    loadData();
  }, [userRole, userEmail]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(progressIntervals.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, []);

  // Monitor analyses state changes for debugging
  useEffect(() => {
    if (userRole === 'student') {
      console.log('[Dashboard] Analyses state updated:', {
        count: analyses.length,
        analyses: analyses.map(a => ({
          id: a.id,
          has_result: !!a.analysis_result,
          result_preview: a.analysis_result ? a.analysis_result.substring(0, 50) : null
        }))
      });
    }
  }, [analyses, userRole]);

  // Filter analyses by type and sort by date (most recent first)
  const allWrittenAnalyses = analyses
    .filter(a => a.text_type === 'written' || !a.text_type)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  // Only show the most recent analysis
  const writtenAnalyses = allWrittenAnalyses.length > 0 ? [allWrittenAnalyses[0]] : [];

  // Get the most recent analysis for launching analysis
  const mostRecentWritten = writtenAnalyses.length > 0 ? writtenAnalyses[0] : null;
  
  // Debug logging for filtered analyses (removed problematic dependencies to prevent infinite loop)
  useEffect(() => {
    if (userRole === 'student' && analyses.length > 0) {
      const allWritten = analyses.filter(a => a.text_type === 'written' || !a.text_type);
      const mostRecent = allWritten.length > 0 ? allWritten[0] : null;
      console.log('[Dashboard] Filtered written analyses:', {
        totalAnalyses: analyses.length,
        allWrittenCount: allWritten.length,
        displayedCount: allWritten.length > 0 ? 1 : 0,
        mostRecent: mostRecent ? {
          id: mostRecent.id,
          has_result: !!mostRecent.analysis_result,
          result_type: typeof mostRecent.analysis_result,
          result_length: typeof mostRecent.analysis_result === 'string' ? mostRecent.analysis_result.length : 0
        } : null
      });
    }
  }, [analyses.length, userRole]); // Only depend on length to prevent infinite loops

  // Handle analysis execution
  const handleAnalyze = async (analysis) => {
    if (!analysis.text_content) {
      console.error('No text content found for analysis');
      return;
    }

    const analysisId = analysis.id;
    console.log('[Dashboard] Starting analysis for:', analysisId, 'Text preview:', analysis.text_content.substring(0, 50));
    
    // Mark as analyzing
    setAnalyzingAnalyses(prev => ({ ...prev, [analysisId]: true }));
    setAnalysisProgress(prev => ({ ...prev, [analysisId]: 0 }));

    // Start progress simulation
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90; // Cap at 90% until response
      setAnalysisProgress(prev => ({ ...prev, [analysisId]: Math.min(progress, 90) }));
    }, 200);
    
    progressIntervals.current[analysisId] = interval;

    try {
      // Submit for analysis
      console.log('[Dashboard] Submitting text for analysis...', {
        userEmail,
        userRole,
        textLength: analysis.text_content?.length || 0,
        textType: analysis.text_type || 'written'
      });
      
      // Check if user is a student (backend will reject non-students)
      if (userRole !== 'student') {
        console.error('[Dashboard] Only students can analyze texts. Current role:', userRole);
        throw new Error('Only students can analyze texts. Please log in as a student.');
      }
      
      // Add timeout wrapper (5 minutes to match backend timeout)
      const analysisPromise = analysisService.submitTextForAnalysis(
        userEmail,
        analysis.text_content,
        analysis.text_type || 'written'
      );
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Analysis request timed out after 5 minutes. The analysis may still be processing in the background.')), 300000)
      );
      
      const response = await Promise.race([analysisPromise, timeoutPromise]);
      console.log('[Dashboard] Analysis response received:', {
        success: response.success,
        analysis_id: response.analysis_id,
        has_analysis: !!response.analysis,
        analysis_type: typeof response.analysis,
        analysis_length: typeof response.analysis === 'string' ? response.analysis.length : 0,
        analysis_preview: typeof response.analysis === 'string' ? response.analysis.substring(0, 100) : JSON.stringify(response.analysis).substring(0, 100)
      });
      
      if (!response.success) {
        console.error('[Dashboard] Analysis failed:', response.message || 'Unknown error');
        throw new Error(response.message || 'Analysis failed');
      }
      
      if (!response.analysis || (typeof response.analysis !== 'string' || response.analysis.trim().length === 0)) {
        console.warn('[Dashboard] Analysis response missing or empty:', response);
      }

      // Complete progress
      clearInterval(interval);
      setAnalysisProgress(prev => ({ ...prev, [analysisId]: 100 }));

      // Reload analyses to get updated results
      console.log('[Dashboard] Reloading analyses from API...');
      const updatedResponse = await analysisService.getStudentAnalyses(userEmail);
      console.log('[Dashboard] Updated analyses received:', {
        total: updatedResponse.analyses?.length || 0,
        analyses: updatedResponse.analyses?.map(a => ({
          id: a.id,
          has_result: !!a.analysis_result,
          result_preview: a.analysis_result ? a.analysis_result.substring(0, 100) : null
        })) || []
      });
      
      // Verify the analysis result is in the response
      const updatedAnalysis = updatedResponse.analyses?.find(a => a.id === analysisId);
      if (updatedAnalysis) {
        const resultType = typeof updatedAnalysis.analysis_result;
        const resultLength = resultType === 'string' ? updatedAnalysis.analysis_result.length : 0;
        console.log('[Dashboard] Updated analysis found:', {
          id: updatedAnalysis.id,
          has_result: !!updatedAnalysis.analysis_result,
          result_type: resultType,
          result_length: resultLength,
          result_preview: resultType === 'string' ? updatedAnalysis.analysis_result.substring(0, 150) : JSON.stringify(updatedAnalysis.analysis_result).substring(0, 150)
        });
        
        if (!updatedAnalysis.analysis_result || resultLength === 0) {
          console.warn('[Dashboard] ⚠️ Analysis result is missing or empty in updated data');
        } else {
          console.log('[Dashboard] ✅ Analysis result found in updated data');
        }
      } else {
        console.warn('[Dashboard] ⚠️ Analysis NOT found in updated data for analysis:', analysisId);
      }
      
      setAnalyses(updatedResponse.analyses || []);

      // Reset state after a short delay
      setTimeout(() => {
        setAnalyzingAnalyses(prev => {
          const updated = { ...prev };
          delete updated[analysisId];
          return updated;
        });
        setAnalysisProgress(prev => {
          const updated = { ...prev };
          delete updated[analysisId];
          return updated;
        });
        delete progressIntervals.current[analysisId];
      }, 500);
    } catch (error) {
      console.error('[Dashboard] Error analyzing text:', error);
      console.error('[Dashboard] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      clearInterval(interval);
      setAnalyzingAnalyses(prev => {
        const updated = { ...prev };
        delete updated[analysisId];
        return updated;
      });
      setAnalysisProgress(prev => {
        const updated = { ...prev };
        delete updated[analysisId];
        return updated;
      });
      delete progressIntervals.current[analysisId];
      
      // Show error to user with helpful message
      const errorMessage = error.message || 'Unknown error occurred';
      if (errorMessage.includes('timed out')) {
        alert(`Analysis is taking longer than expected. This may be due to:\n\n` +
              `• Large amount of text to analyze\n` +
              `• High demand on the AI service\n\n` +
              `The analysis may still be processing. Please refresh the page in a few minutes to check if results are available.`);
      } else {
        alert(`Analysis failed: ${errorMessage}`);
      }
    }
  };

  // Analysis Dashboard Component for Written Analyses
  const WrittenAnalysisDashboard = ({ analysisResult }) => {
    console.log('[WrittenAnalysisDashboard] Received analysisResult:', {
      exists: !!analysisResult,
      type: typeof analysisResult,
      length: analysisResult?.length || 0,
      preview: analysisResult ? analysisResult.substring(0, 150) : null
    });
    
    // If no result, show message instead of nothing
    if (!analysisResult) {
      console.warn('[WrittenAnalysisDashboard] No analysis result provided');
      return (
        <div className="analysis-text">
          <p className="analysis-paragraph">No analysis data available</p>
        </div>
      );
    }
    
    const parsedSections = parseAnalysisResult(analysisResult);
    const splitErrors = splitRecurrentErrors(parsedSections?.erreursRecurrentes);
    
    console.log('[WrittenAnalysisDashboard] Parsed sections:', {
      hasSections: !!parsedSections,
      sections: parsedSections ? Object.keys(parsedSections) : null,
      conclusion: parsedSections?.conclusion ? {
        length: parsedSections.conclusion.length,
        preview: parsedSections.conclusion.substring(0, 150),
        isEmpty: parsedSections.conclusion.trim().length === 0,
        fullContent: parsedSections.conclusion
      } : null,
      evolutionGlobale: parsedSections?.evolutionGlobale ? {
        length: parsedSections.evolutionGlobale.length,
        preview: parsedSections.evolutionGlobale.substring(0, 200)
      } : null
    });

    if (!parsedSections) {
      // If parsing failed but we have content, try to render it anyway
      const formattedContent = formatSectionContent(analysisResult);
      if (!formattedContent || (Array.isArray(formattedContent) && formattedContent.length === 0)) {
        console.warn('[WrittenAnalysisDashboard] Parsing failed and formatSectionContent returned empty');
        return (
          <div className="analysis-text">
            <p className="analysis-paragraph">Analysis completed, but content could not be parsed.</p>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', opacity: 0.8 }}>
              {analysisResult}
            </pre>
          </div>
        );
      }
      return (
        <div className="analysis-text">
          {formattedContent}
        </div>
      );
    }

    return (
      <div className="analysis-dashboard-modern">
        {/* Niveau Display - Top Priority */}
        {parsedSections.niveau && (
          <div className="modern-stat-card level-card">
            <div className="modern-stat-icon level-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="modern-stat-content">
              <span className="modern-stat-value">{parsedSections.niveau} level detected</span>
            </div>
          </div>
        )}

        <div className="analysis-accordions">
          {/* Grammar Errors */}
          <AnalysisSection 
            title="Grammar Errors" 
            content={splitErrors.grammaire} 
            accentColor="green"
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            }
            defaultOpen={true}
          />
          
          {/* Vocabulary Errors */}
          <AnalysisSection 
            title="Vocabulary Errors" 
            content={splitErrors.vocabulaire} 
            accentColor="blue"
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
              </svg>
            }
          />

          {/* Style Errors */}
          <AnalysisSection 
            title="Style Suggestions" 
            content={splitErrors.style} 
            accentColor="pink"
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
              </svg>
            }
          />

          {/* Persistent Errors */}
          <AnalysisSection 
            title="Persistent Errors" 
            content={parsedSections.erreursPersistantes} 
            accentColor="orange"
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
            }
          />

          {/* Evolution Trends */}
          <AnalysisSection 
            title="Evolution Trends" 
            content={parsedSections.tendancesEvolution} 
            accentColor="purple"
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
              </svg>
            }
          />

          {/* Level Evolution */}
          <AnalysisSection 
            title="Level Evolution" 
            content={parsedSections.evolutionGlobale} 
            accentColor="teal"
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L9 5.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                <path fillRule="evenodd" d="M3.293 15.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L9 11.414 4.707 15.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            }
          />

          {/* Conclusion */}
          <AnalysisSection 
            title="Conclusion" 
            content={parsedSections.conclusion} 
            accentColor="indigo"
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd"/>
              </svg>
            }
          />
        </div>
      </div>
    );
  };

  // Analysis Tabs Component for Oral Analyses (keep original)
  const AnalysisTabs = ({ analysisResult }) => {
    const [activeTab, setActiveTab] = useState('evolutionGlobale');
    const parsedSections = parseAnalysisResult(analysisResult);

    if (!parsedSections) {
      return (
        <div className="analysis-text">
          {formatSectionContent(analysisResult)}
        </div>
      );
    }

    const tabs = [
      { id: 'evolutionGlobale', label: 'Global Evolution', content: parsedSections.evolutionGlobale },
      { id: 'erreursRecurrentes', label: 'Recurring Errors', content: parsedSections.erreursRecurrentes },
      { id: 'erreursPersistantes', label: 'Persistent Errors', content: parsedSections.erreursPersistantes }
    ];

    // Filter out empty tabs
    const availableTabs = tabs.filter(tab => tab.content && tab.content.trim().length > 0);

    if (availableTabs.length === 0) {
      return (
        <div className="analysis-text">
          {formatSectionContent(analysisResult)}
        </div>
      );
    }

    return (
      <div className="analysis-tabs">
        <div className="tabs-header">
          {availableTabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="tabs-content">
          {availableTabs.map(tab => (
            <div
              key={tab.id}
              className={`tab-panel ${activeTab === tab.id ? 'active' : ''}`}
            >
              <div className="analysis-text">
                {formatSectionContent(tab.content)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render analysis card component
  const renderAnalysisCard = (analysis, index, totalCount) => {
    const isAnalyzing = analyzingAnalyses[analysis.id] || false;
    const progress = analysisProgress[analysis.id] || 0;
    // Check if analysis_result exists and is a non-empty string
    const hasAnalysis = analysis.analysis_result && 
                        typeof analysis.analysis_result === 'string' && 
                        analysis.analysis_result.trim().length > 0;
    
    return (
      <div key={analysis.id || index} className="analysis-card">
        <div className="analysis-card-header">
          <div className="analysis-info">
            <div className="analysis-meta">
              <h3 className="analysis-title">
                {hasAnalysis ? (
                  <>Report generated on {new Date(analysis.created_at).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}</>
                ) : (
                  <>Text saved on {new Date(analysis.created_at).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}</>
                )}
              </h3>
            </div>
          </div>
        </div>

        {isAnalyzing && (
          <div className="analysis-progress-container">
            <div className="analyzing-indicator">
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.416" strokeDashoffset="31.416">
                  <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                  <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                </circle>
              </svg>
              <span>Analysis in progress...</span>
            </div>
            <div className="analysis-progress-bar">
              <div 
                className="analysis-progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="analysis-progress-text">{Math.round(progress)}%</div>
          </div>
        )}

        <div className="analysis-details">
          <div className="analysis-content">
            {hasAnalysis ? (
              analysis.text_type === 'written' || !analysis.text_type ? (
                <WrittenAnalysisDashboard analysisResult={analysis.analysis_result} />
              ) : (
                <AnalysisTabs analysisResult={analysis.analysis_result} />
              )
            ) : (
              <div className="analysis-empty">
                <div className="new-texts-available">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10,9 9,9 8,9"></polyline>
                  </svg>
                  <p><strong>New texts available</strong></p>
                  <p>Launch analysis</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Student view - show analyses
  if (userRole === 'student') {
    return (
      <div className="dashboard-page">
        <div className="page-background">
          <div className="page-gradient"></div>
          <div className="page-pattern"></div>
        </div>
        
        <div className="page-container">
          <div className="page-header">
            <div className="page-header-content">
              <div className="page-header-left">
                <div className="page-badge">
                  <div className="badge-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0L10.5 5.5L16 8L10.5 10.5L8 16L5.5 10.5L0 8L5.5 5.5L8 0Z"/>
                    </svg>
                  </div>
                  <span>Progress tracking</span>
                </div>
                
                <h1 className="page-title">
                  My <span className="gradient-text">Progress</span>
                </h1>
                
                <p className="page-description">
                  View your text analyses and track your French progress 
                  with artificial intelligence.
                </p>
              </div>
              
              <div className="page-header-right">
                {mostRecentWritten && (
                  <div className="analyze-buttons-group">
                    <button
                      className={`btn btn-primary btn-lg ${analyzingAnalyses[mostRecentWritten.id] ? 'btn-loading' : ''}`}
                      onClick={() => handleAnalyze(mostRecentWritten)}
                      disabled={analyzingAnalyses[mostRecentWritten.id]}
                    >
                      {analyzingAnalyses[mostRecentWritten.id] ? (
                        <>
                          <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.416" strokeDashoffset="31.416">
                              <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                              <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                            </circle>
                          </svg>
                          Written analysis in progress...
                        </>
                      ) : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                          </svg>
                          Analyze written text
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {analyses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="empty-title">No analysis available</h3>
              <p className="empty-description">
                Submit your first text in the "Written Analysis" tab 
                to start your learning journey.
              </p>
              <div className="empty-actions">
                <a href="/written-analysis" className="btn btn-primary">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
                  </svg>
                  Start analysis
                </a>
              </div>
            </div>
          ) : (
            <div className="progress-columns">
              {/* Written Analyses Column */}
              <div className="progress-column">
                <div className="analyses-list">
                  {writtenAnalyses.length === 0 ? (
                    <div className="column-empty">
                      <p>No written analysis available</p>
                    </div>
                  ) : (
                    writtenAnalyses.map((analysis, index) => 
                      renderAnalysisCard(analysis, index, writtenAnalyses.length)
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">
          📊 Dashboard {userRole === 'admin' ? 'Admin' : 'Teacher'}
        </h1>
        <p className="page-description">
          Manage and analyze your students' progress
        </p>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card stat-students">
          <div className="stat-header">
            <div className="stat-icon-wrapper">
              <div className="stat-icon">👥</div>
            </div>
            <div className="stat-info">
              <div className="stat-label">Students</div>
              <div className="stat-value">{students.length}</div>
            </div>
          </div>
          <div className="stat-progress">
            <div className="progress-bar" style={{width: '75%'}}></div>
          </div>
        </div>

        <div className="stat-card stat-texts">
          <div className="stat-header">
            <div className="stat-icon-wrapper">
              <div className="stat-icon">📝</div>
            </div>
            <div className="stat-info">
              <div className="stat-label">Total texts</div>
              <div className="stat-value">
                {students.reduce((sum, s) => sum + s.textsCount, 0)}
              </div>
            </div>
          </div>
          <div className="stat-progress">
            <div className="progress-bar" style={{width: '60%'}}></div>
          </div>
        </div>

        <div className="stat-card stat-average">
          <div className="stat-header">
            <div className="stat-icon-wrapper">
              <div className="stat-icon">📊</div>
            </div>
            <div className="stat-info">
              <div className="stat-label">Average/student</div>
              <div className="stat-value">
                {Math.round(students.reduce((sum, s) => sum + s.textsCount, 0) / students.length || 0)}
              </div>
            </div>
          </div>
          <div className="stat-progress">
            <div className="progress-bar" style={{width: '85%'}}></div>
          </div>
        </div>

        <div className="stat-card stat-active">
          <div className="stat-header">
            <div className="stat-icon-wrapper">
              <div className="stat-icon">✅</div>
            </div>
            <div className="stat-info">
              <div className="stat-label">Active</div>
              <div className="stat-value">{students.length}</div>
            </div>
          </div>
          <div className="stat-progress">
            <div className="progress-bar" style={{width: '95%'}}></div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="section">
        <h2 className="section-title">👥 Students List</h2>
        
        {students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3 className="empty-title">No students assigned</h3>
            <p className="empty-description">
              {userRole === 'teacher' 
                ? "Students can choose you as their teacher during registration or from their profile."
                : "No students have registered on the platform yet."}
            </p>
          </div>
        ) : (
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Texts submitted</th>
                  <th>Last activity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={index}>
                    <td>
                      {student.email}
                      {student.hasNewTexts && (
                        <span className="new-badge">New</span>
                      )}
                    </td>
                    <td>{student.textsCount}</td>
                    <td>{new Date(student.lastActivity).toLocaleDateString('en-US')}</td>
                    <td>
                      {student.hasNewTexts ? (
                        <span className="status-badge status-new">📝 New texts</span>
                      ) : (
                        <span className="status-badge status-ok">✓ Up to date</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setSelectedStudent(student)}
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Student details</h2>
              <button
                className="modal-close"
                onClick={() => setSelectedStudent(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p><strong>Email:</strong> {selectedStudent.email}</p>
              <p><strong>Texts submitted:</strong> {selectedStudent.textsCount}</p>
              <p><strong>Last activity:</strong> {selectedStudent.lastActivity}</p>
              <button className="btn btn-primary mt-3">
                🔍 Launch analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

