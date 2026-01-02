/**
 * Analysis Parser Utilities
 * Extract structured data from analysis_result text for progress tracking
 */

/**
 * Map CEFR level to numerical score (0-100)
 */
const levelToScore = (level) => {
  const levelMap = {
    'A1': 4,   // Midpoint of 0-8
    'A1+': 12, // Midpoint of 9-16
    'A2': 21,  // Midpoint of 17-25
    'A2+': 29, // Midpoint of 26-33
    'B1': 38,  // Midpoint of 34-42
    'B1+': 46, // Midpoint of 43-50
    'B2': 54,  // Midpoint of 51-58
    'B2+': 63, // Midpoint of 59-67
    'C1': 71,  // Midpoint of 68-75
    'C1+': 79, // Midpoint of 76-83
    'C2': 88,  // Midpoint of 84-92
    'C2+': 96  // Midpoint of 93-100
  };
  return levelMap[level] || null;
};

/**
 * Extract numerical score (0-100) from analysis text or JSON
 * Looks for patterns like:
 * - JSON format: evolution_globale.evaluations_numeriques (most recent)
 * - "Score: 45/100"
 * - "45/100"
 * - "Niveau actuel : 45 points"
 * - CEFR levels (converts to score)
 * - Score ranges per text (extracts most recent)
 */
