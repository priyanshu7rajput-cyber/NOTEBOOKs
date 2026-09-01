import { Router, Response } from 'express';
import { google } from 'googleapis';
import {
  getOAuth2Client,
  GOOGLE_SCOPES,
  extractSpreadsheetId,
  getAuthenticatedSheetsClient
} from '../services/google.service';
import { supabaseAdmin } from '../services/supabase.service';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// 1. GET /api/google/status
router.get('/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
    const hasServiceAccount = Boolean(serviceAccountEmail || process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    if (hasServiceAccount) {
      res.json({
        connected: true,
        connection: {
          google_email: serviceAccountEmail || 'Service Account Enabled',
          google_name: 'Google Cloud Service Account',
          google_avatar_url: null,
          last_spreadsheet_id: null,
          last_spreadsheet_name: null,
          last_sheet_name: null,
        },
        type: 'service_account',
      });
      return;
    }

    const userId = req.user?.id;
    if (!userId) {
      res.json({ connected: false, user: null });
      return;
    }

    const { data: connection, error } = await supabaseAdmin
      .from('google_connections')
      .select('google_email, google_name, google_avatar_url, last_spreadsheet_id, last_spreadsheet_name, last_sheet_name, updated_at')
      .eq('user_id', userId)
      .single();

    if (error || !connection) {
      res.json({ connected: false, connection: null });
      return;
    }

    res.json({ connected: true, connection, type: 'oauth' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch status';
    res.status(500).json({ connected: false, error: msg });
  }
});

// 2. DELETE /api/google/status (Disconnect)
router.delete('/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await supabaseAdmin
      .from('google_connections')
      .delete()
      .eq('user_id', userId);

    res.json({ success: true, message: 'Google account disconnected successfully.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to disconnect';
    res.status(500).json({ error: msg });
  }
});

// 3. GET /api/google/auth
router.get('/auth', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: 'Missing userId parameter' });
      return;
    }

    const oauth2Client = getOAuth2Client();
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: GOOGLE_SCOPES,
      state: userId,
    });

    res.redirect(authUrl);
  } catch (error: unknown) {
    console.error('Google Auth Init Error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to initialize Google login';
    res.status(500).json({ error: msg });
  }
});

// 4. GET /api/google/callback
router.get('/callback', async (req, res) => {
  const code = req.query.code as string;
  const error = req.query.error as string;
  const state = req.query.state as string;

  const appUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error || !code) {
    res.redirect(`${appUrl}/google-sheets?error=${encodeURIComponent(error || 'Access denied by user')}`);
    return;
  }

  try {
    const userId = state;
    if (!userId) {
      res.redirect(`${appUrl}/google-sheets?error=User%20session%20not%20found`);
      return;
    }

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null;

    const { error: upsertError } = await supabaseAdmin
      .from('google_connections')
      .upsert({
        user_id: userId,
        google_email: userInfo.data.email || null,
        google_name: userInfo.data.name || null,
        google_avatar_url: userInfo.data.picture || null,
        access_token: tokens.access_token || '',
        refresh_token: tokens.refresh_token || null,
        token_expiry: tokenExpiry,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Supabase Google Connection Upsert Error:', upsertError);
    }

    res.redirect(`${appUrl}/google-sheets?connected=true`);
  } catch (err: unknown) {
    console.error('Google OAuth Callback Error:', err);
    const msg = err instanceof Error ? err.message : 'Authentication failed';
    res.redirect(`${appUrl}/google-sheets?error=${encodeURIComponent(msg)}`);
  }
});

