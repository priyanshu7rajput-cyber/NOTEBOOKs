import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { getOAuth2Client, getServiceAccountSheetsClient } from '@/lib/google/sheets';

export async function getAuthenticatedSheetsClient(userId?: string) {
  // 1. First priority: Check if Google Service Account credentials exist in .env
  const serviceAccountSheets = getServiceAccountSheetsClient();
  if (serviceAccountSheets) {
    return {
      sheets: serviceAccountSheets,
      connection: {
        google_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL || 'Service Account',
        google_name: 'Google Cloud Service Account',
        google_avatar_url: null,
      },
    };
  }

  // 2. Second priority: Check User OAuth 2.0 Connection from database
  if (!userId) {
    throw new Error('User ID is required for OAuth Google connection.');
  }

  const supabase = await createClient();

  const { data: connection, error } = await supabase
    .from('google_connections')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !connection) {
    throw new Error('Google account is not connected. Please connect your Google account or configure Service Account credentials.');
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    expiry_date: connection.token_expiry ? new Date(connection.token_expiry).getTime() : undefined,
  });

  // Listen for automatic token refresh events and save back to DB
  oauth2Client.on('tokens', async (newTokens) => {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (newTokens.access_token) {
      updatePayload.access_token = newTokens.access_token;
    }
    if (newTokens.refresh_token) {
      updatePayload.refresh_token = newTokens.refresh_token;
    }
    if (newTokens.expiry_date) {
      updatePayload.token_expiry = new Date(newTokens.expiry_date).toISOString();
    }

    await supabase
      .from('google_connections')
      .update(updatePayload)
      .eq('user_id', userId);
  });

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
  return { sheets, connection };
}
