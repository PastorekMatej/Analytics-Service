/**
 * Corrections Service
 * Handles fetching and transforming correction data from analyses
 */

import { getStudentAnalyses } from './analysisService';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Parse score and CECRL level from ÉVOLUTION_GLOBALE section
 * @param {string} text - Markdown/text analysis result
 * @param {string} date - Date of the analysis (YYYY-MM-DD)
 * @returns {Object} Object with score and cecrlLevel
 */
const parseScoreAndCECRL = (text, date) => {
  let score = null;
  let cecrlLevel = null;
  
  if (!text || typeof text !== 'string') {
    return { score: null, cecrlLevel: null };
  }
  
  try {
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
    const erreursRecurrentesMatch = text.match(/ERREURS_RÉCURRENTES[:\s]*([\s\S]*?)(?=ERREURS_PERSISTANTES|ÉVOLUTION_GLOBALE|TENDANCES|$)/i);
    if (!erreursRecurrentesMatch) {
      console.log('[Corrections] No ERREURS_RÉCURRENTES section found');
      return corrections;
    }
    
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
    
    console.log(`[Corrections] Parsed ${corrections.length} corrections from markdown`);
  } catch (error) {
    console.error('[Corrections] Error parsing markdown:', error);
  }
  
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
  
  // Split by error type markers (lines starting with "- type:" or just "type:")
  const errorBlocks = sectionText.split(/(?:^|\n)\s*[-•]?\s*type:\s*/gmi);
  
  errorBlocks.forEach((block, blockIndex) => {
    if (blockIndex === 0) return; // Skip first empty block
    
    const lines = block.split('\n').map(l => l.trim()).filter(l => l && !l.match(/^[-•]\s*$/));
    
    // Extract error type (first line after "type:")
    let errorType = '';
    let pattern = '';
    let exemplesStartIndex = -1;
    
    lines.forEach((line, lineIndex) => {
      // Extract type code (G01, V02, S03, etc.)
      const typeMatch = line.match(/^([GV]\d{2})/i);
      if (typeMatch && !errorType) {
        errorType = typeMatch[1].toUpperCase();
      }
      
      // Extract pattern
      if (line.toLowerCase().startsWith('pattern:')) {
        pattern = line.replace(/^pattern:\s*/i, '').trim();
      }
      
      // Find exemples section
      if (line.toLowerCase().includes('exemples:') || line.toLowerCase().includes('exemple:')) {
        exemplesStartIndex = lineIndex + 1;
      }
    });
    
    // If no type found, try to extract from the block start
    if (!errorType) {
      const firstLine = lines[0] || '';
      const typeMatch = firstLine.match(/([GV]\d{2})/i);
      if (typeMatch) {
        errorType = typeMatch[1].toUpperCase();
      }
    }
    
    // Extract examples
    if (exemplesStartIndex >= 0) {
      const exempleLines = lines.slice(exemplesStartIndex);
      
      exempleLines.forEach((line, exempleIndex) => {
        // Skip lines that are not examples (like "occurrences:", etc.)
        if (line.toLowerCase().includes('occurrences:') || 
            line.toLowerCase().includes('pattern:') ||
            line.match(/^[-•]\s*type:/i)) {
          return;
        }
        
        // Parse format: "original" → "corrected" (date) or - "original" → "corrected"
        // Handle both quoted and unquoted formats
        const arrowMatch = line.match(/["']([^"']+)["']?\s*→\s*["']([^"']+)["']?/);
        if (arrowMatch) {
          const original = arrowMatch[1].trim();
          const corrected = arrowMatch[2].trim();
          
          if (original && corrected && original !== corrected) {
            corrections.push({
              id: `${analysisId}_${category}_${blockIndex}_${exempleIndex}`,
              original: original,
              corrected: corrected,
              errorType: formatErrorType(errorType, category),
              teacherComment: pattern || `Correction pour ${errorType}`,
              severity: determineSeverity(errorType)
            });
          }
        } else {
          // Try format without quotes: original → corrected
          const simpleMatch = line.match(/[-•]?\s*([^→]+)→\s*(.+?)(?:\s*\(|$)/);
          if (simpleMatch) {
            const original = simpleMatch[1].trim().replace(/^["']|["']$/g, '');
            const corrected = simpleMatch[2].trim().replace(/^["']|["']$/g, '');
            
            if (original && corrected && original !== corrected && original.length > 2) {
              corrections.push({
                id: `${analysisId}_${category}_${blockIndex}_${exempleIndex}`,
                original: original,
                corrected: corrected,
                errorType: formatErrorType(errorType, category),
                teacherComment: pattern || `Correction pour ${errorType}`,
                severity: determineSeverity(errorType)
              });
            }
          }
        }
      });
    }
  });
  
  return corrections;
};

/**
 * Transform analysis result into corrections format
 * @param {Object} analysis - Analysis object with analysis_result
 * @returns {Array} Array of correction objects
 */
const transformAnalysisToCorrections = (analysis) => {
  const corrections = [];
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e0acad44-2af7-4e4a-a6e3-006719c96978',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'correctionsService.js:15',message:'transformAnalysisToCorrections called',data:{analysisId:analysis?.id,hasAnalysisResult:!!analysis?.analysis_result,analysisResultType:typeof analysis?.analysis_result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  if (!analysis.analysis_result) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e0acad44-2af7-4e4a-a6e3-006719c96978',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'correctionsService.js:19',message:'No analysis_result found',data:{analysisId:analysis?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return corrections;
  }

  let analysisData = analysis.analysis_result;
  
  // Handle string JSON - check if it's actually JSON first
  if (typeof analysisData === 'string') {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e0acad44-2af7-4e4a-a6e3-006719c96978',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'correctionsService.js:25',message:'analysis_result is string, attempting parse',data:{length:analysisData.length,startsWithBrace:analysisData.trim().startsWith('{'),startsWithBracket:analysisData.trim().startsWith('['),preview:analysisData.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Check if it looks like JSON (starts with { or [)
    const trimmed = analysisData.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        analysisData = JSON.parse(analysisData);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e0acad44-2af7-4e4a-a6e3-006719c96978',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'correctionsService.js:31',message:'JSON parse successful',data:{keys:Object.keys(analysisData || {}),hasErreursRecurrentes:!!analysisData?.erreurs_recurrentes},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      } catch (e) {
        // JSON parse failed, try markdown/text parsing
        console.log('[Corrections] JSON parse failed, trying markdown parser');
        const parsedFromMarkdown = parseMarkdownAnalysis(analysisData, analysis.id);
        if (parsedFromMarkdown.length > 0) {
          return parsedFromMarkdown;
        }
        return corrections;
      }
    } else {
      // Plain text/markdown format - parse it
      console.log('[Corrections] Parsing markdown/text format');
      const parsedFromMarkdown = parseMarkdownAnalysis(analysisData, analysis.id);
      if (parsedFromMarkdown.length > 0) {
        return parsedFromMarkdown;
      }
      return corrections;
    }
  }
  
  // If analysisData is not an object at this point, return empty corrections
  if (typeof analysisData !== 'object' || analysisData === null) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e0acad44-2af7-4e4a-a6e3-006719c96978',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'correctionsService.js:43',message:'analysisData is not an object',data:{type:typeof analysisData,isNull:analysisData === null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return corrections;
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e0acad44-2af7-4e4a-a6e3-006719c96978',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'correctionsService.js:46',message:'analysisData structure check',data:{keys:Object.keys(analysisData),hasErreursRecurrentes:!!analysisData.erreurs_recurrentes,hasErreursGrammaire:!!analysisData.erreurs_grammaire,hasErreursVocabulaire:!!analysisData.erreurs_vocabulaire,hasErreursStyle:!!analysisData.erreurs_style,hasErreursPersistantes:!!analysisData.erreurs_persistantes,erreursRecurrentesKeys:analysisData.erreurs_recurrentes ? Object.keys(analysisData.erreurs_recurrentes) : null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  // Extract errors from different possible structures
  const extractErrors = (errorList, category) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e0acad44-2af7-4e4a-a6e3-006719c96978',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'correctionsService.js:49',message:'extractErrors called',data:{category,isArray:Array.isArray(errorList),length:Array.isArray(errorList) ? errorList.length : 0,firstErrorKeys:Array.isArray(errorList) && errorList[0] ? Object.keys(errorList[0]) : null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    if (!Array.isArray(errorList)) return [];
    
    const extractedCorrections = [];
    
    errorList.forEach((error, errorIndex) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e0acad44-2af7-4e4a-a6e3-006719c96978',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'correctionsService.js:54',message:'Processing error object',data:{errorIndex,category,errorKeys:Object.keys(error),hasExemples:!!error.exemples,exemplesIsArray:Array.isArray(error.exemples),exemplesLength:Array.isArray(error.exemples) ? error.exemples.length : 0,type:error.type,pattern:error.pattern},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      const errorType = error.type_erreur || error.type || error.code || category || 'Unknown';
      const pattern = error.pattern || '';
      const comment = error.explication || error.teacherComment || error.comment || pattern || `Correction suggérée pour ${category}`;
      const severity = determineSeverity(error.niveau_difficulte || error.severity || 'medium');
      
      // Check if this error has exemples array (prompt_v2 format)
      if (Array.isArray(error.exemples) && error.exemples.length > 0) {
        // Extract each example as a separate correction
        error.exemples.forEach((exemple, exempleIndex) => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e0acad44-2af7-4e4a-a6e3-006719c96978',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'correctionsService.js:62',message:'Processing exemple from exemples array',data:{exempleIndex,exempleKeys:Object.keys(exemple),erreur:exemple.erreur,correction:exemple.correction,erreur_originale:exemple.erreur_originale},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          const original = exemple.erreur || exemple.erreur_originale || exemple.original || '';
          const corrected = exemple.correction || exemple.corrected || exemple.suggestion || '';
          
          if (original && corrected) {
            extractedCorrections.push({
              id: `${analysis.id}_${category}_${errorIndex}_${exempleIndex}`,
              original: original,
              corrected: corrected,
              errorType: formatErrorType(errorType, category),
              teacherComment: comment,
              severity: severity
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
            errorType: formatErrorType(errorType, category),
            teacherComment: comment,
            severity: severity
          });
        }
      }
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e0acad44-2af7-4e4a-a6e3-006719c96978',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'correctionsService.js:88',message:'extractErrors completed',data:{category,extractedCount:extractedCorrections.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    return extractedCorrections;
  };

  // Check for structured error format (prompt_v2 style)
  if (analysisData.erreurs_recurrentes) {
    const recurrentes = analysisData.erreurs_recurrentes;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e0acad44-2af7-4e4a-a6e3-006719c96978',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'correctionsService.js:95',message:'Found erreurs_recurrentes',data:{recurrentesKeys:Object.keys(recurrentes),grammaireLength:Array.isArray(recurrentes.grammaire) ? recurrentes.grammaire.length : 0,vocabulaireLength:Array.isArray(recurrentes.vocabulaire) ? recurrentes.vocabulaire.length : 0,styleLength:Array.isArray(recurrentes.style) ? recurrentes.style.length : 0,syntaxeLength:Array.isArray(recurrentes.syntaxe) ? recurrentes.syntaxe.length : 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
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
  
  // Handle erreurs_persistantes (persistent errors)
  if (analysisData.erreurs_persistantes) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e0acad44-2af7-4e4a-a6e3-006719c96978',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'correctionsService.js:120',message:'Found erreurs_persistantes',data:{isArray:Array.isArray(analysisData.erreurs_persistantes),isObject:typeof analysisData.erreurs_persistantes === 'object',keys:typeof analysisData.erreurs_persistantes === 'object' ? Object.keys(analysisData.erreurs_persistantes) : null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    // erreurs_persistantes can be a list of error codes or an object with categories
    if (Array.isArray(analysisData.erreurs_persistantes)) {
      // List of error codes - we need to find these in erreurs_recurrentes
      analysisData.erreurs_persistantes.forEach((errorCode, index) => {
        // Mark existing corrections as persistent if they match
        corrections.forEach(correction => {
          if (correction.errorType.startsWith(errorCode.toUpperCase())) {
            correction.severity = 'high'; // Persistent errors are high severity
          }
        });
      });
    } else if (typeof analysisData.erreurs_persistantes === 'object') {
      // Object with categories - extract from each category
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
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e0acad44-2af7-4e4a-a6e3-006719c96978',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'correctionsService.js:145',message:'transformAnalysisToCorrections completed',data:{totalCorrections:corrections.length,correctionsPreview:corrections.slice(0,3).map(c => ({id:c.id,errorType:c.errorType,original:c.original,corrected:c.corrected}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

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
        
        // Try to parse from markdown/text format
        if (analysis.analysis_result && typeof analysis.analysis_result === 'string') {
          const parsedInfo = parseScoreAndCECRL(analysis.analysis_result, date);
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

