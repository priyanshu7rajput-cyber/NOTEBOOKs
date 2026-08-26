import * as XLSX from 'xlsx';

export interface TaskReportRow {
  name: string;
  opening: number;
  newCount: number;
  solvedCount: number;
  closing: number;
}

export interface DailyReportSummary {
  newToday: number;
  solvedToday: number;
  totalPending: number;
  totalOpening: number;
}

export interface ProcessedReportResult {
  rows: TaskReportRow[];
  summary: DailyReportSummary;
}

/**
 * Normalizes task name strictly for comparison and grouping (handles lowercase, spaces, punctuation/newlines)
 */
export function normalizeTaskName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Helper to find column header in a flexible manner
 */
function findKeyCaseInsensitive(row: Record<string, unknown>, possibleKeys: string[]): string | undefined {
  const keys = Object.keys(row);
  for (const possible of possibleKeys) {
    const found = keys.find((k) => k.trim().toLowerCase() === possible.toLowerCase());
    if (found) return found;
  }
  return undefined;
}

/**
 * Reads workbook buffer from File
 */
async function readWorkbookFromFile(file: File): Promise<XLSX.WorkBook> {
  const buffer = await file.arrayBuffer();
  return XLSX.read(buffer, { type: 'buffer' });
}

/**
 * Parses raw Excel rows into structured objects, finding the real header row even if there are top title rows or empty rows
 */
function extractRowsWithHeaders(sheet: XLSX.WorkSheet): { rows: Record<string, unknown>[]; headerKeys: string[] } {
  // Convert sheet to 2D array of cells
  const grid: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (grid.length === 0) return { rows: [], headerKeys: [] };

  // Find the row index that looks like a header (contains string values like name/task/closing/status)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(grid.length, 10); i++) {
    const row = grid[i];
    if (!Array.isArray(row)) continue;
    const stringCells = row.map((c) => String(c).trim().toLowerCase());
    const hasMatch = stringCells.some((cell) =>
      ['name', 'task', 'task name', 'title', 'closing', 'opening', 'status', 'summary', 'bug'].some((term) =>
        cell.includes(term)
      )
    );
    if (hasMatch) {
      headerRowIndex = i;
      break;
    }
  }

  const rawHeaders: string[] = (grid[headerRowIndex] || []).map((h: any) => String(h || '').trim());
  const rows: Record<string, unknown>[] = [];

  for (let i = headerRowIndex + 1; i < grid.length; i++) {
    const rowCells = grid[i];
    if (!Array.isArray(rowCells) || rowCells.every((c) => !c && c !== 0)) continue;

    const rowObj: Record<string, unknown> = {};
    rawHeaders.forEach((header, colIdx) => {
      const key = header || `__col_${colIdx}`;
      rowObj[key] = rowCells[colIdx] !== undefined ? rowCells[colIdx] : '';
    });
    rows.push(rowObj);
  }

  return { rows, headerKeys: rawHeaders };
}

/**
 * Parses Previous Day Excel
 * Required columns: Name (or Task Name, Task) and Closing (or Closing Tasks, Closing Count)
 */
