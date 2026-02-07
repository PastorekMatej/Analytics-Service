/**
 * Corrections Service
 * Handles fetching and transforming correction data from analyses
 */

import { getStudentAnalyses } from './analysisService';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://127.0.0.1:8000/api';

/**
 * Parse score and CECRL level from JSON format (prompt_v6.md) or markdown format
 * @param {string|Object} textOrJson - JSON string/object or Markdown/text analysis result
 * @param {string} date - Date of the analysis (YYYY-MM-DD)
 * @returns {Object} Object with score and cecrlLevel
 */
const parseScoreAndCECRL = (textOrJson, date) => {
  let score = null;
  let cecrlLevel = null;
  
  if (!textOrJson) {
    return { score: null, cecrlLevel: null };
  }
  
  try {
    // Try to parse as JSON first (prompt_v6.md format)
    let jsonData = null;
    if (typeof textOrJson === 'string') {
      const trimmed = textOrJson.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          jsonData = JSON.parse(textOrJson);
        } catch (e) {
          // Not JSON, will try markdown parsing below
        }
      }
    } else if (typeof textOrJson === 'object') {
      jsonData = textOrJson;
    }
    
    // If we have JSON data, parse from prompt_v6.md format
    if (jsonData && jsonData.evolution_globale) {
      const evolutionGlobale = jsonData.evolution_globale;
      
      // Try to find evaluation for the specific date
      if (Array.isArray(evolutionGlobale.evaluations_numeriques)) {
        // Look for exact date match
        const evaluation = evolutionGlobale.evaluations_numeriques.find(
          evalItem => evalItem.date === date
        );
        
        if (evaluation) {
          score = evaluation.score;
          cecrlLevel = evaluation.niveau;
          console.log(`[Corrections] Found score from JSON for date ${date}: ${score}/100 (${cecrlLevel})`);
        } else {
          // Use the most recent evaluation (last in array)
          const evaluations = evolutionGlobale.evaluations_numeriques;
          if (evaluations.length > 0) {
            const lastEval = evaluations[evaluations.length - 1];
            score = lastEval.score;
            cecrlLevel = lastEval.niveau;
            console.log(`[Corrections] Using most recent evaluation from JSON: ${score}/100 (${cecrlLevel})`);
          }
        }
      }
      
      // Fallback: extract from evolution_de_niveau if no evaluations found
      if (score === null && evolutionGlobale.evolution_de_niveau) {
        const niveauMatch = evolutionGlobale.evolution_de_niveau.match(/([A-Z]\d[+]?)\s*→\s*([A-Z]\d[+]?)/i);
        if (niveauMatch) {
          cecrlLevel = niveauMatch[2].toUpperCase();
          // Map CECRL level to approximate score
          const levelScores = {
            'A1': 4, 'A1+': 13, 'A2': 21, 'A2+': 30,
            'B1': 38, 'B1+': 47, 'B2': 55, 'B2+': 63,
            'C1': 72, 'C1+': 80, 'C2': 88, 'C2+': 97
          };
          score = levelScores[cecrlLevel] || 50;
          console.log(`[Corrections] Extracted from JSON niveau evolution: ${score}/100 (${cecrlLevel})`);
        }
      }
      
      return { score, cecrlLevel };
    }
    
    // Fallback to markdown/text parsing for legacy format
    if (typeof textOrJson === 'string') {
      const text = textOrJson;
      // Extract ÉVOLUTION_GLOBALE section
      const evolutionMatch = text.match(/ÉVOLUTION_GLOBALE[:\s]*([\s\S]*?)(?=TENDANCES|ERREURS_RÉCURRENTES|ERREURS_PERSISTANTES|$)/i);
      if (evolutionMatch) {
        const evolutionSection = evolutionMatch[1];
        console.log('[Corrections] Found ÉVOLUTION_GLOBALE section, length:', evolutionSection.length);
        
        // Look for score for the specific date: "YYYY-MM-DD: score/100 (level)"
        // Try multiple date formats
        const dateVariations = [
          date, // Original format YYYY-MM-DD
          date.replace(/-/g, '/'), // YYYY/MM/DD
          date.substring(0, 7) // YYYY-MM (partial match)
        ];
        
        for (const dateVar of dateVariations) {
          const datePattern = dateVar.replace(/[-/]/g, '[-/]');
          const scoreMatch = evolutionSection.match(new RegExp(`${datePattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[:\\s]+(\\d+)/100\\s*\\(([A-Z]\\d[+]?)\\)`, 'i'));
          
          if (scoreMatch) {
            score = parseInt(scoreMatch[1], 10);
            cecrlLevel = scoreMatch[2].toUpperCase();
            console.log(`[Corrections] Found score for date ${dateVar}: ${score}/100 (${cecrlLevel})`);
            break;
          }
        }
        
        // If no match for specific date, try to find the most recent score (last one in the list)
        if (score === null) {
          const allScores = evolutionSection.match(/(\d{4}[-/]\d{2}[-/]\d{2})[:\s]+(\d+)\/100\s*\(([A-Z]\d[+]?)\)/gi);
          if (allScores && allScores.length > 0) {
            const lastScore = allScores[allScores.length - 1];
            const lastMatch = lastScore.match(/(\d+)\/100\s*\(([A-Z]\d[+]?)\)/i);
            if (lastMatch) {
              score = parseInt(lastMatch[1], 10);
              cecrlLevel = lastMatch[2].toUpperCase();
              console.log(`[Corrections] Using most recent score: ${score}/100 (${cecrlLevel})`);
            }
          }
        }
        
        // If still no score, try to extract from "évolution de niveau" line
        if (score === null) {
          const niveauMatch = evolutionSection.match(/évolution de niveau[:\s]*["']?([A-Z]\d[+]?)\s*→\s*([A-Z]\d[+]?)/i);
          if (niveauMatch) {
            cecrlLevel = niveauMatch[2].toUpperCase();
            // Map CECRL level to approximate score
            const levelScores = {
              'A1': 4, 'A1+': 13, 'A2': 21, 'A2+': 30,
              'B1': 38, 'B1+': 47, 'B2': 55, 'B2+': 63,
              'C1': 72, 'C1+': 80, 'C2': 88, 'C2+': 97
            };
            score = levelScores[cecrlLevel] || 50;
            console.log(`[Corrections] Extracted from niveau evolution: ${score}/100 (${cecrlLevel})`);
          }
        }
        
        if (score === null) {
          console.log('[Corrections] Could not extract score from ÉVOLUTION_GLOBALE section');
        }
      } else {
        console.log('[Corrections] No ÉVOLUTION_GLOBALE section found in analysis result');
      }
    }
  } catch (error) {
    console.error('[Corrections] Error parsing score and CECRL:', error);
  }
  
  return { score, cecrlLevel };
};

/**
 * Parse markdown/text format analysis result
 * @param {string} text - Markdown/text analysis result
 * @param {string} analysisId - Analysis ID
 * @returns {Array} Array of correction objects
 */