export const extractScore = (analysisTextOrJson) => {
  if (!analysisTextOrJson) return null;
  
  // Try to parse as JSON first (prompt_v6.md format)
  let jsonData = null;
  if (typeof analysisTextOrJson === 'string') {
    const trimmed = analysisTextOrJson.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        jsonData = JSON.parse(analysisTextOrJson);
      } catch (e) {
        // Not JSON, will try text parsing below
      }
    }
  } else if (typeof analysisTextOrJson === 'object') {
    jsonData = analysisTextOrJson;
  }
  
  // If we have JSON data, extract from prompt_v6 format
  if (jsonData && jsonData.evolution_globale) {
    const evolutionGlobale = jsonData.evolution_globale;
    
    // Try to get the most recent evaluation score
    if (Array.isArray(evolutionGlobale.evaluations_numeriques) && evolutionGlobale.evaluations_numeriques.length > 0) {
      const lastEval = evolutionGlobale.evaluations_numeriques[evolutionGlobale.evaluations_numeriques.length - 1];
      if (lastEval.score !== undefined && lastEval.score >= 0 && lastEval.score <= 100) {
        return lastEval.score;
      }
    }
    
    // Fallback: extract from evolution_de_niveau if available
    if (evolutionGlobale.evolution_de_niveau) {
      const niveauMatch = evolutionGlobale.evolution_de_niveau.match(/([A-Z]\d[+]?)\s*→\s*([A-Z]\d[+]?)/i);
      if (niveauMatch) {
        const targetLevel = niveauMatch[2].toUpperCase();
        const score = levelToScore(targetLevel);
        if (score !== null) {
          return score;
        }
      }
    }
  }
  
  // Fallback to text parsing for markdown/legacy format
  const analysisText = typeof analysisTextOrJson === 'string' ? analysisTextOrJson : JSON.stringify(analysisTextOrJson);
  
  // First, try to find explicit numerical scores
  const patterns = [
    /(\d{1,3})\s*\/\s*100/g,                    // "45/100"
    /Score\s*:?\s*(\d{1,3})/gi,                 // "Score: 45"
    /(\d{1,3})\s*points/gi,                     // "45 points"
    /Texte\s+\d+\s*:?\s*(\d{1,3})\s*\/\s*100/gi // "Texte 1: 45/100"
  ];
  
  const scores = [];
  for (const pattern of patterns) {
    const matches = [...analysisText.matchAll(pattern)];
    matches.forEach(match => {
      const score = parseInt(match[1], 10);
      if (score >= 0 && score <= 100) {
        scores.push(score);
      }
    });
  }
  
  // If we found explicit scores, return the most recent one
  if (scores.length > 0) {
    return scores[scores.length - 1];
  }
  
  // If no explicit score, try to extract CEFR level and convert to score
  // Look for patterns like "A2 → B1" or "niveau: B1" or "B1" in context
  const levelPatterns = [
    /évolution de niveau[:\s]*["']?([A-C]\d\+?)\s*[→-]\s*([A-C]\d\+?)/i,  // "A2 → B1"
    /niveau actuel[:\s]*["']?([A-C]\d\+?)/i,                                // "niveau actuel: B1"
    /niveau[:\s]*["']?([A-C]\d\+?)/i,                                       // "niveau: B1"
    /([A-C]\d\+?)\s*→\s*([A-C]\d\+?)/i,                                     // "A2 → B1"
  ];
  
  for (const pattern of levelPatterns) {
    const match = analysisText.match(pattern);
    if (match) {
      // Use the target level (second level) if available, otherwise use the first
      const level = match[2] || match[1];
      const score = levelToScore(level);
      if (score !== null) {
        return score;
      }
    }
  }
  
  // Fallback: extract any CEFR level and use it
  const anyLevelMatch = analysisText.match(/([A-C]\d\+?)/i);
  if (anyLevelMatch) {
    const score = levelToScore(anyLevelMatch[1]);
    if (score !== null) {
      return score;
    }
  }
  
  return null;
};

/**
 * Extract CEFR level from analysis text or JSON
 * Prefers target level (after →) over source level
 */
export const extractCEFRLevel = (analysisTextOrJson) => {
  if (!analysisTextOrJson) return null;
  
  // Try to parse as JSON first (prompt_v6.md format)
  let jsonData = null;
  if (typeof analysisTextOrJson === 'string') {
    const trimmed = analysisTextOrJson.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        jsonData = JSON.parse(analysisTextOrJson);
      } catch (e) {
        // Not JSON, will try text parsing below
      }
    }
  } else if (typeof analysisTextOrJson === 'object') {
    jsonData = analysisTextOrJson;
  }
  
  // If we have JSON data, extract from prompt_v6 format
  if (jsonData && jsonData.evolution_globale) {
    const evolutionGlobale = jsonData.evolution_globale;
    
    // Try to get the most recent evaluation level
    if (Array.isArray(evolutionGlobale.evaluations_numeriques) && evolutionGlobale.evaluations_numeriques.length > 0) {
      const lastEval = evolutionGlobale.evaluations_numeriques[evolutionGlobale.evaluations_numeriques.length - 1];
      if (lastEval.niveau) {
        return lastEval.niveau.toUpperCase();
      }
    }
    
    // Fallback: extract from evolution_de_niveau
    if (evolutionGlobale.evolution_de_niveau) {
      const niveauMatch = evolutionGlobale.evolution_de_niveau.match(/([A-Z]\d[+]?)\s*→\s*([A-Z]\d[+]?)/i);
      if (niveauMatch && niveauMatch[2]) {
        return niveauMatch[2].toUpperCase(); // Return target level
      }
    }
  }
  
  // Fallback to text parsing for markdown/legacy format
  const analysisText = typeof analysisTextOrJson === 'string' ? analysisTextOrJson : JSON.stringify(analysisTextOrJson);
  
  // First, try to find evolution pattern "A2 → B1" and extract target level
  const evolutionPattern = /évolution de niveau[:\s]*["']?([A-C]\d\+?)\s*[→-]\s*([A-C]\d\+?)/i;
  const evolutionMatch = analysisText.match(evolutionPattern);
  if (evolutionMatch && evolutionMatch[2]) {
    return evolutionMatch[2]; // Return target level (B1)
  }
  
  // Try other patterns with arrow
  const arrowPattern = /([A-C]\d\+?)\s*[→-]\s*([A-C]\d\+?)/i;
  const arrowMatch = analysisText.match(arrowPattern);
  if (arrowMatch && arrowMatch[2]) {
    return arrowMatch[2]; // Return target level
  }
  
  // Look for "niveau actuel" or explicit level mentions
  const niveauPattern = /niveau actuel[:\s]*["']?([A-C]\d\+?)/i;
  const niveauMatch = analysisText.match(niveauPattern);
  if (niveauMatch) {
    return niveauMatch[1];
  }
  
  // Fallback: find any CEFR level (prefer later mentions as they're more recent)
  const levelPattern = /(A1\+?|A2\+?|B1\+?|B2\+?|C1\+?|C2\+?)/g;
  const matches = [...analysisText.matchAll(levelPattern)];
  
  // Return the last mentioned level (most recent/target)
  return matches.length > 0 ? matches[matches.length - 1][0] : null;
};

/**
 * Extract improvement summary from ÉVOLUTION_GLOBALE section
 * Supports both JSON format (prompt_v6.md) and markdown/text format
 */
export const extractImprovement = (analysisTextOrJson) => {
  if (!analysisTextOrJson) return '';
  
  // Try to parse as JSON first (prompt_v6.md format)
  let jsonData = null;
  if (typeof analysisTextOrJson === 'string') {
    const trimmed = analysisTextOrJson.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        jsonData = JSON.parse(analysisTextOrJson);
      } catch (e) {
        // Not JSON, will try text parsing below
      }
    }
  } else if (typeof analysisTextOrJson === 'object') {
    jsonData = analysisTextOrJson;
  }
  
  // If we have JSON data, extract from prompt_v6 format
  if (jsonData && jsonData.evolution_globale) {
    const evolutionGlobale = jsonData.evolution_globale;
    
    // Try to get resume first
    if (evolutionGlobale.resume) {
      return evolutionGlobale.resume.substring(0, 150);
    }
    
    // Fallback: use most recent evaluation description
    if (Array.isArray(evolutionGlobale.evaluations_numeriques) && evolutionGlobale.evaluations_numeriques.length > 0) {
      const lastEval = evolutionGlobale.evaluations_numeriques[evolutionGlobale.evaluations_numeriques.length - 1];
      if (lastEval.description) {
        return lastEval.description;
      }
      if (lastEval.type_evolution) {
        return lastEval.type_evolution;
      }
    }
  }
  
  // Fallback to text parsing for markdown/legacy format
  const analysisText = typeof analysisTextOrJson === 'string' ? analysisTextOrJson : JSON.stringify(analysisTextOrJson);
  
  // Try to extract from ÉVOLUTION_GLOBALE section
  const evolutionMatch = analysisText.match(
    /ÉVOLUTION[_\s]GLOBALE[:\s]*([\s\S]*?)(?=\n\n[A-Z_]|$)/i
  );
  
  if (evolutionMatch && evolutionMatch[1]) {
    // Take first substantial sentence
    const sentences = evolutionMatch[1]
      .trim()
      .split(/[.!?]\s+/)
      .filter(s => s.length > 20);
    
    if (sentences.length > 0) {
      return sentences[0].trim().substring(0, 150);
    }
  }
  
  // Fallback: look for "Amélioration" or "Progression" mentions
  const improvementMatch = analysisText.match(
    /(Amélioration|Progression)[^.!?]*[.!?]/i
  );
  
  return improvementMatch ? improvementMatch[0].trim() : 'Analyse disponible';
};

