import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractSpreadsheetId } from '@/lib/google/sheets';
import { getAuthenticatedSheetsClient } from '@/lib/google/authenticatedClient';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in first.' }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'Please provide a Google Spreadsheet URL.' }, { status: 400 });
    }

    const spreadsheetId = extractSpreadsheetId(url);
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Invalid Google Spreadsheet URL. Format must look like: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit' },
        { status: 400 }
      );
    }

    // Connect to Google Sheets API and verify permissions
    const { sheets } = await getAuthenticatedSheetsClient(user.id);

    let spreadsheetMeta;
    try {
      const response = await sheets.spreadsheets.get({
        spreadsheetId,
      });
      spreadsheetMeta = response.data;
    } catch (gError: any) {
      console.error('Google Sheets API Access Error:', gError);
      if (gError.code === 404) {
        return NextResponse.json({ error: 'Spreadsheet not found. Please check the URL.' }, { status: 404 });
      }
      if (gError.code === 403) {
        return NextResponse.json(
          { error: 'Unable to access this spreadsheet. Please make sure your connected Google account has permission to view and edit this sheet.' },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: gError.message || 'Failed to access Google Spreadsheet.' }, { status: 400 });
    }

    const spreadsheetTitle = spreadsheetMeta.properties?.title || 'Untitled Spreadsheet';
    const sheetTabs = (spreadsheetMeta.sheets || []).map((s) => ({
      sheetId: s.properties?.sheetId,
      title: s.properties?.title || 'Sheet1',
      index: s.properties?.index,
    }));

    const defaultSheet = sheetTabs[0]?.title || 'Sheet1';

    // Update connection record in DB
    await supabase
      .from('google_connections')
      .update({
        last_spreadsheet_id: spreadsheetId,
        last_spreadsheet_name: spreadsheetTitle,
        last_sheet_name: defaultSheet,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      spreadsheetId,
      title: spreadsheetTitle,
      sheets: sheetTabs,
      defaultSheet,
    });
  } catch (err: unknown) {
    console.error('Connect Spreadsheet Error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to connect spreadsheet';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
