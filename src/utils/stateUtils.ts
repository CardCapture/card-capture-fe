/**
 * State standardization utilities for CSV exports
 */

// Mapping of full state names to abbreviations
const STATE_NAME_TO_ABBREVIATION: Record<string, string> = {
  // Common states
  'alabama': 'AL',
  'alaska': 'AK',
  'arizona': 'AZ',
  'arkansas': 'AR',
  'california': 'CA',
  'colorado': 'CO',
  'connecticut': 'CT',
  'delaware': 'DE',
  'florida': 'FL',
  'georgia': 'GA',
  'hawaii': 'HI',
  'idaho': 'ID',
  'illinois': 'IL',
  'indiana': 'IN',
  'iowa': 'IA',
  'kansas': 'KS',
  'kentucky': 'KY',
  'louisiana': 'LA',
  'maine': 'ME',
  'maryland': 'MD',
  'massachusetts': 'MA',
  'michigan': 'MI',
  'minnesota': 'MN',
  'mississippi': 'MS',
  'missouri': 'MO',
  'montana': 'MT',
  'nebraska': 'NE',
  'nevada': 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  'ohio': 'OH',
  'oklahoma': 'OK',
  'oregon': 'OR',
  'pennsylvania': 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  'tennessee': 'TN',
  'texas': 'TX',
  'utah': 'UT',
  'vermont': 'VT',
  'virginia': 'VA',
  'washington': 'WA',
  'west virginia': 'WV',
  'wisconsin': 'WI',
  'wyoming': 'WY',
  // Territories
  'district of columbia': 'DC',
  'puerto rico': 'PR',
  'virgin islands': 'VI',
  'american samoa': 'AS',
  'guam': 'GU',
  'northern mariana islands': 'MP'
};

// Valid state abbreviations
const VALID_STATE_ABBREVIATIONS = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'PR', 'VI', 'AS', 'GU', 'MP'
]);

/**
 * Standardizes state values to uppercase abbreviations
 * @param state - Raw state value (could be full name, abbreviation, or mixed case)
 * @returns Standardized state abbreviation in uppercase
 */
export function standardizeState(state: string): string {
  if (!state || typeof state !== 'string') {
    return '';
  }
  
  const trimmed = state.trim();
  if (!trimmed) {
    return '';
  }
  
  // If already a valid abbreviation, return uppercase
  const upperState = trimmed.toUpperCase();
  if (VALID_STATE_ABBREVIATIONS.has(upperState)) {
    return upperState;
  }
  
  // Try to convert full state name to abbreviation
  const lowerState = trimmed.toLowerCase();
  const abbreviation = STATE_NAME_TO_ABBREVIATION[lowerState];
  
  if (abbreviation) {
    return abbreviation;
  }
  
  // Handle common variations and typos
  const variations: Record<string, string> = {
    'calif': 'CA',
    'cali': 'CA',
    'tx': 'TX',
    'tex': 'TX',
    'fla': 'FL',
    'ny': 'NY',
    'penn': 'PA',
    'pa': 'PA',
    'mass': 'MA',
    'conn': 'CT',
    'wash': 'WA',
    'ore': 'OR',
    'nev': 'NV',
    'ariz': 'AZ',
    'colo': 'CO',
    'ill': 'IL',
    'ind': 'IN',
    'mich': 'MI',
    'wisc': 'WI',
    'wis': 'WI',
    'miss': 'MS',
    'ala': 'AL',
    'tenn': 'TN',
    'ky': 'KY',
    'ken': 'KY',
    'okla': 'OK'
  };
  
  const variationMatch = variations[lowerState];
  if (variationMatch) {
    return variationMatch;
  }
  
  // If no match found, return the original uppercased (might be a valid but unrecognized abbreviation)
  return upperState;
}

/**
 * Check if a value looks like a state (for validation purposes)
 */
export function isValidState(state: string): boolean {
  const standardized = standardizeState(state);
  return VALID_STATE_ABBREVIATIONS.has(standardized);
}