/**
 * Extract individual evaluation entries from JSON format (prompt_v6.md)
 * Format: evolution_globale.evaluations_numeriques array
 */
const extractIndividualEvaluationsFromJSON = (jsonData) => {
  if (!jsonData || typeof jsonData !== 'object') return [];
  
  // Check if it's the prompt_v6 format
  if (jsonData.evolution_globale && Array.isArray(jsonData.evolution_globale.evaluations_numeriques)) {
    const evaluations = jsonData.evolution_globale.evaluations_numeriques;
    const entries = [];
    
    evaluations.forEach((evalItem) => {
      if (evalItem.date && evalItem.score !== undefined && evalItem.niveau) {
        // Format improvement text: combine type_evolution and description if both exist
        let improvement = '';
        if (evalItem.type_evolution && evalItem.description) {
          improvement = `${evalItem.type_evolution}: ${evalItem.description}`;
        } else {
          improvement = evalItem.description || evalItem.type_evolution || '';
        }
        
        entries.push({
          date: evalItem.date,
          score: evalItem.score,
          level: evalItem.niveau,
          improvement: improvement
        });
      }
    });
    
    return entries;
  }
  
  return [];
};

/**
 * Extract individual evaluation entries from "évaluations numériques par texte" section (markdown format)
 * Format: - YYYY-MM-DD: score/100 (level) - description
 */
