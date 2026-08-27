import { google } from 'googleapis';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured in environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET).');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Returns a Google Sheets client authenticated using a Service Account JSON Key
 */
export function getServiceAccountSheetsClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY;

  // Alternatively allow parsing entire JSON string
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

  // Handle various formats of private key in environment variables (quotes, escaped newlines, raw newlines)
  privateKey = privateKey
    .replace(/^["']|["']$/g, '') // remove surrounding quotes if any
    .replace(/\\n/g, '\n')       // convert literal \n to real newlines
    .replace(/\r\n/g, '\n');

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: GOOGLE_SCOPES,
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Extracts spreadsheetId from Google Sheets URL
 * Supports:
 * - https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
 * - Raw spreadsheet ID
 */
export function extractSpreadsheetId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already pure ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex to match /spreadsheets/d/([a-zA-Z0-9-_]+)
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}
