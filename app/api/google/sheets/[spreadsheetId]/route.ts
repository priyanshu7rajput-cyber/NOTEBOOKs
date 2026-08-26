import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedSheetsClient } from '@/lib/google/authenticatedClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spreadsheetId: string }> }
) {
  try {
    const { spreadsheetId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const sheetName = searchParams.get('sheet') || 'Sheet1';

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sheets } = await getAuthenticatedSheetsClient(user.id);

    // 1. Fetch metadata (tabs)
    const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
    const tabs = (metaRes.data.sheets || []).map((s) => s.properties?.title || 'Sheet1');
    const spreadsheetTitle = metaRes.data.properties?.title || 'Google Sheet';

    // 2. Fetch rows for the active sheet tab
    let rawValues: string[][] = [];
    try {
      const dataRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:Z500`,
      });
      rawValues = dataRes.data.values || [];
    } catch {
      rawValues = [];
    }

    // Auto-detect the real header row (e.g., look for "Name", "Opening", or the first row with multiple non-empty columns)
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
      // Calculate max columns
      let maxCols = detectedHeaders.length;
      rawValues.forEach((r) => {
        if (r.length > maxCols) maxCols = r.length;
      });

      headers = Array.from({ length: maxCols }, (_, i) => {
        const val = detectedHeaders[i];
        return val && String(val).trim() ? String(val).trim() : `Col ${i + 1}`;
      });

      // Data rows are everything after the header row (excluding empty rows)
      rows = rawValues.slice(headerRowIdx + 1).filter((r) => {
        return r.some((c) => c !== undefined && String(c).trim() !== '');
      });
    } else if (rawValues.length > 0) {
      headers = rawValues[0].map((h, i) => (h && String(h).trim() ? String(h).trim() : `Col ${i + 1}`));
      rows = rawValues.slice(1);
    }

    return NextResponse.json({
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
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spreadsheetId: string }> }
) {
  try {
    const { spreadsheetId } = await params;
    const body = await request.json();
    const { sheetName = 'Sheet1', rows, singleRow, mode = 'overwrite' } = body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sheets } = await getAuthenticatedSheetsClient(user.id);

    // Prepare rows
    const rowsToPut: (string | number)[][] = [];
    if (Array.isArray(rows) && rows.length > 0) {
      rows.forEach((r) => {
        if (Array.isArray(r)) rowsToPut.push(r);
      });
    } else if (Array.isArray(singleRow)) {
      rowsToPut.push(singleRow);
    }

    if (rowsToPut.length === 0) {
      return NextResponse.json({ error: 'No row data provided to add.' }, { status: 400 });
    }

    // Get Sheet ID for batchUpdate formatting
    const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
    const targetSheet = metaRes.data.sheets?.find((s) => s.properties?.title === sheetName) || metaRes.data.sheets?.[0];
    const sheetId = targetSheet?.properties?.sheetId || 0;

    if (mode === 'overwrite') {
      // 1. Clear existing content in sheet
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!A1:Z100`,
      });

      // 2. Put new formatted data starting at A1 (with RAW value input option so numbers don't become dates)
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: rowsToPut,
        },
      });

      // 3. Apply exact styling: Grey headers, grey totals, borders, alignments, number formats
      // Calculate row indices:
      // Row 2 (index 1): Date
      // Row 4 (index 3): Header [Name, Opening, New, Solved, Closing]
      // Data Rows: index 4 to 4 + (N - 1)
      // Total Row: index 4 + N
      const totalRowCount = rowsToPut.length;
      const headerRowIndex = 3; // 4th row (0-indexed 3)
      const totalRowIndex = totalRowCount - 1;

      const requests: any[] = [
        // Set all cells in range to plain text/number format, centered, Arial 10pt with clean borders
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
        // Header Row Styling (Charcoal Grey #595959, Bold White text, centered)
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
        // Total Row Styling (Charcoal Grey #595959, Bold White text, centered)
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
        // Date Row (Row 2, Column C) - Plain Text, Arial 11pt, Centered, No borders
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

      return NextResponse.json({
        success: true,
        message: 'Spreadsheet overwritten with exact matching styles and values.',
      });
    }

    // Default: Append
    const appendRes = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: rowsToPut,
      },
    });

    return NextResponse.json({
      success: true,
      updatedRows: appendRes.data.updates?.updatedRows || rowsToPut.length,
      updatedRange: appendRes.data.updates?.updatedRange,
    });
  } catch (err: unknown) {
    console.error('Save Sheet Rows Error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to update Google Spreadsheet';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