const extractIndividualEvaluationsFromMarkdown = (analysisText) => {
  if (!analysisText || typeof analysisText !== 'string') return [];
  
  // Find the "évaluations numériques par texte" section
  // Match more flexibly to handle variations in formatting
  const evalSectionMatch = analysisText.match(
    /évaluations numériques par texte[:\s]*\(format[^)]*\):?\s*\n((?:[\s-]*-[^\n]+(?:\n|$))+)/
  );
  
  if (!evalSectionMatch || !evalSectionMatch[1]) {
    return [];
  }
  
  const evalSection = evalSectionMatch[1];
  const entries = [];
  
  // Pattern: - YYYY-MM-DD: score/100 (level) - description
  // Example: - 2024-01-12: 22/100 (A2) - Point de départ: ...
  // Each evaluation is on a single line
  const evalPattern = /-\s*(\d{4}-\d{2}-\d{2}):\s*(\d{1,3})\s*\/\s*100\s*\(([A-C]\d\+?)\)\s*-\s*(.+?)(?=\n\s*-|\n\n|$)/g;
  
  let match;
  while ((match = evalPattern.exec(evalSection)) !== null) {
    const date = match[1];
    const score = parseInt(match[2], 10);
    const level = match[3];
    const improvement = match[4].trim().replace(/\s+/g, ' ');
    
    if (score >= 0 && score <= 100) {
      entries.push({
        date,
        score,
        level,
        improvement
      });
    }
  }
  
  return entries;
};

/**
 * Parse analysis data into progress chart format
 * Supports both JSON format (prompt_v6.md) and markdown/text format
 */
export const parseProgressData = (analyses) => {
  if (!analyses || !Array.isArray(analyses)) return [];
  
  const allProgressData = [];
  
  // Process each analysis
  for (const analysis of analyses) {
    if (!analysis.analysis_result) continue;
    
    // Try to parse as JSON first (prompt_v6.md format)
    let jsonData = null;
    let analysisResult = analysis.analysis_result;
    
    if (typeof analysisResult === 'string') {
      const trimmed = analysisResult.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          jsonData = JSON.parse(analysisResult);
        } catch (e) {
          // Not JSON, will try markdown parsing below
        }
      }
    } else if (typeof analysisResult === 'object') {
      jsonData = analysisResult;
    }
    
    // Try to extract individual evaluations from JSON format (prompt_v6.md)
    if (jsonData) {
      const jsonEvals = extractIndividualEvaluationsFromJSON(jsonData);
      if (jsonEvals.length > 0) {
        // Found individual evaluations in JSON format, use them
        allProgressData.push(...jsonEvals);
        continue; // Skip to next analysis
      }
    }
    
    // Fallback: try to extract from markdown format
    if (typeof analysisResult === 'string') {
      const markdownEvals = extractIndividualEvaluationsFromMarkdown(analysisResult);
      if (markdownEvals.length > 0) {
        // Found individual evaluations in markdown format, use them
        allProgressData.push(...markdownEvals);
        continue; // Skip to next analysis
      }
    }
    
    // Final fallback: extract single score from analysis
    const score = extractScore(analysisResult);
    
    if (score !== null) {
      const level = extractCEFRLevel(analysisResult) || 'A1';
      const improvement = extractImprovement(analysisResult);
      const date = new Date(analysis.created_at).toISOString().split('T')[0];
      
      allProgressData.push({
        date,
        score,
        level,
        improvement
      });
    }
  }
  
  // Sort by date, then by score (to handle multiple texts on same date)
  // Note: We keep all entries even if same date+score, as they may have different improvements
  allProgressData.sort((a, b) => {
    const dateCompare = new Date(a.date) - new Date(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.score - b.score; // If same date, sort by score
  });
  
  return allProgressData;
};

/**
 * Extract skill scores from prompt_v7 JSON format
 * Returns scores for: richesse_lexicale, precision_lexicale, grammaire, syntaxe, organisation_texte
 * @param {Object|string} analysisResult - Analysis result (JSON object or string)
 * @returns {Object|null} Object with skill scores or null if not found
 */
