import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function updateSchoolCardFields(
  schoolId: string, 
  cardFields: Record<string, { enabled: boolean; required: boolean }>,
  session: Session | null
) {
  try {
    console.log('Starting updateSchoolCardFields API call');
    const accessToken = session?.access_token;

    if (!accessToken) {
      console.error('No access token available');
      throw new Error('No access token available');
    }

    console.log('Making API request to update school card fields:', {
      url: `${API_BASE_URL}/schools/${schoolId}/card-fields`,
      schoolId,
      cardFields,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer [REDACTED]',
        'Accept': 'application/json'
      }
    });

    const response = await fetch(`${API_BASE_URL}/schools/${schoolId}/card-fields`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({ card_fields: cardFields }),
    });

    console.log('API response status:', response.status);
    const responseText = await response.text();
    console.log('API response body:', responseText);

    if (!response.ok) {
      let errorMessage = 'Failed to update school card fields';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      throw new Error(errorMessage);
    }

    const parsedResponse = JSON.parse(responseText);
    console.log('Successfully parsed API response:', parsedResponse);
    return parsedResponse;
  } catch (error) {
    console.error('Error in updateSchoolCardFields:', error);
    throw error;
  }
} 