// 5. POST /api/google/sheets/connect
router.post('/sheets/connect', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { url } = req.body;

    if (!url) {
      res.status(400).json({ error: 'Please provide a Google Spreadsheet URL.' });
      return;
    }

    const spreadsheetId = extractSpreadsheetId(url);
    if (!spreadsheetId) {
      res.status(400).json({
        error: 'Invalid Google Spreadsheet URL. Format must look like: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit',
      });
      return;
    }

    const { sheets } = await getAuthenticatedSheetsClient(userId);

    let spreadsheetMeta;
    try {
      const response: any = await sheets.spreadsheets.get({
        spreadsheetId,
      });
      spreadsheetMeta = response.data;
    } catch (gError: any) {
      console.error('Google Sheets API Access Error:', gError);
      if (gError.code === 404) {
        res.status(404).json({ error: 'Spreadsheet not found. Please check the URL.' });
        return;
      }
      if (gError.code === 403) {
        res.status(403).json({
          error: 'Unable to access this spreadsheet. Please make sure your connected Google account has permission to view and edit this sheet.',
        });
        return;
      }
      res.status(400).json({ error: gError.message || 'Failed to access Google Spreadsheet.' });
      return;
    }

    const spreadsheetTitle = spreadsheetMeta.properties?.title || 'Untitled Spreadsheet';
    const sheetTabs = (spreadsheetMeta.sheets || []).map((s: any) => ({
      sheetId: s.properties?.sheetId,
      title: s.properties?.title || 'Sheet1',
      index: s.properties?.index,
    }));

    const defaultSheet = sheetTabs[0]?.title || 'Sheet1';

    if (userId) {
      await supabaseAdmin
        .from('google_connections')
        .update({
          last_spreadsheet_id: spreadsheetId,
          last_spreadsheet_name: spreadsheetTitle,
          last_sheet_name: defaultSheet,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    res.json({
      success: true,
      spreadsheetId,
      title: spreadsheetTitle,
      sheets: sheetTabs,
      defaultSheet,
    });
  } catch (err: unknown) {
    console.error('Connect Spreadsheet Error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to connect spreadsheet';
    res.status(500).json({ error: msg });
  }
});

// 6. GET /api/google/sheets/:spreadsheetId
router.get('/sheets/:spreadsheetId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const spreadsheetId = String(req.params.spreadsheetId);
    const sheetName = String(req.query.sheet || 'Sheet1');
    const userId = req.user?.id;

    const { sheets } = await getAuthenticatedSheetsClient(userId);

    const metaRes: any = await sheets.spreadsheets.get({ spreadsheetId });
    const tabs = (metaRes.data.sheets || []).map((s: any) => s.properties?.title || 'Sheet1');
    const spreadsheetTitle = metaRes.data.properties?.title || 'Google Sheet';

    let rawValues: string[][] = [];
    try {
      const dataRes: any = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:Z500`,
      });
      rawValues = (dataRes.data?.values || []) as string[][];
    } catch {
      rawValues = [];
    }

    let headerRowIdx = -1;
    for (let r = 0; r < Math.min(rawValues.length, 10); r++) {
      const row = rawValues[r] || [];
      const nonBlank = row.filter((c) => c !== undefined && String(c).trim() !== '');
      if (nonBlank.length >= 2) {
        headerRowIdx = r;
        break;
      }
    }

    let headers: string[] = [];
    let rows: string[][] = [];

    if (headerRowIdx !== -1) {
      const detectedHeaders = rawValues[headerRowIdx] || [];
      let maxCols = detectedHeaders.length;
      rawValues.forEach((r) => {
        if (r.length > maxCols) maxCols = r.length;
      });

      headers = Array.from({ length: maxCols }, (_, i) => {
        const val = detectedHeaders[i];
        return val && String(val).trim() ? String(val).trim() : `Col ${i + 1}`;
      });

      rows = rawValues.slice(headerRowIdx + 1).filter((r) => {
        return r.some((c) => c !== undefined && String(c).trim() !== '');
      });
    } else if (rawValues.length > 0) {
      headers = rawValues[0].map((h, i) => (h && String(h).trim() ? String(h).trim() : `Col ${i + 1}`));
      rows = rawValues.slice(1);
    }

    res.json({
      success: true,
      title: spreadsheetTitle,
      tabs,
      activeSheet: sheetName,
      headers,
      rows,
      totalRows: rows.length,
    });
  } catch (err: unknown) {
    console.error('Fetch Sheet Data Error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to fetch sheet data';
    res.status(500).json({ error: msg });
  }
});

// 7. POST /api/google/sheets/:spreadsheetId
router.post('/sheets/:spreadsheetId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const spreadsheetId = String(req.params.spreadsheetId);
    const { sheetName = 'Sheet1', rows, singleRow, mode = 'overwrite' } = req.body;
    const userId = req.user?.id;

    const { sheets } = await getAuthenticatedSheetsClient(userId);

    const rowsToPut: (string | number)[][] = [];
    if (Array.isArray(rows) && rows.length > 0) {
      rows.forEach((r) => {
        if (Array.isArray(r)) rowsToPut.push(r);
      });
    } else if (Array.isArray(singleRow)) {
      rowsToPut.push(singleRow);
    }

    if (rowsToPut.length === 0) {
      res.status(400).json({ error: 'No row data provided to add.' });
      return;
    }

    const metaRes: any = await sheets.spreadsheets.get({ spreadsheetId });
    const targetSheet = (metaRes.data.sheets || []).find((s: any) => s.properties?.title === sheetName) || metaRes.data.sheets?.[0];
    const sheetId = targetSheet?.properties?.sheetId || 0;

    if (mode === 'overwrite') {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!A1:Z100`,
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: rowsToPut,
        },
      });

      const totalRowCount = rowsToPut.length;
      const headerRowIndex = 3;
      const totalRowIndex = totalRowCount - 1;

      const requests: any[] = [
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 0,
              endRowIndex: totalRowCount,
              startColumnIndex: 0,
              endColumnIndex: 5,
            },
            cell: {
              userEnteredFormat: {
                numberFormat: { type: 'TEXT' },
                textFormat: { fontFamily: 'Arial', fontSize: 10 },
                borders: {
                  top: { style: 'SOLID', color: { red: 0.85, green: 0.85, blue: 0.85 } },
                  bottom: { style: 'SOLID', color: { red: 0.85, green: 0.85, blue: 0.85 } },
                  left: { style: 'SOLID', color: { red: 0.85, green: 0.85, blue: 0.85 } },
                  right: { style: 'SOLID', color: { red: 0.85, green: 0.85, blue: 0.85 } },
                },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
              },
            },
            fields: 'userEnteredFormat(numberFormat,textFormat,borders,horizontalAlignment,verticalAlignment)',
          },
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: headerRowIndex,
              endRowIndex: headerRowIndex + 1,
              startColumnIndex: 0,
              endColumnIndex: 5,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.38, green: 0.38, blue: 0.38 },
                textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 1, green: 1, blue: 1 }, fontFamily: 'Arial' },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
          },
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: totalRowIndex,
              endRowIndex: totalRowIndex + 1,
              startColumnIndex: 0,
              endColumnIndex: 5,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.38, green: 0.38, blue: 0.38 },
                textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 1, green: 1, blue: 1 }, fontFamily: 'Arial' },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
          },
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 1,
              endRowIndex: 2,
              startColumnIndex: 0,
              endColumnIndex: 5,
            },
            cell: {
              userEnteredFormat: {
                numberFormat: { type: 'TEXT' },
                textFormat: { fontSize: 11, bold: false, fontFamily: 'Arial' },
                borders: {
                  top: { style: 'NONE' },
                  bottom: { style: 'NONE' },
                  left: { style: 'NONE' },
                  right: { style: 'NONE' },
                },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
              },
            },
            fields: 'userEnteredFormat(numberFormat,textFormat,borders,horizontalAlignment,verticalAlignment)',
          },
        },
      ];

      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests,
          },
        });
      } catch (styleErr) {
        console.error('BatchUpdate styling error:', styleErr);
      }

      res.json({
        success: true,
        message: 'Spreadsheet overwritten with exact matching styles and values.',
      });
      return;
    }

    const appendRes: any = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: rowsToPut,
      },
    });

    res.json({
      success: true,
      updatedRows: appendRes.data?.updates?.updatedRows || rowsToPut.length,
      updatedRange: appendRes.data?.updates?.updatedRange,
    });
  } catch (err: unknown) {
    console.error('Save Sheet Rows Error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to update Google Spreadsheet';
    res.status(500).json({ error: msg });
  }
});

export default router;