export const extractSkillScores = (analysisResult) => {
  if (!analysisResult) {
    console.log('[extractSkillScores] No analysisResult provided');
    return null;
  }
  
  // Try to parse as JSON first
  let jsonData = null;
  if (typeof analysisResult === 'string') {
    const trimmed = analysisResult.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        jsonData = JSON.parse(analysisResult);
        console.log('[extractSkillScores] Successfully parsed JSON string');
      } catch (e) {
        console.log('[extractSkillScores] Failed to parse JSON:', e.message);
        return null;
      }
    } else {
      console.log('[extractSkillScores] String does not start with { or [');
      return null;
    }
  } else if (typeof analysisResult === 'object') {
    jsonData = analysisResult;
    console.log('[extractSkillScores] Using object directly');
  }
  
  // Check if it's the prompt_v7 format with evaluations_numeriques
  if (jsonData && jsonData.evolution_globale) {
    const evolutionGlobale = jsonData.evolution_globale;
    console.log('[extractSkillScores] Found evolution_globale:', {
      has_evaluations_numeriques: !!evolutionGlobale.evaluations_numeriques,
      evaluations_numeriques_type: Array.isArray(evolutionGlobale.evaluations_numeriques) ? 'array' : typeof evolutionGlobale.evaluations_numeriques,
      evaluations_numeriques_length: Array.isArray(evolutionGlobale.evaluations_numeriques) ? evolutionGlobale.evaluations_numeriques.length : 0
    });
    
    // Get the most recent evaluation (last in array)
    if (Array.isArray(evolutionGlobale.evaluations_numeriques) && evolutionGlobale.evaluations_numeriques.length > 0) {
      const lastEval = evolutionGlobale.evaluations_numeriques[evolutionGlobale.evaluations_numeriques.length - 1];
      console.log('[extractSkillScores] Last evaluation:', {
        date: lastEval.date,
        score: lastEval.score,
        niveau: lastEval.niveau,
        has_skill_scores: {
          richesse_lexicale: lastEval.richesse_lexicale !== undefined || lastEval.score_richesse_lexicale !== undefined,
          precision_lexicale: lastEval.precision_lexicale !== undefined || lastEval.score_precision_lexicale !== undefined,
          grammaire: lastEval.grammaire !== undefined || lastEval.score_grammaire !== undefined,
          syntaxe: lastEval.syntaxe !== undefined || lastEval.score_syntaxe !== undefined,
          organisation_texte: lastEval.organisation_texte !== undefined || lastEval.score_organisation_texte !== undefined
        }
      });
      
      // Extract skill scores from the most recent evaluation
      // Support both prompt_v6 format (score_*) and prompt_v7 format (direct field names)
      const skillScores = {
        richesse_lexicale: lastEval.richesse_lexicale !== undefined ? lastEval.richesse_lexicale : 
                          (lastEval.score_richesse_lexicale !== undefined ? lastEval.score_richesse_lexicale : null),
        precision_lexicale: lastEval.precision_lexicale !== undefined ? lastEval.precision_lexicale : 
                           (lastEval.score_precision_lexicale !== undefined ? lastEval.score_precision_lexicale : null),
        grammaire: lastEval.grammaire !== undefined ? lastEval.grammaire : 
                  (lastEval.score_grammaire !== undefined ? lastEval.score_grammaire : null),
        syntaxe: lastEval.syntaxe !== undefined ? lastEval.syntaxe : 
                (lastEval.score_syntaxe !== undefined ? lastEval.score_syntaxe : null),
        organisation_texte: lastEval.organisation_texte !== undefined ? lastEval.organisation_texte : 
                          (lastEval.score_organisation_texte !== undefined ? lastEval.score_organisation_texte : null),
        date: lastEval.date || null,
        score: lastEval.score !== undefined ? lastEval.score : null,
        niveau: lastEval.niveau || null
      };
      
      console.log('[extractSkillScores] Extracted skill scores:', skillScores);
      
      // Return only if we have at least one skill score
      if (Object.values(skillScores).some(v => v !== null && v !== undefined)) {
        return skillScores;
      }
    } else {
      console.log('[extractSkillScores] evaluations_numeriques is not an array or is empty');
    }
  } else {
    console.log('[extractSkillScores] No evolution_globale found in JSON data');
  }
  
  return null;
};

/**
 * Extract skill scores from multiple analyses and calculate averages
 * @param {Array} analyses - Array of analysis objects
 * @returns {Object|null} Average skill scores or null if no data
 */
