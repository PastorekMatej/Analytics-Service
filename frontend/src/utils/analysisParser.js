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
 * Extract numerical score (0-100) from analysis text
 * Looks for patterns like:
 * - "Score: 45/100"
 * - "45/100"
 * - "Niveau actuel : 45 points"
 * - CEFR levels (converts to score)
 * - Score ranges per text (extracts most recent)
 */
export const extractScore = (analysisText) => {
  if (!analysisText) return null;
  
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
 * Extract CEFR level from analysis text
 * Prefers target level (after →) over source level
 */
export const extractCEFRLevel = (analysisText) => {
  if (!analysisText) return null;
  
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
 */
export const extractImprovement = (analysisText) => {
  if (!analysisText) return '';
  
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
 * Extract individual evaluation entries from "évaluations numériques par texte" section
 * Format: - YYYY-MM-DD: score/100 (level) - description
 */
const extractIndividualEvaluations = (analysisText) => {
  if (!analysisText) return [];
  
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
 */
export const parseProgressData = (analyses) => {
  if (!analyses || !Array.isArray(analyses)) return [];
  
  const allProgressData = [];
  
  // Process each analysis
  for (const analysis of analyses) {
    if (!analysis.analysis_result) continue;
    
    // Try to extract individual evaluations from "évaluations numériques par texte" section
    const individualEvals = extractIndividualEvaluations(analysis.analysis_result);
    
    if (individualEvals.length > 0) {
      // Found individual evaluations, use them
      allProgressData.push(...individualEvals);
    } else {
      // Fallback to old behavior: extract single score from analysis
      const score = extractScore(analysis.analysis_result);
      
      if (score !== null) {
        const level = extractCEFRLevel(analysis.analysis_result) || 'A1';
        const improvement = extractImprovement(analysis.analysis_result);
        const date = new Date(analysis.created_at).toISOString().split('T')[0];
        
        allProgressData.push({
          date,
          score,
          level,
          improvement
        });
      }
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