export async function parsePreviousDayExcel(file: File): Promise<Map<string, { displayName: string; closing: number }>> {
  const workbook = await readWorkbookFromFile(file);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('Previous Day Excel is empty (no sheets found).');

  const sheet = workbook.Sheets[sheetName];
  const { rows: rawRows, headerKeys } = extractRowsWithHeaders(sheet);

  if (rawRows.length === 0) {
    throw new Error('Previous Day Excel contains no data rows.');
  }

  // Find Name column with broad aliases
  const sampleRow = rawRows[0] || {};
  let nameKey = findKeyCaseInsensitive(sampleRow, [
    'Name',
    'Task Name',
    'Task',
    'Task Title',
    'Title',
    'Task Description',
    'Bug Name',
    'Tasks',
    'Items',
    'Description',
  ]);

  // Fallback: search by substring in all detected header keys
  if (!nameKey) {
    nameKey = headerKeys.find((k) => {
      const lower = k.toLowerCase();
      return lower.includes('name') || lower.includes('task') || lower.includes('title');
    });
  }

  // Find Closing column
  let closingKey = findKeyCaseInsensitive(sampleRow, [
    'Closing',
    'Closing Balance',
    'Closing Count',
    'Close',
    'Closing Tasks',
    'Pending',
    'Balance',
  ]);

  if (!closingKey) {
    closingKey = headerKeys.find((k) => {
      const lower = k.toLowerCase();
      return lower.includes('clos') || lower.includes('pend') || lower.includes('bal');
    });
  }

  if (!nameKey) {
    const foundHeadersList = headerKeys.filter(Boolean).join(', ');
    throw new Error(
      `Required column "Name" (or "Task Name") not found. Found columns: [${foundHeadersList || 'None'}]`
    );
  }

  const previousData = new Map<string, { displayName: string; closing: number }>();

  for (const row of rawRows) {
    const rawName = String(row[nameKey] || '').trim();
    if (!rawName) continue;

    // Ignore 'Total' row from previous excel if present
    if (rawName.toLowerCase() === 'total' || rawName.toLowerCase() === 'grand total') {
      continue;
    }

    const norm = normalizeTaskName(rawName);
    if (!norm) continue;

    let closingVal = 0;
    if (closingKey && row[closingKey] !== undefined) {
      const rawClosing = row[closingKey];
      const parsedClosing = Number(rawClosing);
      closingVal = isNaN(parsedClosing) ? 0 : parsedClosing;
    }

    previousData.set(norm, {
      displayName: rawName,
      closing: closingVal,
    });
  }

  return previousData;
}

/**
 * Parses Previous Day data directly from Google Sheets rows & headers
 */
export function parsePreviousDayFromGoogleSheet(
  headers: string[],
  rows: string[][]
): Map<string, { displayName: string; closing: number }> {
  if (!rows || rows.length === 0) {
    throw new Error('Google Spreadsheet contains no data rows.');
  }

  // Find Name column index
  let nameColIdx = headers.findIndex((h) => {
    const l = h.toLowerCase();
    return l === 'name' || l === 'developer' || l === 'person' || l.includes('name');
  });
  if (nameColIdx === -1) nameColIdx = 0;

  // Find Closing column index (or last column)
  let closingColIdx = headers.findIndex((h) => {
    const l = h.toLowerCase();
    return l.includes('clos') || l.includes('pend') || l.includes('bal');
  });
  if (closingColIdx === -1) {
    // Default to last column
    closingColIdx = headers.length - 1;
  }

  const previousData = new Map<string, { displayName: string; closing: number }>();

  for (const row of rows) {
    const rawName = String(row[nameColIdx] || '').trim();
    if (!rawName) continue;

    if (rawName.toLowerCase() === 'total' || rawName.toLowerCase() === 'grand total') {
      continue;
    }

    const norm = normalizeTaskName(rawName);
    if (!norm) continue;

    let closingVal = 0;
    if (closingColIdx >= 0 && row[closingColIdx] !== undefined) {
      const parsed = Number(row[closingColIdx]);
      closingVal = isNaN(parsed) ? 0 : parsed;
    }

    previousData.set(norm, {
      displayName: rawName,
      closing: closingVal,
    });
  }

  return previousData;
}

/**
 * Parses Task Names or Developer/Assignee Names from Excel (New Tasks or Solved Tasks)
 * If developer/assignee/person column exists, extracts that for person-wise grouping.
 * Also extracts task names.
 */