export const extractAverageSkillScores = (analyses) => {
  if (!analyses || !Array.isArray(analyses) || analyses.length === 0) {
    return null;
  }
  
  // Extract skill scores from all analyses
  const allSkillScores = analyses
    .map(analysis => extractSkillScores(analysis.analysis_result))
    .filter(scores => scores !== null);
  
  if (allSkillScores.length === 0) {
    return null;
  }
  
  // Calculate averages for each skill
  const skillKeys = ['richesse_lexicale', 'precision_lexicale', 'grammaire', 'syntaxe', 'organisation_texte'];
  const averages = {};
  
  skillKeys.forEach(skill => {
    const values = allSkillScores
      .map(s => s[skill])
      .filter(v => v !== null && v !== undefined && typeof v === 'number');
    
    if (values.length > 0) {
      averages[skill] = Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
    } else {
      averages[skill] = null;
    }
  });
  
  // Get the most recent score and level
  const mostRecent = allSkillScores[allSkillScores.length - 1];
  averages.date = mostRecent.date;
  averages.score = mostRecent.score;
  averages.niveau = mostRecent.niveau;
  
  return averages;
};

/**
 * Get skill performance data formatted for the Analysis page
 * Uses the most recent analysis or averages from recent analyses
 * @param {Array} analyses - Array of analysis objects
 * @returns {Array} Array of skill performance objects
 */
export const getSkillPerformanceData = (analyses) => {
  if (!analyses || !Array.isArray(analyses) || analyses.length === 0) {
    console.log('[getSkillPerformanceData] No analyses provided');
    return null;
  }
  
  // Try to get skill scores from analyses, starting with the most recent
  let recentScores = null;
  
  for (const analysis of analyses) {
    console.log('[getSkillPerformanceData] Trying analysis:', {
      has_analysis_result: !!analysis?.analysis_result,
      analysis_result_type: typeof analysis?.analysis_result
    });
    
    const scores = extractSkillScores(analysis?.analysis_result);
    
    if (scores && (
      scores.richesse_lexicale !== null || 
      scores.precision_lexicale !== null ||
      scores.grammaire !== null ||
      scores.syntaxe !== null ||
      scores.organisation_texte !== null
    )) {
      recentScores = scores;
      console.log('[getSkillPerformanceData] Found valid scores in this analysis');
      break;
    }
  }
  
  console.log('[getSkillPerformanceData] Final extracted scores:', recentScores);
  
  if (recentScores) {
    return [
      {
        skill: 'Richesse lexicale',
        score: recentScores.richesse_lexicale !== null && recentScores.richesse_lexicale !== undefined ? recentScores.richesse_lexicale : 0,
        maxScore: 100,
        color: '#6366f1'
      },
      {
        skill: 'Précision lexicale',
        score: recentScores.precision_lexicale !== null && recentScores.precision_lexicale !== undefined ? recentScores.precision_lexicale : 0,
        maxScore: 100,
        color: '#8b5cf6'
      },
      {
        skill: 'Grammaire (temps, modes, conjugaison, accords)',
        score: recentScores.grammaire !== null && recentScores.grammaire !== undefined ? recentScores.grammaire : 0,
        maxScore: 100,
        color: '#06b6d4'
      },
      {
        skill: 'Syntaxe (ordre des mots, phrases complexes)',
        score: recentScores.syntaxe !== null && recentScores.syntaxe !== undefined ? recentScores.syntaxe : 0,
        maxScore: 100,
        color: '#14b8a6'
      },
      {
        skill: 'Organisation du texte (cohérence, structure, connecteurs logiques)',
        score: recentScores.organisation_texte !== null && recentScores.organisation_texte !== undefined ? recentScores.organisation_texte : 0,
        maxScore: 100,
        color: '#10b981'
      }
    ];
  }
  
  console.log('[getSkillPerformanceData] No valid skill scores found in any analysis');
  return null;
};

/**
 * Get competency data formatted for the radar chart
 * @param {Array} analyses - Array of analysis objects
 * @returns {Array} Array of competency data objects
 */
