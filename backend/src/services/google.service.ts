import { google } from 'googleapis';
import { supabaseAdmin } from './supabase.service';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured in environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET).');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getServiceAccountSheetsClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY;

  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      const auth = new google.auth.JWT({
        email: parsed.client_email,
        key: parsed.private_key,
        scopes: GOOGLE_SCOPES,
      });
      return google.sheets({ version: 'v4', auth });
    } catch (e) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', e);
    }
  }

  if (!clientEmail || !privateKey) {
    return null;
  }

  privateKey = privateKey
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n');

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: GOOGLE_SCOPES,
  });

  return google.sheets({ version: 'v4', auth });
}

export function extractSpreadsheetId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

export async function getAuthenticatedSheetsClient(userId?: string) {
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

  if (!userId) {
    throw new Error('User ID is required for OAuth Google connection.');
  }

  const { data: connection, error } = await supabaseAdmin
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

    await supabaseAdmin
      .from('google_connections')
      .update(updatePayload)
      .eq('user_id', userId);
  });

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
  return { sheets, connection };
}