export async function parseTaskNamesFromExcel(
  file: File,
  fileTypeLabel: 'New Tasks' | 'Solved Tasks'
): Promise<{
  names: string[];
  normalizedCounts: Map<string, { displayName: string; count: number }>;
  developerCounts: Map<string, { displayName: string; count: number }>;
}> {
  const workbook = await readWorkbookFromFile(file);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error(`${fileTypeLabel} Excel is empty (no sheets found).`);

  const sheet = workbook.Sheets[sheetName];
  const { rows: rawRows, headerKeys } = extractRowsWithHeaders(sheet);

  if (rawRows.length === 0) {
    return { names: [], normalizedCounts: new Map(), developerCounts: new Map() };
  }

  const sampleRow = rawRows[0] || {};
  let nameKey = findKeyCaseInsensitive(sampleRow, [
    'Task Name',
    'Name',
    'Task',
    'Task Title',
    'Title',
    'Bug Name',
    'Summary',
    'Task Description',
    'Description',
    'Tasks',
    'Subject',
  ]);

  if (!nameKey) {
    nameKey = headerKeys.find((k) => {
      const lower = k.toLowerCase();
      return (
        lower.includes('task') ||
        lower.includes('name') ||
        lower.includes('title') ||
        lower.includes('summary') ||
        lower.includes('bug') ||
        lower.includes('subject')
      );
    });
  }

  // Also check for Developer / Assignee / Person / Owner column
  let devKey = findKeyCaseInsensitive(sampleRow, [
    'Developer',
    'Developer Name',
    'Assignee',
    'Assigned To',
    'Person',
    'Owner',
    'Member',
    'User',
    'Dev',
  ]);

  if (!devKey) {
    devKey = headerKeys.find((k) => {
      const lower = k.toLowerCase();
      return (
        lower.includes('dev') ||
        lower.includes('assign') ||
        lower.includes('person') ||
        lower.includes('owner') ||
        lower.includes('member')
      );
    });
  }

  if (!nameKey && !devKey) {
    const foundHeadersList = headerKeys.filter(Boolean).join(', ');
    throw new Error(
      `Required column "Task Name" or "Developer" not found in ${fileTypeLabel} Excel. Found columns: [${foundHeadersList || 'None'}]`
    );
  }

  const names: string[] = [];
  const normalizedCounts = new Map<string, { displayName: string; count: number }>();
  const developerCounts = new Map<string, { displayName: string; count: number }>();

  for (const row of rawRows) {
    // 1. Task Name counting
    if (nameKey) {
      const rawName = String(row[nameKey] || '').trim();
      if (rawName && rawName.toLowerCase() !== 'total' && rawName.toLowerCase() !== 'grand total') {
        const norm = normalizeTaskName(rawName);
        if (norm) {
          names.push(rawName);
          const existing = normalizedCounts.get(norm);
          if (existing) {
            existing.count += 1;
          } else {
            normalizedCounts.set(norm, { displayName: rawName, count: 1 });
          }
        }
      }
    }

    // 2. Developer/Person counting
    if (devKey) {
      const rawDev = String(row[devKey] || '').trim();
      if (rawDev && rawDev.toLowerCase() !== 'total' && rawDev.toLowerCase() !== 'grand total') {
        const normDev = normalizeTaskName(rawDev);
        if (normDev) {
          const existingDev = developerCounts.get(normDev);
          if (existingDev) {
            existingDev.count += 1;
          } else {
            developerCounts.set(normDev, { displayName: rawDev, count: 1 });
          }
        }
      }
    }
  }

  return { names, normalizedCounts, developerCounts };
}

/**
 * Helper to check if two names fuzzy match (e.g. 'Meet' matches 'Meet Patel', 'Dhara' matches 'Dhara S', or vice-versa)
 */
function isNameFuzzyMatch(nameA: string, nameB: string): boolean {
  if (!nameA || !nameB) return false;
  const a = normalizeTaskName(nameA);
  const b = normalizeTaskName(nameB);
  if (a === b) return true;

  // Word-level inclusion matching (e.g., 'meet' in 'meet shah')
  const wordsA = a.split(' ').filter(Boolean);
  const wordsB = b.split(' ').filter(Boolean);

  if (wordsA.some((w) => wordsB.includes(w) && w.length >= 3)) return true;
  if (a.includes(b) || b.includes(a)) return true;

  return false;
}

/**
 * Calculates Full Daily Task Report strictly by developer/user names found in Previous Excel:
 * Finds New Tasks and Solved Tasks assigned to each developer using fuzzy/partial name matching.
 */