export const getCompetencyData = (analyses) => {
  const skillData = getSkillPerformanceData(analyses);
  
  if (!skillData) {
    return null;
  }
  
  return [
    {
      competency: 'Richesse lexicale',
      value: skillData[0].score,
      fullMark: 100
    },
    {
      competency: 'Précision lexicale',
      value: skillData[1].score,
      fullMark: 100
    },
    {
      competency: 'Grammaire',
      value: skillData[2].score,
      fullMark: 100
    },
    {
      competency: 'Syntaxe',
      value: skillData[3].score,
      fullMark: 100
    },
    {
      competency: 'Organisation du texte',
      value: skillData[4].score,
      fullMark: 100
    }
  ];
};

/**
 * Extract evolution trends from prompt_v7 JSON format
 * @param {Object|string} analysisResult - Analysis result (JSON object or string)
 * @returns {Array|null} Array of trend objects or null if not found
 */
export const extractEvolutionTrends = (analysisResult) => {
  if (!analysisResult) return null;
  
  // Try to parse as JSON first
  let jsonData = null;
  if (typeof analysisResult === 'string') {
    const trimmed = analysisResult.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        jsonData = JSON.parse(analysisResult);
      } catch (e) {
        return null;
      }
    } else {
      return null;
    }
  } else if (typeof analysisResult === 'object') {
    jsonData = analysisResult;
  }
  
  // Check if it's the prompt_v7 format with tendances_evolution
  if (jsonData && Array.isArray(jsonData.tendances_evolution)) {
    // Filter out null/empty trends
    return jsonData.tendances_evolution.filter(trend => 
      trend.code && 
      (trend.occurrences !== null && trend.occurrences !== undefined) &&
      trend.occurrences > 0
    );
  }
  
  return null;
};

/**
 * Extract evolution trends from multiple analyses
 * Aggregates trends from all analyses, showing most recent trends
 * @param {Array} analyses - Array of analysis objects
 * @returns {Array} Array of aggregated trend objects
 */
export const getAggregatedEvolutionTrends = (analyses) => {
  if (!analyses || !Array.isArray(analyses) || analyses.length === 0) {
    return [];
  }
  
  // Get trends from the most recent analysis (should contain all trends)
  const mostRecentAnalysis = analyses[0];
  const trends = extractEvolutionTrends(mostRecentAnalysis?.analysis_result);
  
  if (!trends || trends.length === 0) {
    return [];
  }
  
  // Format trends for display
  return trends.map(trend => ({
    code: trend.code,
    description: trend.description || '',
    occurrences: trend.occurrences || 0,
    periode_debut: trend.periode_debut || null,
    periode_fin: trend.periode_fin || null,
    evolution: trend.evolution || ''
  }));
};

/**
 * Extract persistent errors from prompt_v7 JSON format
 * @param {Object|string} analysisResult - Analysis result (JSON object or string)
 * @returns {Array|null} Array of persistent error objects or null if not found
 */
export const extractPersistentErrors = (analysisResult) => {
  if (!analysisResult) return null;
  
  // Try to parse as JSON first
  let jsonData = null;
  if (typeof analysisResult === 'string') {
    const trimmed = analysisResult.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        jsonData = JSON.parse(analysisResult);
      } catch (e) {
        return null;
      }
    } else {
      return null;
    }
  } else if (typeof analysisResult === 'object') {
    jsonData = analysisResult;
  }
  
  // Check if it's the prompt_v7 format with erreurs_persistantes
  if (jsonData && Array.isArray(jsonData.erreurs_persistantes)) {
    return jsonData.erreurs_persistantes.filter(error => 
      error.type && error.pattern
    );
  }
  
  return null;
};

/**
 * Get persistent errors from multiple analyses
 * @param {Array} analyses - Array of analysis objects
 * @returns {Array} Array of persistent error objects
 */
export const getAggregatedPersistentErrors = (analyses) => {
  if (!analyses || !Array.isArray(analyses) || analyses.length === 0) {
    return [];
  }
  
  // Get persistent errors from the most recent analysis
  const mostRecentAnalysis = analyses[0];
  const errors = extractPersistentErrors(mostRecentAnalysis?.analysis_result);
  
  if (!errors || errors.length === 0) {
    return [];
  }
  
  // Format errors for display
  return errors.map(error => ({
    type: error.type,
    pattern: error.pattern || '',
    exemple: error.exemple || {},
    dates: error.dates || []
  }));
};
