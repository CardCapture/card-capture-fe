import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function updateSchoolCardFields(
  schoolId: string, 
  cardFields: Record<string, { enabled: boolean; required: boolean }>,
  session: Session | null
) {
  try {
    const accessToken = session?.access_token;

    if (!accessToken) {
      logger.error('No access token available');
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_BASE_URL}/schools/${schoolId}/card-fields`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({ card_fields: cardFields }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = 'Failed to update school card fields';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        logger.error('Error parsing error response:', e);
      }
      throw new Error(errorMessage);
    }

    const parsedResponse = JSON.parse(responseText);
    return parsedResponse;
  } catch (error) {
    logger.error('Error in updateSchoolCardFields:', error);
    throw error;
  }
} 