const parseMarkdownAnalysis = (text, analysisId) => {
  const corrections = [];
  
  if (!text || typeof text !== 'string') {
    return corrections;
  }
  
  try {
    // Extract ERREURS_RÉCURRENTES section
    const erreursRecurrentesMatch = text.match(/ERREURS_RÉCURRENTES[:\s]*([\s\S]*?)(?=ERREURS_PERSISTANTES|CONCLUSION|ÉVOLUTION_GLOBALE|TENDANCES|$)/i);
    if (erreursRecurrentesMatch) {
      const erreursSection = erreursRecurrentesMatch[1];
      
      // Parse GRAMMAIRE section
      const grammaireMatch = erreursSection.match(/GRAMMAIRE[:\s]*([\s\S]*?)(?=VOCABULAIRE|STYLE|$)/i);
      if (grammaireMatch) {
        corrections.push(...parseErrorCategory(grammaireMatch[1], 'grammar', analysisId));
      }
      
      // Parse VOCABULAIRE section
      const vocabulaireMatch = erreursSection.match(/VOCABULAIRE[:\s]*([\s\S]*?)(?=STYLE|GRAMMAIRE|$)/i);
      if (vocabulaireMatch) {
        corrections.push(...parseErrorCategory(vocabulaireMatch[1], 'vocabulary', analysisId));
      }
      
      // Parse STYLE section
      const styleMatch = erreursSection.match(/STYLE[:\s]*([\s\S]*?)(?=GRAMMAIRE|VOCABULAIRE|$)/i);
      if (styleMatch) {
        corrections.push(...parseErrorCategory(styleMatch[1], 'style', analysisId));
      }
    } else {
      console.log('[Corrections] No ERREURS_RÉCURRENTES section found');
    }
    
    // Extract ERREURS_PERSISTANTES section
    const erreursPersistantesMatch = text.match(/ERREURS_PERSISTANTES[:\s]*([\s\S]*?)(?=CONCLUSION|ÉVOLUTION_GLOBALE|TENDANCES|$)/i);
    if (erreursPersistantesMatch) {
      const persistantesSection = erreursPersistantesMatch[1];
      console.log('[Corrections] Found ERREURS_PERSISTANTES section');
      
      // Parse persistent errors - format: "- G06 (description): "exemple1" → "correction1"; "exemple2" → "correction2""
      const persistentCorrections = parsePersistentErrors(persistantesSection, analysisId);
      corrections.push(...persistentCorrections);
      console.log(`[Corrections] Parsed ${persistentCorrections.length} persistent errors`);
    } else {
      console.log('[Corrections] No ERREURS_PERSISTANTES section found');
    }
    
    console.log(`[Corrections] Total parsed ${corrections.length} corrections from markdown`);
  } catch (error) {
    console.error('[Corrections] Error parsing markdown:', error);
  }
  
  return corrections;
};

/**
 * Parse persistent errors from ERREURS_PERSISTANTES section
 * Format: "- G06 (description): "exemple1" → "correction1"; "exemple2" → "correction2""
 * @param {string} sectionText - Text content of ERREURS_PERSISTANTES section
 * @param {string} analysisId - Analysis ID
 * @returns {Array} Array of correction objects with severity 'high'
 */