export function calculateDailyTaskReport(
  previousData: Map<string, { displayName: string; closing: number }>,
  newTasksData: { names: string[]; normalizedCounts: Map<string, { displayName: string; count: number }>; developerCounts: Map<string, { displayName: string; count: number }> },
  solvedTasksData: { names: string[]; normalizedCounts: Map<string, { displayName: string; count: number }>; developerCounts: Map<string, { displayName: string; count: number }> }
): ProcessedReportResult {
  const rows: TaskReportRow[] = [];

  let totalOpening = 0;
  let totalNew = 0;
  let totalSolved = 0;
  let totalClosing = 0;

  // We strictly iterate through the Users/Developers defined in the Previous Day Excel
  // e.g. Pravin, Meet, Dhara, Chetali, Sir, Smit
  const prevEntries = Array.from(previousData.entries());

  for (const [normPrevName, prevInfo] of prevEntries) {
    const displayName = prevInfo.displayName;
    const opening = prevInfo.closing;

    // 1. Calculate New Count for this developer (Fuzzy match against Developer column or Task list)
    let newCount = 0;
    for (const [rawDevName, devEntry] of newTasksData.developerCounts.entries()) {
      if (isNameFuzzyMatch(rawDevName, normPrevName) || isNameFuzzyMatch(devEntry.displayName, displayName)) {
        newCount += devEntry.count;
      }
    }

    // 2. Calculate Solved Count for this developer (Fuzzy match against Developer column or Task list)
    let solvedCount = 0;
    for (const [rawDevName, devEntry] of solvedTasksData.developerCounts.entries()) {
      if (isNameFuzzyMatch(rawDevName, normPrevName) || isNameFuzzyMatch(devEntry.displayName, displayName)) {
        solvedCount += devEntry.count;
      }
    }

    // Closing = Opening + New - Solved
    const closing = opening + newCount - solvedCount;

    rows.push({
      name: displayName,
      opening,
      newCount,
      solvedCount,
      closing,
    });

    totalOpening += opening;
    totalNew += newCount;
    totalSolved += solvedCount;
    totalClosing += closing;
  }

  // Fallback: If previous Excel was empty or not developer list, show raw task counts
  if (rows.length === 0) {
    const allKeys = new Set([...newTasksData.normalizedCounts.keys(), ...solvedTasksData.normalizedCounts.keys()]);
    for (const k of allKeys) {
      const nEntry = newTasksData.normalizedCounts.get(k);
      const sEntry = solvedTasksData.normalizedCounts.get(k);
      const dName = nEntry?.displayName || sEntry?.displayName || k;
      const n = nEntry?.count || 0;
      const s = sEntry?.count || 0;
      const c = n - s;
      rows.push({
        name: dName,
        opening: 0,
        newCount: n,
        solvedCount: s,
        closing: c,
      });
      totalNew += n;
      totalSolved += s;
      totalClosing += c;
    }
  }

  return {
    rows,
    summary: {
      newToday: totalNew,
      solvedToday: totalSolved,
      totalPending: totalClosing,
      totalOpening,
    },
  };
}

/**
 * Generates and downloads formatted Excel file (.xlsx) with exact styling:
 * - Row 2: Date centered across columns with clean font
 * - Row 4: Dark Grey Header (#595959 / #666666) with bold text
 * - Data Rows: Arial/Calibri 11pt, clean cell borders, right-aligned numbers, left-aligned names
 * - Total Row: Dark Grey Background (#595959 / #666666), bold text & numbers
 */
export async function exportDailyReportToExcel(rows: TaskReportRow[], dateStr = new Date().toISOString().split('T')[0]) {
  // Dynamic import of ExcelJS
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1', {
    views: [{ showGridLines: true }],
  });

  // Set column widths
  worksheet.columns = [
    { key: 'name', width: 22 },
    { key: 'opening', width: 14 },
    { key: 'new', width: 14 },
    { key: 'solved', width: 14 },
    { key: 'closing', width: 14 },
  ];

  // Format date: e.g. "26/8/2026"
  let formattedDate = dateStr;
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      formattedDate = `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${parts[0]}`;
    }
  } catch {
    formattedDate = dateStr;
  }

  // Row 1: Blank
  worksheet.addRow([]);

  // Row 2: Date centered above table in Column C (or merged A2:E2)
  const dateRow = worksheet.addRow(['', '', formattedDate, '', '']);
  dateRow.height = 22;
  const dateCell = dateRow.getCell(3);
  dateCell.font = { name: 'Arial', size: 12, bold: false, color: { argb: 'FF000000' } };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 3: Blank
  worksheet.addRow([]);

  // Row 4: Header
  const headerRow = worksheet.addRow(['Name', 'Opening', 'New', 'Solved', 'Closing']);
  headerRow.height = 26;

  const headerFill: any = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF666666' }, // Dark charcoal/grey matching screenshot
  };

  const headerFont = {
    name: 'Arial',
    size: 11,
    bold: false,
    color: { argb: 'FFFFFFFF' }, // White/light text on grey background
  };

  const thinBorder: any = {
    top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
    left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
    bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
    right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
  };

  headerRow.eachCell((cell, colNumber) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = {
      horizontal: colNumber === 1 ? 'center' : 'center',
      vertical: 'middle',
    };
    cell.border = thinBorder;
  });

  // Calculate totals
  const totalOpening = rows.reduce((acc, r) => acc + r.opening, 0);
  const totalNew = rows.reduce((acc, r) => acc + r.newCount, 0);
  const totalSolved = rows.reduce((acc, r) => acc + r.solvedCount, 0);
  const totalClosing = rows.reduce((acc, r) => acc + r.closing, 0);

  // Data rows
  rows.forEach((r) => {
    const dataRow = worksheet.addRow([
      r.name,
      r.opening > 0 ? r.opening : '',
      r.newCount > 0 ? r.newCount : '',
      r.solvedCount > 0 ? r.solvedCount : '',
      r.closing,
    ]);
    dataRow.height = 20;

    dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Arial', size: 11, color: { argb: 'FF000000' } };
      cell.alignment = {
        horizontal: colNumber === 1 ? 'left' : 'center',
        vertical: 'middle',
      };
      cell.border = thinBorder;
    });
  });

  // Total row
  const totalRow = worksheet.addRow([
    'Total',
    totalOpening,
    totalNew,
    totalSolved,
    totalClosing,
  ]);
  totalRow.height = 24;

  totalRow.eachCell((cell, colNumber) => {
    cell.fill = headerFill;
    cell.font = { name: 'Arial', size: 11, bold: false, color: { argb: 'FFFFFFFF' } };
    cell.alignment = {
      horizontal: colNumber === 1 ? 'center' : 'center',
      vertical: 'middle',
    };
    cell.border = thinBorder;
  });

  // Write and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Daily_Task_Report_${dateStr}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

/**
 * Generates the standardized daily text message with itemized pending & completed tasks list
 */
export function generateDailyReportMessage(
  summary: DailyReportSummary,
  verifiedCount: number = 0,
  newTasks: string[] = [],
  solvedTasks: string[] = []
): string {
  // Deduplicate task names while preserving order
  const uniqueNew = Array.from(new Set(newTasks.map((t) => t.trim()).filter(Boolean)));
  const uniqueSolved = Array.from(new Set(solvedTasks.map((t) => t.trim()).filter(Boolean)));

  const newTasksList =
    uniqueNew.length > 0
      ? uniqueNew.map((task, idx) => `${idx + 1}. ${task}`).join('\n')
      : 'None';

  const solvedTasksList =
    uniqueSolved.length > 0
      ? uniqueSolved.map((task, idx) => `${idx + 1}. ${task}`).join('\n')
      : 'None';

  const verifiedLine =
    verifiedCount > 0
      ? `Verified all Task of previous day of Developers (${verifiedCount})`
      : 'Verified all Task of previous day of Developers...';

  return `Today Report :

Zeronine.ai ( Pending Bugs/Feature/Improvement )

${newTasksList}

Zeronine.ai ( Completed Bugs/Feature/Improvement )

${solvedTasksList}

${verifiedLine}`;
}