const parsePersistentErrors = (sectionText, analysisId) => {
  const corrections = [];
  
  if (!sectionText) return corrections;
  
  // Split by lines starting with "- " (error entries)
  const lines = sectionText.split('\n').map(l => l.trim()).filter(l => l);
  
  lines.forEach((line, lineIndex) => {
    // Match format: "- G06 (description): "exemple1" → "correction1"; "exemple2" → "correction2""
    const errorMatch = line.match(/^[-•]\s*([GSV]\d{2})\s*\(([^)]+)\):\s*(.+)$/i);
    if (!errorMatch) return;
    
    const errorType = errorMatch[1].toUpperCase();
    const description = errorMatch[2].trim();
    const examplesText = errorMatch[3].trim();
    
    // Determine category from error type
    let category = 'general';
    if (errorType.startsWith('G')) category = 'grammar';
    else if (errorType.startsWith('V')) category = 'vocabulary';
    else if (errorType.startsWith('S')) category = 'style';
    
    // Split examples by semicolon, but be careful with quotes
    // Use a smarter split that respects quoted strings
    const examplePairs = [];
    let currentPair = '';
    let inQuotes = false;
    let quoteChar = null;
    
    for (let i = 0; i < examplesText.length; i++) {
      const char = examplesText[i];
      const prevChar = i > 0 ? examplesText[i - 1] : '';
      
      // Toggle quote state
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
          quoteChar = null;
        }
      }
      
      // Split on semicolon only if not inside quotes
      if (char === ';' && !inQuotes) {
        if (currentPair.trim()) {
          examplePairs.push(currentPair.trim());
        }
        currentPair = '';
      } else {
        currentPair += char;
      }
    }
    
    // Add the last pair
    if (currentPair.trim()) {
      examplePairs.push(currentPair.trim());
    }
    
    examplePairs.forEach((examplePair, exampleIndex) => {
      
      // Clean up date patterns like (2025-04-12) or (2025-02-20) - remove them from the example pair
      // But preserve them if they're part of a correction explanation
      let cleanedPair = examplePair;
      // Remove date patterns at the end: (YYYY-MM-DD) or (YYYY-MM-DD; YYYY-MM-DD)
      cleanedPair = cleanedPair.replace(/\s*\(\d{4}-\d{2}-\d{2}(?:\s*;\s*\d{4}-\d{2}-\d{2})*\)\s*$/, '').trim();
      // Also remove date patterns in the middle if they're standalone
      cleanedPair = cleanedPair.replace(/\s*\(\d{4}-\d{2}-\d{2}\)\s*/g, ' ').trim();
      
      // Skip examples that don't have arrows or "pour" - these are examples without corrections
      // These are likely just examples without corrections (just quoted text or descriptions)
      if (!cleanedPair.includes('→') && !cleanedPair.includes('pour') && !cleanedPair.match(/["'][^"']*["']\s*→/)) {
        // Check if it's just a quoted string (possibly with description in parentheses)
        // Handle apostrophes inside quotes: match opening quote, then any chars except the closing quote, then closing quote
        // Use a more robust approach: find the first quote, then match until the matching closing quote
        let quotedOnlyMatch = null;
        const firstQuote = cleanedPair[0];
        if (firstQuote === '"' || firstQuote === "'") {
          // Find the matching closing quote
          let quoteEnd = -1;
          for (let i = 1; i < cleanedPair.length; i++) {
            if (cleanedPair[i] === firstQuote && cleanedPair[i - 1] !== '\\') {
              quoteEnd = i;
              break;
            }
          }
          if (quoteEnd > 0) {
            const afterQuote = cleanedPair.substring(quoteEnd + 1).trim();
            // Check if there's only optional parentheses after the quote
            if (!afterQuote || afterQuote.match(/^(?:\([^)]+\))?\s*$/)) {
              quotedOnlyMatch = [cleanedPair, cleanedPair.substring(1, quoteEnd)];
            }
          }
        }
        if (quotedOnlyMatch) {
          // Skip - this is just an example without correction
          return;
        }
        // Also skip if it's just plain text without quotes (descriptions)
        // But only if it doesn't look like it has a correction pattern
        if (!cleanedPair.match(/["']/) && cleanedPair.length > 5) {
          // Skip plain text descriptions without corrections
          return;
        }
      }
      
      // Use cleaned pair for further processing
      examplePair = cleanedPair;
      
      // First, try to find pattern: "text" → "text" directly using regex (most reliable)
      // This handles cases like "c'est de moi venir travailler" → "ma hiérarchie me demande de venir travailler"
      // Try multiple regex patterns to handle different quote types and spacing
      let directArrowMatch = examplePair.match(/["']([^"']*(?:'[^"']*)*)["']\s*→\s*["']([^"']*(?:'[^"']*)*)["']/);
      if (!directArrowMatch) {
        // Try with different arrow character or more flexible spacing
        directArrowMatch = examplePair.match(/["']([^"']*(?:'[^"']*)*)["']\s*[→-]\s*["']([^"']*(?:'[^"']*)*)["']/);
      }
      if (!directArrowMatch) {
        // Try with typographic quotes
        directArrowMatch = examplePair.match(/[""'']([^""''']*(?:'[^""''']*)*)[""''']\s*→\s*[""'']([^""''']*(?:'[^""''']*)*)[""''']/);
      }
      
      if (directArrowMatch) {
        let original = directArrowMatch[1].trim();
        let corrected = directArrowMatch[2].trim();
        
        // Clean any remaining date patterns
        original = original.replace(/\s*\(\d{4}-\d{2}-\d{2}\)\s*$/, '').trim();
        corrected = corrected.replace(/\s*\(\d{4}-\d{2}-\d{2}\)\s*$/, '').trim();
        
        if (original && corrected && original !== corrected) {
          corrections.push({
            id: `${analysisId}_persistent_${errorType}_${lineIndex}_${exampleIndex}`,
            original: original,
            corrected: corrected,
            errorType: formatErrorType(errorType, category),
            teacherComment: description || `Erreur persistante ${errorType}`,
            severity: 'high',
            isPersistent: true
          });
          console.log(`[Corrections] Parsed persistent error ${errorType}: "${original}" → "${corrected}"`);
          return;
        }
      }
      
      // Format 1: "original" → "corrected" (with quotes on both sides)
      // Improved regex to handle quotes with apostrophes: "je suis l'employé" → "je suis une employée"
      // Use a more robust approach: find quoted strings manually
      let qStart = -1;
      let qChar = null;
      const quotedStrings = [];
      
      for (let i = 0; i < examplePair.length; i++) {
        const char = examplePair[i];
        const prevChar = i > 0 ? examplePair[i - 1] : '';
        
        if ((char === '"' || char === "'") && prevChar !== '\\') {
          if (qStart === -1) {
            qStart = i + 1;
            qChar = char;
          } else if (char === qChar) {
            const quotedText = examplePair.substring(qStart, i);
            quotedStrings.push({ text: quotedText, start: qStart - 1, end: i });
            qStart = -1;
            qChar = null;
          }
        }
      }
      
      // If we found two quoted strings with → between them
      if (quotedStrings.length >= 2) {
        const arrowIndex = examplePair.indexOf('→');
        // Check if arrow is between the two quoted strings (more flexible check)
        if (arrowIndex > quotedStrings[0].end && arrowIndex < quotedStrings[1].start) {
          const original = quotedStrings[0].text.trim();
          const corrected = quotedStrings[1].text.trim();
          
          if (original && corrected && original !== corrected) {
            corrections.push({
              id: `${analysisId}_persistent_${errorType}_${lineIndex}_${exampleIndex}`,
              original: original,
              corrected: corrected,
              errorType: formatErrorType(errorType, category),
              teacherComment: description || `Erreur persistante ${errorType}`,
              severity: 'high',
              isPersistent: true
            });
            console.log(`[Corrections] Parsed persistent error ${errorType}: "${original}" → "${corrected}"`);
            return;
          }
        }
        // Also check if arrow is after first quote and before second quote (even if not exactly between)
        else if (arrowIndex > quotedStrings[0].start && arrowIndex < quotedStrings[1].end && arrowIndex > quotedStrings[0].end) {
          const original = quotedStrings[0].text.trim();
          // Try to extract corrected text from second quoted string or after arrow
          let corrected = '';
          if (quotedStrings[1]) {
            corrected = quotedStrings[1].text.trim();
          } else {
            // Extract text after arrow, removing quotes
            corrected = examplePair.substring(arrowIndex + 1).trim();
            corrected = corrected.replace(/^["']|["']$/g, '').trim();
          }
          
          if (original && corrected && original !== corrected) {
            corrections.push({
              id: `${analysisId}_persistent_${errorType}_${lineIndex}_${exampleIndex}`,
              original: original,
              corrected: corrected,
              errorType: formatErrorType(errorType, category),
              teacherComment: description || `Erreur persistante ${errorType}`,
              severity: 'high',
              isPersistent: true
            });
            console.log(`[Corrections] Parsed persistent error ${errorType}: "${original}" → "${corrected}"`);
            return;
          }
        }
      }
      
      // Special case: one quoted string before → and one after (even if not detected as pairs)
      if (quotedStrings.length >= 1 && examplePair.includes('→')) {
        const arrowIndex = examplePair.indexOf('→');
        // If arrow is after the first quoted string, try to find second quoted string after arrow
        if (arrowIndex > quotedStrings[0].end) {
          // Look for quoted string after arrow
          const afterArrow = examplePair.substring(arrowIndex + 1);
          const afterArrowQuotedMatch = afterArrow.match(/["']([^"']*(?:'[^"']*)*)["']/);
          if (afterArrowQuotedMatch) {
            const original = quotedStrings[0].text.trim();
            const corrected = afterArrowQuotedMatch[1].trim();
            
            if (original && corrected && original !== corrected) {
              corrections.push({
                id: `${analysisId}_persistent_${errorType}_${lineIndex}_${exampleIndex}`,
                original: original,
                corrected: corrected,
                errorType: formatErrorType(errorType, category),
                teacherComment: description || `Erreur persistante ${errorType}`,
                severity: 'high',
                isPersistent: true
              });
              console.log(`[Corrections] Parsed persistent error ${errorType}: "${original}" → "${corrected}"`);
              return;
            }
          }
        }
      }
      
      // Fallback to regex if manual parsing didn't work
      let arrowMatch = examplePair.match(/["']([^"']*(?:'[^"']*)*)["']\s*→\s*["']([^"']*(?:'[^"']*)*)["']/);
      if (arrowMatch) {
        let original = arrowMatch[1].trim();
        let corrected = arrowMatch[2].trim();
        
        if (original && corrected && original !== corrected) {
          corrections.push({
            id: `${analysisId}_persistent_${errorType}_${lineIndex}_${exampleIndex}`,
            original: original,
            corrected: corrected,
            errorType: formatErrorType(errorType, category),
            teacherComment: description || `Erreur persistante ${errorType}`,
            severity: 'high',
            isPersistent: true
          });
          console.log(`[Corrections] Parsed persistent error ${errorType}: "${original}" → "${corrected}"`);
        }
        return;
      }
      
      // Format 2: "original" → corrected (with quotes only on left)
      // Handle quotes with apostrophes: "je suis l'employé" → "je suis une employée"
      // Use manual parsing for better accuracy
      if (quotedStrings.length >= 1) {
        const arrowIndex = examplePair.indexOf('→');
        if (arrowIndex > quotedStrings[0].end) {
          const original = quotedStrings[0].text.trim();
          // Extract corrected text after the arrow
          let corrected = examplePair.substring(arrowIndex + 1).trim();
          
          // Check if there's a quoted string after the arrow - use it if found
          const afterArrowQuotedMatch = corrected.match(/^["']([^"']*(?:'[^"']*)*)["']/);
          if (afterArrowQuotedMatch) {
            corrected = afterArrowQuotedMatch[1].trim();
          } else {
            // Remove any trailing comments in parentheses
            corrected = corrected.replace(/\s*\([^)]*\)\s*$/, '').trim();
            // Remove any trailing quotes
            corrected = corrected.replace(/["']$/, '').trim();
            // Remove any trailing semicolons or commas
            corrected = corrected.replace(/[;,]\s*$/, '').trim();
          }
          
          if (original && corrected && original !== corrected && original.length > 2 && corrected.length > 2) {
            corrections.push({
              id: `${analysisId}_persistent_${errorType}_${lineIndex}_${exampleIndex}`,
              original: original,
              corrected: corrected,
              errorType: formatErrorType(errorType, category),
              teacherComment: description || `Erreur persistante ${errorType}`,
              severity: 'high',
              isPersistent: true
            });
            console.log(`[Corrections] Parsed persistent error ${errorType}: "${original}" → "${corrected}"`);
            return;
          }
        }
      }
      
      // Fallback to regex
      arrowMatch = examplePair.match(/["']([^"']*(?:'[^"']*)*)["']\s*→\s*([^→\n;]+?)(?:\s*\([^)]*\)\s*$|$)/);
      if (arrowMatch) {
        let original = arrowMatch[1].trim();
        let corrected = arrowMatch[2].trim();
        
        // Clean up corrected (remove trailing comments in parentheses, etc.)
        corrected = corrected.replace(/\s*\([^)]*\)\s*$/, '').trim();
        // Remove any trailing quotes
        corrected = corrected.replace(/["']$/, '').trim();
        
        if (original && corrected && original !== corrected && original.length > 2) {
          corrections.push({
            id: `${analysisId}_persistent_${errorType}_${lineIndex}_${exampleIndex}`,
            original: original,
            corrected: corrected,
            errorType: formatErrorType(errorType, category),
            teacherComment: description || `Erreur persistante ${errorType}`,
            severity: 'high',
            isPersistent: true
          });
          console.log(`[Corrections] Parsed persistent error ${errorType}: "${original}" → "${corrected}"`);
        }
        return;
      }
      
      // Format 3: original → corrected (without quotes)
      arrowMatch = examplePair.match(/([^→\n]+?)\s*→\s*([^→\n]+?)(?:\s*\(|$)/);
      if (arrowMatch) {
        let original = arrowMatch[1].trim().replace(/^["']|["']$/g, '');
        let corrected = arrowMatch[2].trim().replace(/^["']|["']$/g, '');
        
        // Clean up
        corrected = corrected.replace(/\s*\([^)]*\)\s*$/, '').trim();
        
        if (original && corrected && original !== corrected && original.length > 2) {
          corrections.push({
            id: `${analysisId}_persistent_${errorType}_${lineIndex}_${exampleIndex}`,
            original: original,
            corrected: corrected,
            errorType: formatErrorType(errorType, category),
            teacherComment: description || `Erreur persistante ${errorType}`,
            severity: 'high',
            isPersistent: true // Mark as persistent error
          });
          console.log(`[Corrections] Parsed persistent error ${errorType}: "${original}" → "${corrected}"`);
        }
        return;
      }
      
      // Format 4: "word" pour "correction" (format without arrow, using "pour")
      // Example: "bénévole" pour "bénéfique"
      // Use manual parsing if we have two quoted strings
      if (quotedStrings.length >= 2) {
        const pourIndex = examplePair.indexOf('pour', quotedStrings[0].end);
        if (pourIndex > quotedStrings[0].end && pourIndex < quotedStrings[1].start) {
          const original = quotedStrings[0].text.trim();
          const corrected = quotedStrings[1].text.trim();
          
          if (original && corrected && original !== corrected) {
            corrections.push({
              id: `${analysisId}_persistent_${errorType}_${lineIndex}_${exampleIndex}`,
              original: original,
              corrected: corrected,
              errorType: formatErrorType(errorType, category),
              teacherComment: description || `Erreur persistante ${errorType}`,
              severity: 'high',
              isPersistent: true
            });
            console.log(`[Corrections] Parsed persistent error ${errorType}: "${original}" pour "${corrected}"`);
            return;
          }
        }
      }
      
      // Fallback to regex
      const pourMatch = examplePair.match(/["']([^"']*(?:'[^"']*)*)["']\s+pour\s+["']([^"']*(?:'[^"']*)*)["']/i);
      if (pourMatch) {
        const original = pourMatch[1].trim();
        const corrected = pourMatch[2].trim();
        
        if (original && corrected && original !== corrected) {
          corrections.push({
            id: `${analysisId}_persistent_${errorType}_${lineIndex}_${exampleIndex}`,
            original: original,
            corrected: corrected,
            errorType: formatErrorType(errorType, category),
            teacherComment: description || `Erreur persistante ${errorType}`,
            severity: 'high',
            isPersistent: true
          });
          console.log(`[Corrections] Parsed persistent error ${errorType}: "${original}" pour "${corrected}"`);
        }
        return;
      }
      
      // Format 5: "word" (comment) → correction
      // Example: "je pouvais" (intention/projet) → "je pourrais"
      // First try direct regex match for this pattern with quotes on both sides
      const parenArrowQuotedMatch = examplePair.match(/["']([^"']*(?:'[^"']*)*)["']\s*\([^)]+\)\s*→\s*["']([^"']*(?:'[^"']*)*)["']/);
      if (parenArrowQuotedMatch) {
        const original = parenArrowQuotedMatch[1].trim();
        const corrected = parenArrowQuotedMatch[2].trim();
        
        if (original && corrected && original !== corrected && original.length > 1 && corrected.length > 1) {
          corrections.push({
            id: `${analysisId}_persistent_${errorType}_${lineIndex}_${exampleIndex}`,
            original: original,
            corrected: corrected,
            errorType: formatErrorType(errorType, category),
            teacherComment: description || `Erreur persistante ${errorType}`,
            severity: 'high',
            isPersistent: true
          });
          console.log(`[Corrections] Parsed persistent error ${errorType}: "${original}" → "${corrected}"`);
          return;
        }
      }
      
      // Use manual parsing if we have a quoted string
      if (quotedStrings.length >= 1) {
        const arrowIndex = examplePair.indexOf('→');
        const parenIndex = examplePair.indexOf('(', quotedStrings[0].end);
        // Check if there's a parenthesis comment between the quote and the arrow
        if (arrowIndex > quotedStrings[0].end) {
          const original = quotedStrings[0].text.trim();
          let corrected = examplePair.substring(arrowIndex + 1).trim();
          
          // Check if corrected is in quotes
          const correctedQuotedMatch = corrected.match(/^["']([^"']*(?:'[^"']*)*)["']/);
          if (correctedQuotedMatch) {
            corrected = correctedQuotedMatch[1].trim();
          } else {
            corrected = corrected.replace(/^["']|["']$/g, '').trim();
            corrected = corrected.replace(/\s*\([^)]*\)\s*$/, '').trim();
            corrected = corrected.replace(/[;,]\s*$/, '').trim();
          }
          
          if (original && corrected && original !== corrected && original.length > 1 && corrected.length > 1) {
            corrections.push({
              id: `${analysisId}_persistent_${errorType}_${lineIndex}_${exampleIndex}`,
              original: original,
              corrected: corrected,
              errorType: formatErrorType(errorType, category),
              teacherComment: description || `Erreur persistante ${errorType}`,
              severity: 'high',
              isPersistent: true
            });
            console.log(`[Corrections] Parsed persistent error ${errorType}: "${original}" → "${corrected}"`);
            return;
          }
        }
      }
      
      // Fallback to regex
      arrowMatch = examplePair.match(/["']([^"']*(?:'[^"']*)*)["']\s*\([^)]+\)\s*→\s*([^→\n;]+?)(?:\s*$|$)/);
      if (arrowMatch) {
        let original = arrowMatch[1].trim();
        let corrected = arrowMatch[2].trim();
        corrected = corrected.replace(/^["']|["']$/g, '').trim();
        // Remove any trailing quotes or parentheses content
        corrected = corrected.replace(/\s*\([^)]*\)\s*$/, '').trim();
        
        if (original && corrected && original !== corrected && original.length > 1) {
          corrections.push({
            id: `${analysisId}_persistent_${errorType}_${lineIndex}_${exampleIndex}`,
            original: original,
            corrected: corrected,
            errorType: formatErrorType(errorType, category),
            teacherComment: description || `Erreur persistante ${errorType}`,
            severity: 'high',
            isPersistent: true
          });
          console.log(`[Corrections] Parsed persistent error ${errorType}: "${original}" → "${corrected}"`);
        }
        return;
      }
      
      // Format 6: "word" non francisé / non adapté (without explicit correction)
      // Example: "teambuilding" non francisé
      // Use manual parsing if we have a quoted string
      if (quotedStrings.length >= 1) {
        const nonFranciseMatch = examplePair.substring(quotedStrings[0].end + 1).match(/^\s+(non\s+[^,;]+)/i);
        if (nonFranciseMatch) {
          const original = quotedStrings[0].text.trim();
          const comment = nonFranciseMatch[1].trim();
          // Create a correction with a comment explaining the issue
          corrections.push({
            id: `${analysisId}_persistent_${errorType}_${lineIndex}_${exampleIndex}`,
            original: original,
            corrected: original, // Keep same, but add comment
            errorType: formatErrorType(errorType, category),
            teacherComment: `${description}. ${comment}.`,
            severity: 'high',
            isPersistent: true
          });
          console.log(`[Corrections] Parsed persistent error ${errorType}: "${original}" (${comment})`);
          return;
        }
      }
      
      // Fallback to regex
      const nonFranciseMatch = examplePair.match(/["']([^"']*(?:'[^"']*)*)["']\s+(non\s+[^,;]+)/i);
      if (nonFranciseMatch) {
        const original = nonFranciseMatch[1].trim();
        const comment = nonFranciseMatch[2].trim();
        // Create a correction with a comment explaining the issue
        corrections.push({
          id: `${analysisId}_persistent_${errorType}_${lineIndex}_${exampleIndex}`,
          original: original,
          corrected: original, // Keep same, but add comment
          errorType: formatErrorType(errorType, category),
          teacherComment: `${description}. ${comment}.`,
          severity: 'high',
          isPersistent: true
        });
        console.log(`[Corrections] Parsed persistent error ${errorType}: "${original}" (${comment})`);
        return;
      }
      
      // Format 7: Just quoted text without correction (descriptions) - create correction with description
      // Examples: "organiser une courte teambuilding", "développement des capacités… dans le futur"
      // Handle multiple quoted examples separated by comma: "ex1", "ex2"
      // Improved regex to handle quotes with apostrophes
      // BUT: Only create corrections if there's no arrow and it's not just a date reference
      const quotedExamples = [];
      let quoteStart = -1;
      let quoteChar = null;
      
      for (let i = 0; i < examplePair.length; i++) {
        const char = examplePair[i];
        const prevChar = i > 0 ? examplePair[i - 1] : '';
        
        if ((char === '"' || char === "'") && prevChar !== '\\') {
          if (quoteStart === -1) {
            quoteStart = i + 1;
            quoteChar = char;
          } else if (char === quoteChar) {
            const quotedText = examplePair.substring(quoteStart, i);
            if (quotedText.trim()) {
              quotedExamples.push(quotedText.trim());
            }
            quoteStart = -1;
            quoteChar = null;
          }
        }
      }
      
      // Format 7: Just quoted text without correction (descriptions) - ONLY if they have arrows elsewhere or are part of a list
      // Examples: "organiser une courte teambuilding", "développement des capacités… dans le futur"
      // BUT: We should NOT create corrections for these if they don't have arrows - they're just examples
      // This section should only handle cases where there ARE arrows but we're processing quoted examples separately
      // Since we already skip examples without arrows above, this section should rarely be reached
      if (quotedExamples.length > 0 && examplePair.includes('→')) {
        // Only process if there's an arrow - meaning there's a correction somewhere
        // This handles cases like: "ex1", "ex2" → "correction" (though this format is unlikely)
        // Skip for now - let other formats handle arrows
      }
      
      // Log unparsed examples for debugging
      if (examplePair.length > 5) {
        console.log(`[Corrections] Could not parse persistent error example for ${errorType}: "${examplePair}"`);
      }
    });
  });
  
  return corrections;
};

/**
 * Parse errors from a category section (GRAMMAIRE, VOCABULAIRE, STYLE)
 * @param {string} sectionText - Text content of the category section
 * @param {string} category - Category name (grammar, vocabulary, style)
 * @param {string} analysisId - Analysis ID
 * @returns {Array} Array of correction objects
 */
const parseErrorCategory = (sectionText, category, analysisId) => {
  const corrections = [];
  
  if (!sectionText) return corrections;
  
  // Split by markdown headers (#### G06 - Description) or legacy format (type:)
  // First try markdown format: #### G06 - Description
  const markdownHeaderRegex = /(?:^|\n)\s*####\s*([GSV]\d{2})\s*-\s*([^\n(]+?)(?:\s*\([^)]+\))?\s*$/gmi;
  const markdownMatches = [];
  let match;
  
  // Find all markdown headers
  while ((match = markdownHeaderRegex.exec(sectionText)) !== null) {
    markdownMatches.push({
      index: match.index,
      errorType: match[1].toUpperCase(),
      errorName: match[2].trim(),
      fullMatch: match[0]
    });
  }
  
  // If we found markdown headers, use them
  if (markdownMatches.length > 0) {
    for (let i = 0; i < markdownMatches.length; i++) {
      const currentMatch = markdownMatches[i];
      const nextMatch = markdownMatches[i + 1];
      
      // Extract block content between this header and the next one
      const blockStart = currentMatch.index + currentMatch.fullMatch.length;
      const blockEnd = nextMatch ? nextMatch.index : sectionText.length;
      const block = sectionText.substring(blockStart, blockEnd);
      
      const extractedErrorType = currentMatch.errorType;
      let fullErrorName = currentMatch.errorName;
      // Remove trailing " (X occurrences)" if present
      fullErrorName = fullErrorName.replace(/\s*\(\d+\s+occurrences?\)\s*$/i, '').trim();
      
      // Use full error name
      const displayErrorType = `${extractedErrorType} - ${fullErrorName}`;
      
      // Parse examples from this block
      const rawLines = block.split('\n');
      const lines = rawLines.map(l => l.trim()).filter(l => l && !l.match(/^[-•]\s*$/));
      
      let exemplesStartIndex = -1;
      lines.forEach((line, lineIndex) => {
        if (line.toLowerCase().includes('exemples:') || line.toLowerCase().includes('exemple:')) {
          exemplesStartIndex = lineIndex + 1;
        }
      });
      
      if (exemplesStartIndex >= 0) {
        const exempleLines = lines.slice(exemplesStartIndex);
        
        exempleLines.forEach((line, exempleIndex) => {
          // Stop if we hit the next error type header
          if (line.match(/^####\s*([GSV]\d{2})/i)) {
            return;
          }
          
          // Skip lines that are not examples
          if (line.toLowerCase().includes('occurrences:') || 
              line.toLowerCase().includes('pattern:') ||
              line.match(/^[-•]\s*$/)) {
            return;
          }
          
          // Try multiple formats for parsing examples
          // Remove leading "- " or "• " if present, and remove ❌/✅ emojis
          let cleanLine = line.replace(/^[-•]\s*/, '').trim();
          cleanLine = cleanLine.replace(/^[❌✅]\s*/, '').trim();
          
          // Format 1: "original" → "corrected" (with quotes on both sides)
          // Handle dates at the end: (2024-01-12)
          let arrowMatch = cleanLine.match(/["']([^"']+)["']\s*→\s*["']([^"']+)["'](?:\s*\([^)]+\))?/);
          if (arrowMatch) {
            let original = arrowMatch[1].trim();
            let corrected = arrowMatch[2].trim();
            // Remove bold markers (**) from corrected text
            corrected = corrected.replace(/\*\*/g, '');
            // Remove dates from both (format: (YYYY-MM-DD))
            original = original.replace(/\s*\(\d{4}-\d{2}-\d{2}\)\s*$/, '').trim();
            corrected = corrected.replace(/\s*\(\d{4}-\d{2}-\d{2}\)\s*$/, '').trim();
            
            if (original && corrected && original !== corrected) {
              corrections.push({
                id: `${analysisId}_${category}_${extractedErrorType}_${i}_${exempleIndex}`,
                original: original,
                corrected: corrected,
                errorType: displayErrorType,
                teacherComment: `Correction pour ${extractedErrorType}`,
                severity: determineSeverity(extractedErrorType)
              });
              return;
            }
          }
          
          // Format 2: "original" → corrected (with quotes only on left, arrow with space)
          arrowMatch = cleanLine.match(/["']([^"']+)["']\s*→\s*([^→\n]+?)(?:\s*\(|$)/);
          if (arrowMatch) {
            let original = arrowMatch[1].trim();
            let corrected = arrowMatch[2].trim();
            
            // Remove bold markers (**) from corrected text
            corrected = corrected.replace(/\*\*/g, '');
            // Remove dates from both (format: (YYYY-MM-DD))
            original = original.replace(/\s*\(\d{4}-\d{2}-\d{2}\)\s*$/, '').trim();
            corrected = corrected.replace(/\s*\(\d{4}-\d{2}-\d{2}\)\s*$/, '').trim();
            // Clean up corrected (remove trailing comments in parentheses, etc.)
            corrected = corrected.replace(/\s*\([^)]*\)\s*$/, '').trim();
            corrected = corrected.replace(/^mieux:\s*/i, '').trim();
            
            if (original && corrected && original !== corrected && original.length > 2) {
              corrections.push({
                id: `${analysisId}_${category}_${extractedErrorType}_${i}_${exempleIndex}`,
                original: original,
                corrected: corrected,
                errorType: displayErrorType,
                teacherComment: `Correction pour ${extractedErrorType}`,
                severity: determineSeverity(extractedErrorType)
              });
              return;
            }
          }
          
          // Format 3: original → corrected (without quotes, with arrow)
          arrowMatch = cleanLine.match(/([^→\n]+?)\s*→\s*([^→\n]+?)(?:\s*\(|$)/);
          if (arrowMatch) {
            let original = arrowMatch[1].trim().replace(/^["']|["']$/g, '');
            let corrected = arrowMatch[2].trim().replace(/^["']|["']$/g, '');
            
            // Remove bold markers (**) from corrected text
            corrected = corrected.replace(/\*\*/g, '');
            // Remove dates from both (format: (YYYY-MM-DD))
            original = original.replace(/\s*\(\d{4}-\d{2}-\d{2}\)\s*$/, '').trim();
            corrected = corrected.replace(/\s*\(\d{4}-\d{2}-\d{2}\)\s*$/, '').trim();
            // Clean up
            corrected = corrected.replace(/\s*\([^)]*\)\s*$/, '').trim();
            corrected = corrected.replace(/^mieux:\s*/i, '').trim();
            
            // Skip if it's just a description without actual correction
            if (original && corrected && original !== corrected && 
                original.length > 2 && corrected.length > 2 &&
                !original.toLowerCase().includes('suites de') &&
                !original.toLowerCase().includes('phrases')) {
              corrections.push({
                id: `${analysisId}_${category}_${extractedErrorType}_${i}_${exempleIndex}`,
                original: original,
                corrected: corrected,
                errorType: displayErrorType,
                teacherComment: `Correction pour ${extractedErrorType}`,
                severity: determineSeverity(extractedErrorType)
              });
              return;
            }
          }
          
          // Format 4: Multiple corrections in one line
          arrowMatch = cleanLine.match(/["']([^"']+)\s*\/\s*([^"']+)["']\s*→\s*["']([^"']+)\s*\/\s*([^"']+)["']/);
          if (arrowMatch) {
            const original1 = arrowMatch[1].trim();
            const original2 = arrowMatch[2].trim();
            let corrected1 = arrowMatch[3].trim();
            let corrected2 = arrowMatch[4].trim();
            corrected1 = corrected1.replace(/\*\*/g, '');
            corrected2 = corrected2.replace(/\*\*/g, '');
            
            if (original1 && corrected1 && original1 !== corrected1) {
              corrections.push({
                id: `${analysisId}_${category}_${extractedErrorType}_${i}_${exempleIndex}_1`,
                original: original1,
                corrected: corrected1,
                errorType: displayErrorType,
                teacherComment: `Correction pour ${extractedErrorType}`,
                severity: determineSeverity(extractedErrorType)
              });
            }
            
            if (original2 && corrected2 && original2 !== corrected2) {
              corrections.push({
                id: `${analysisId}_${category}_${extractedErrorType}_${i}_${exempleIndex}_2`,
                original: original2,
                corrected: corrected2,
                errorType: displayErrorType,
                teacherComment: `Correction pour ${extractedErrorType}`,
                severity: determineSeverity(extractedErrorType)
              });
            }
            return;
          }
          
          // Format 5: Single word/phrase with comment in parentheses
          arrowMatch = cleanLine.match(/["']([^"']+)["']\s*\([^)]+\)\s*→\s*([^→\n]+?)(?:\s*\(|$)/);
          if (arrowMatch) {
            const original = arrowMatch[1].trim();
            let corrected = arrowMatch[2].trim();
            corrected = corrected.replace(/\*\*/g, '');
            corrected = corrected.replace(/\s*\([^)]*\)\s*$/, '').trim();
            
            if (original && corrected && original !== corrected && original.length > 1) {
              corrections.push({
                id: `${analysisId}_${category}_${extractedErrorType}_${i}_${exempleIndex}`,
                original: original,
                corrected: corrected,
                errorType: displayErrorType,
                teacherComment: `Correction pour ${extractedErrorType}`,
                severity: determineSeverity(extractedErrorType)
              });
              return;
            }
          }
        });
      }
    }
  } else {
    // Fallback to legacy format - split by "type:" markers
    const legacyBlocks = sectionText.split(/(?:^|\n)\s*[-•]?\s*type:\s*/gmi);
    legacyBlocks.forEach((legacyBlock, blockIndex) => {
      if (blockIndex === 0) return;
      processLegacyBlock(legacyBlock, blockIndex, category, analysisId, corrections);
    });
  }
  
  console.log(`[Corrections] Total corrections parsed for ${category}: ${corrections.length}`);
  return corrections;
};

/**
 * Process legacy format blocks (type: markers)
 * @param {string} block - Block content
 * @param {number} blockIndex - Block index
 * @param {string} category - Category name
 * @param {string} analysisId - Analysis ID
 * @param {Array} corrections - Array to add corrections to
 */
const processLegacyBlock = (block, blockIndex, category, analysisId, corrections) => {
  const rawLines = block.split('\n');
  const lines = rawLines.map(l => l.trim()).filter(l => l && !l.match(/^[-•]\s*$/));
  
  let errorType = '';
  let pattern = '';
  let exemplesStartIndex = -1;
  
  lines.forEach((line, lineIndex) => {
    const typeMatch = line.match(/([GSV]\d{2})/i);
    if (typeMatch && !errorType) {
      errorType = typeMatch[1].toUpperCase();
    }
    
    if (line.toLowerCase().startsWith('pattern:')) {
      pattern = line.replace(/^pattern:\s*/i, '').trim();
    }
    
    if (line.toLowerCase().includes('exemples:') || line.toLowerCase().includes('exemple:')) {
      exemplesStartIndex = lineIndex + 1;
    }
  });
  
  if (!errorType) {
    const firstLine = lines[0] || '';
    const typeMatch = firstLine.match(/([GSV]\d{2})/i);
    if (typeMatch) {
      errorType = typeMatch[1].toUpperCase();
    }
  }
  
  if (!errorType) {
    console.warn(`[Corrections] Could not extract error type from legacy block ${blockIndex} in ${category}`);
    return;
  }
  
  if (exemplesStartIndex >= 0) {
    const exempleLines = lines.slice(exemplesStartIndex);
    
    exempleLines.forEach((line, exempleIndex) => {
      if (line.match(/^[-•]?\s*type:\s*/i)) {
        return;
      }
      
      if (line.toLowerCase().includes('occurrences:') || 
          line.toLowerCase().includes('pattern:') ||
          line.match(/^[-•]\s*$/)) {
        return;
      }
      
      const cleanLine = line.replace(/^[-•]\s*/, '').trim();
      
      // Use same parsing logic as main function
      let arrowMatch = cleanLine.match(/["']([^"']+)["']\s*→\s*["']([^"']+)["']/);
      if (arrowMatch) {
        const original = arrowMatch[1].trim();
        const corrected = arrowMatch[2].trim();
        
        if (original && corrected && original !== corrected) {
          corrections.push({
            id: `${analysisId}_${category}_${errorType}_${blockIndex}_${exempleIndex}`,
            original: original,
            corrected: corrected,
            errorType: formatErrorType(errorType, category),
            teacherComment: pattern || `Correction pour ${errorType}`,
            severity: determineSeverity(errorType)
          });
        }
        return;
      }
    });
  }
};

/**
 * Transform analysis result into corrections format
 * @param {Object} analysis - Analysis object with analysis_result
 * @returns {Array} Array of correction objects
 */
const transformAnalysisToCorrections = (analysis) => {
  const corrections = [];
  
  if (!analysis.analysis_result) {
    return corrections;
  }

  let analysisData = analysis.analysis_result;
  
  // Handle string JSON - check if it's actually JSON first
  if (typeof analysisData === 'string') {
    // Check if it looks like JSON (starts with { or [)
    const trimmed = analysisData.trim();
    console.log('[Corrections] Checking analysis format, first 200 chars:', trimmed.substring(0, 200));
    
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        analysisData = JSON.parse(analysisData);
        console.log('[Corrections] Successfully parsed JSON format');
      } catch (e) {
        // JSON parse failed, try markdown/text parsing
        console.log('[Corrections] JSON parse failed:', e.message, '- trying markdown parser');
        const parsedFromMarkdown = parseMarkdownAnalysis(analysisData, analysis.id);
        if (parsedFromMarkdown.length > 0) {
          return parsedFromMarkdown;
        }
        return corrections;
      }
    } else {
      // Plain text/markdown format - parse it
      console.log('[Corrections] Parsing markdown/text format (does not start with { or [)');
      const parsedFromMarkdown = parseMarkdownAnalysis(analysisData, analysis.id);
      if (parsedFromMarkdown.length > 0) {
        return parsedFromMarkdown;
      }
      return corrections;
    }
  }
  
  // If analysisData is not an object at this point, return empty corrections
  if (typeof analysisData !== 'object' || analysisData === null) {
    return corrections;
  }

  // Extract errors from different possible structures
  const extractErrors = (errorList, category) => {
    if (!Array.isArray(errorList)) return [];
    
    const extractedCorrections = [];
    
    errorList.forEach((error, errorIndex) => {
      
      const errorType = error.type_erreur || error.type || error.code || category || 'Unknown';
      const pattern = error.pattern || '';
      const comment = error.explication || error.teacherComment || error.comment || pattern || `Correction suggérée pour ${category}`;
      const severity = determineSeverity(error.niveau_difficulte || error.severity || 'medium');
      
      // Use pattern if available, otherwise use formatErrorType
      const displayErrorType = pattern 
        ? `${errorType} - ${pattern}`
        : formatErrorType(errorType, category);
      
      // Check if this error has exemples array (prompt_v6.md format)
      if (Array.isArray(error.exemples) && error.exemples.length > 0) {
        // Extract each example as a separate correction
        error.exemples.forEach((exemple, exempleIndex) => {
          const original = exemple.erreur || exemple.erreur_originale || exemple.original || '';
          // correction can be null for some style errors (no specific correction provided)
          const corrected = exemple.correction !== undefined ? exemple.correction : 
                           (exemple.corrected !== undefined ? exemple.corrected : 
                           (exemple.suggestion !== undefined ? exemple.suggestion : null));
          
          // Include if original exists (correction can be null for style errors)
          if (original) {
            extractedCorrections.push({
              id: `${analysis.id}_${category}_${errorType}_${errorIndex}_${exempleIndex}`,
              original: original,
              corrected: corrected !== null ? corrected : original, // Use original if correction is null
              errorType: displayErrorType,
              teacherComment: comment,
              severity: severity,
              date: exemple.date || null // Include date if available
            });
          }
        });
      } else {
        // Legacy format: error object itself contains the correction
        const original = error.erreur_originale || error.original || error.pattern || '';
        const corrected = error.correction || error.corrected || error.suggestion || '';
        
        if (original && corrected) {
          extractedCorrections.push({
            id: `${analysis.id}_${category}_${errorIndex}`,
            original: original,
            corrected: corrected,
            errorType: displayErrorType,
            teacherComment: comment,
            severity: severity
          });
        }
      }
    });
    
    return extractedCorrections;
  };

  // Check for structured error format (prompt_v6.md style)
  if (analysisData.erreurs_recurrentes) {
    const recurrentes = analysisData.erreurs_recurrentes;
    
    if (recurrentes.grammaire) {
      corrections.push(...extractErrors(recurrentes.grammaire, 'grammar'));
    }
    if (recurrentes.vocabulaire) {
      corrections.push(...extractErrors(recurrentes.vocabulaire, 'vocabulary'));
    }
    if (recurrentes.style) {
      corrections.push(...extractErrors(recurrentes.style, 'style'));
    }
    // Add support for syntaxe (syntax errors)
    if (recurrentes.syntaxe) {
      corrections.push(...extractErrors(recurrentes.syntaxe, 'syntax'));
    }
  }

  // Check for legacy format (erreurs_grammaire, erreurs_vocabulaire, erreurs_style)
  if (analysisData.erreurs_grammaire) {
    corrections.push(...extractErrors(analysisData.erreurs_grammaire, 'grammar'));
  }
  if (analysisData.erreurs_vocabulaire) {
    corrections.push(...extractErrors(analysisData.erreurs_vocabulaire, 'vocabulary'));
  }
  if (analysisData.erreurs_style) {
    corrections.push(...extractErrors(analysisData.erreurs_style, 'style'));
  }

  // Check for flat error list format
  if (Array.isArray(analysisData.errors) || Array.isArray(analysisData.erreurs)) {
    const errorList = analysisData.errors || analysisData.erreurs;
    corrections.push(...extractErrors(errorList, 'general'));
  }
  
  // Handle erreurs_persistantes (persistent errors) - prompt_v6.md format
  if (analysisData.erreurs_persistantes) {
    // prompt_v6.md format: array of objects with type, pattern, exemple, dates
    if (Array.isArray(analysisData.erreurs_persistantes)) {
      analysisData.erreurs_persistantes.forEach((persistentError, index) => {
        const errorType = persistentError.type || '';
        const pattern = persistentError.pattern || '';
        const exemple = persistentError.exemple || {};
        const dates = persistentError.dates || [];
        
        // Determine category from error type
        let category = 'general';
        if (errorType.startsWith('G')) category = 'grammar';
        else if (errorType.startsWith('V')) category = 'vocabulary';
        else if (errorType.startsWith('S')) category = 'style';
        
        const original = exemple.erreur || exemple.erreur_originale || exemple.original || '';
        const corrected = exemple.correction || exemple.corrected || exemple.suggestion || '';
        
        if (original && corrected) {
          // Use the full pattern from JSON for persistent errors instead of formatErrorType
          // Format: "G06 - Prépositions / à-de-que + infinitif"
          const fullErrorType = pattern 
            ? `${errorType} - ${pattern}` 
            : formatErrorType(errorType, category);
          
          corrections.push({
            id: `${analysis.id}_persistent_${errorType}_${index}`,
            original: original,
            corrected: corrected,
            errorType: fullErrorType,
            teacherComment: pattern || `Erreur persistante ${errorType}`,
            severity: 'high', // Persistent errors are high severity
            isPersistent: true,
            dates: dates // Include dates when error appeared
          });
        }
      });
    } else if (typeof analysisData.erreurs_persistantes === 'object') {
      // Legacy format: object with categories - extract from each category
      const persistantes = analysisData.erreurs_persistantes;
      if (persistantes.grammaire) {
        corrections.push(...extractErrors(persistantes.grammaire, 'grammar'));
      }
      if (persistantes.vocabulaire) {
        corrections.push(...extractErrors(persistantes.vocabulaire, 'vocabulary'));
      }
      if (persistantes.style) {
        corrections.push(...extractErrors(persistantes.style, 'style'));
      }
      if (persistantes.syntaxe) {
        corrections.push(...extractErrors(persistantes.syntaxe, 'syntax'));
      }
    }
  }
  
  return corrections;
};

/**
 * Determine severity based on difficulty level or error type
 * @param {string} level - Difficulty level or error type
 * @returns {'high'|'medium'|'low'}
 */
const determineSeverity = (level) => {
  if (!level) return 'medium';
  
  const levelStr = level.toString().toUpperCase();
  
  // High severity: A1, A2, basic grammar errors
  if (levelStr.includes('A1') || levelStr.includes('A2') || 
      levelStr.includes('G05') || levelStr.includes('G01')) {
    return 'high';
  }
  
  // Low severity: C1, C2, style issues
  if (levelStr.includes('C1') || levelStr.includes('C2') || 
      levelStr.includes('STYLE') || levelStr.includes('S')) {
    return 'low';
  }
  
  return 'medium';
};

/**
 * Format error type code into readable format
 * @param {string} errorType - Error type code
 * @param {string} category - Error category
 * @returns {string} Formatted error type
 */
const formatErrorType = (errorType, category) => {
  if (!errorType) {
    return category ? `${category.toUpperCase()} - Error` : 'Unknown';
  }
  
  // If it's already formatted (contains ' - '), return as is
  if (errorType.includes(' - ')) {
    return errorType;
  }
  
  // Map error codes to readable names
  const errorCodeMap = {
    'G01': 'G01 - Auxiliaire',
    'G05': 'G05 - Accord',
    'G06': 'G06 - Préposition',
    'G07': 'G07 - Article',
    'G08': 'G08 - Pronom',
    'V01': 'V01 - Lexique',
    'S01': 'S01 - Structure',
    'S02': 'S02 - Cohérence',
    'S03': 'S03 - Genre discursif',
    'S04': 'S04 - Syntaxe'
  };
  
  const code = errorType.toUpperCase();
  if (errorCodeMap[code]) {
    return errorCodeMap[code];
  }
  
  // Default formatting
  const categoryMap = {
    'grammar': 'Grammar',
    'vocabulary': 'Vocabulary',
    'style': 'Style',
    'syntax': 'Syntaxe',
    'general': 'General'
  };
  
  return `${code} - ${categoryMap[category] || category}`;
};

/**
 * Get corrections for a student
 * @param {string} studentEmail - Student email
 * @returns {Promise<Object>} Object with success status and submissions data
 */
export const getStudentCorrections = async (studentEmail) => {
  try {
    const response = await getStudentAnalyses(studentEmail, 1000, 0);
    
    if (!response.success) {
      return {
        success: false,
        message: response.message || 'Error loading corrections'
      };
    }

    const analyses = response.analyses || [];
    
    // Transform analyses into submissions format
    const submissions = analyses
      .filter(analysis => analysis.analysis_result) // Only include analyses with results
      .map(analysis => {
        const corrections = transformAnalysisToCorrections(analysis);
        
        // Extract date and format
        const date = analysis.created_at 
          ? new Date(analysis.created_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        
        // Generate title from text content or use default
        const textContent = analysis.text_content || '';
        const title = textContent.length > 50 
          ? textContent.substring(0, 50) + '...'
          : textContent || `Analysis ${date}`;
        
        // Extract score and CECRL level from analysis_result
        let score = null;
        let cecrlLevel = null;
        
        // Try to parse from JSON format (prompt_v6.md) or markdown/text format
        if (analysis.analysis_result) {
          let analysisData = analysis.analysis_result;
          
          // Try to parse as JSON if it's a string
          if (typeof analysisData === 'string') {
            const trimmed = analysisData.trim();
            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
              try {
                analysisData = JSON.parse(analysisData);
              } catch (e) {
                // Not JSON, will use string format
              }
            }
          }
          
          // Parse score and CECRL level (handles both JSON object and string)
          const parsedInfo = parseScoreAndCECRL(analysisData, date);
          if (parsedInfo.score !== null) {
            score = parsedInfo.score;
          }
          if (parsedInfo.cecrlLevel) {
            cecrlLevel = parsedInfo.cecrlLevel;
          }
        }
        
        // Fallback: use stored values or calculate
        if (score === null) {
          if (analysis.cecrl_level) {
            // Map CECRL levels to scores (rough estimate)
            const levelScores = {
              'A1': 12, 'A1+': 20, 'A2': 21, 'A2+': 30,
              'B1': 38, 'B1+': 47, 'B2': 55, 'B2+': 63,
              'C1': 72, 'C1+': 80, 'C2': 88, 'C2+': 97
            };
            score = levelScores[analysis.cecrl_level.toUpperCase()] || 50;
            cecrlLevel = analysis.cecrl_level;
          } else {
            // Default score if no information available
            score = 50;
          }
        }
        
        // Adjust score based on errors count only if we don't have a real score and no CECRL level
        if (score === 50 && !cecrlLevel && analysis.errors_count) {
          score = Math.max(0, score - (analysis.errors_count * 2));
        }
        
        // Log for debugging
        console.log(`[Corrections] Submission ${analysis.id}: score=${score}, cecrlLevel=${cecrlLevel}, corrections=${corrections.length}`);
        
        return {
          id: analysis.id,
          date: date,
          title: title,
          type: analysis.text_type || 'written',
          score: Math.round(score),
          cecrlLevel: cecrlLevel,
          totalCorrections: corrections.length,
          corrections: corrections
        };
      })
      .filter(submission => submission.corrections.length > 0) // Only include submissions with corrections
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date, newest first

    return {
      success: true,
      submissions: submissions
    };
  } catch (error) {
    console.error('Get corrections error:', error);
    return {
      success: false,
      message: 'Error loading corrections'
    };
  }
};

/**
 * Get corrections for a teacher's students
 * @param {string} teacherEmail - Teacher email
 * @param {string} studentEmail - Optional specific student email
 * @returns {Promise<Object>} Object with success status and submissions data
 */
export const getTeacherCorrections = async (teacherEmail, studentEmail = null) => {
  try {
    // If specific student, use student endpoint
    if (studentEmail) {
      return await getStudentCorrections(studentEmail);
    }
    
    // Otherwise, fetch all students for teacher
    const response = await fetch(`${API_BASE_URL}/teacher/${teacherEmail}/students`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error loading students');
    }
    
    const data = await response.json();
    const students = data.students || [];
    
    // Fetch corrections for all students
    const allSubmissions = [];
    for (const student of students) {
      const studentEmail = student.email || student;
      const correctionsResponse = await getStudentCorrections(studentEmail);
      
      if (correctionsResponse.success && correctionsResponse.submissions) {
        // Add student info to each submission
        const submissionsWithStudent = correctionsResponse.submissions.map(sub => ({
          ...sub,
          studentEmail: studentEmail,
          studentName: student.name || studentEmail
        }));
        allSubmissions.push(...submissionsWithStudent);
      }
    }
    
    // Sort by date, newest first
    allSubmissions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return {
      success: true,
      submissions: allSubmissions
    };
  } catch (error) {
    console.error('Get teacher corrections error:', error);
    return {
      success: false,
      message: 'Error loading corrections'
    };
  }
};

// Default export
const correctionsService = {
  getStudentCorrections,
  getTeacherCorrections
};

export default correctionsService;

