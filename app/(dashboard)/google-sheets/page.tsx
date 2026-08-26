'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Table2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Trash2,
  Database,
  Search,
  FileSpreadsheet,
  Link2,
  LogIn,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface GoogleConnection {
  google_email: string | null;
  google_name: string | null;
  google_avatar_url: string | null;
  last_spreadsheet_id: string | null;
  last_spreadsheet_name: string | null;
  last_sheet_name: string | null;
}

function GoogleSheetsContent() {
  const searchParams = useSearchParams();
  const connectedParam = searchParams.get('connected');
  const errorParam = searchParams.get('error');

  // Authentication & Connection State
  const [connection, setConnection] = useState<GoogleConnection | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // Spreadsheet URL & Meta
  const [sheetUrl, setSheetUrl] = useState('');
  const [activeSpreadsheetId, setActiveSpreadsheetId] = useState<string | null>(null);
  const [spreadsheetTitle, setSpreadsheetTitle] = useState('');
  const [tabs, setTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('Sheet1');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);

  // UI Action States
  const [isLoadingSpreadsheet, setIsLoadingSpreadsheet] = useState(false);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add row form data (dynamic map based on headers)
  const [newRowData, setNewRowData] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch initial Google Auth status
  const fetchAuthStatus = async () => {
    setIsCheckingAuth(true);
    try {
      const res = await fetch('/api/google/status');
      const data = await res.json();
      if (data.connected && data.connection) {
        setConnection(data.connection);
        if (data.connection.last_spreadsheet_id) {
          setActiveSpreadsheetId(data.connection.last_spreadsheet_id);
          setSpreadsheetTitle(data.connection.last_spreadsheet_name || 'Connected Sheet');
          if (data.connection.last_sheet_name) {
            setActiveTab(data.connection.last_sheet_name);
          }
          // Auto load existing connected sheet
          loadSheetData(data.connection.last_spreadsheet_id, data.connection.last_sheet_name || 'Sheet1');
        }
      } else {
        setConnection(null);
      }
    } catch {
      setConnection(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    fetchAuthStatus();
    if (connectedParam) {
      setSuccessMessage('Google Account connected successfully!');
    }
    if (errorParam) {
      setErrorMessage(decodeURIComponent(errorParam));
    }
  }, [connectedParam, errorParam]);

  // 2. Connect to a Google Spreadsheet URL
  const handleConnectSpreadsheet = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!sheetUrl.trim()) {
      setErrorMessage('Please paste a valid Google Spreadsheet URL.');
      return;
    }

    setIsLoadingSpreadsheet(true);
    try {
      const res = await fetch('/api/google/sheets/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sheetUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to connect spreadsheet.');
      }

      setActiveSpreadsheetId(data.spreadsheetId);
      setSpreadsheetTitle(data.title);
      setTabs(data.sheets.map((s: any) => s.title));
      setActiveTab(data.defaultSheet);
      setSuccessMessage(`Connected to "${data.title}" successfully!`);

      // Load data for default tab
      await loadSheetData(data.spreadsheetId, data.defaultSheet);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect spreadsheet.';
      setErrorMessage(msg);
    } finally {
      setIsLoadingSpreadsheet(false);
    }
  };

  // 3. Load Sheet Data (Tabs, Headers, Rows)
  const loadSheetData = async (spreadsheetId: string, sheetTab: string) => {
    setIsLoadingSpreadsheet(true);
    try {
      const res = await fetch(`/api/google/sheets/${spreadsheetId}?sheet=${encodeURIComponent(sheetTab)}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch spreadsheet rows.');
      }

      setSpreadsheetTitle(data.title);
      setTabs(data.tabs || [sheetTab]);
      setActiveTab(data.activeSheet || sheetTab);
      setHeaders(data.headers || []);
      setRows(data.rows || []);

      // Reset new row fields
      const initialRowFields: Record<string, string> = {};
      (data.headers || []).forEach((h: string) => {
        initialRowFields[h] = '';
      });
      setNewRowData(initialRowFields);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load sheet data.';
      setErrorMessage(msg);
    } finally {
      setIsLoadingSpreadsheet(false);
    }
  };

  // 4. Add Row to Spreadsheet
  const handleAddRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSpreadsheetId) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsAddingRow(true);

    try {
      // Map dynamic header values to array
      const rowValues = headers.map((h) => newRowData[h] || '');

      // Check if at least one value is non-empty
      if (rowValues.every((v) => !v.trim())) {
        throw new Error('Please enter at least one field value.');
      }

      const res = await fetch(`/api/google/sheets/${activeSpreadsheetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetName: activeTab,
          singleRow: rowValues,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to add row.');
      }

      setSuccessMessage('Row added directly to Google Spreadsheet!');
      
      // Clear form inputs
      const clearedFields: Record<string, string> = {};
      headers.forEach((h) => {
        clearedFields[h] = '';
      });
      setNewRowData(clearedFields);

      // Refresh sheet data
      await loadSheetData(activeSpreadsheetId, activeTab);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add row.';
      setErrorMessage(msg);
    } finally {
      setIsAddingRow(false);
    }
  };

  // 5. Disconnect Google Account
  const handleDisconnectGoogle = async () => {
    if (!confirm('Are you sure you want to disconnect your Google Account?')) return;
    try {
      await fetch('/api/google/status', { method: 'DELETE' });
      setConnection(null);
      setActiveSpreadsheetId(null);
      setHeaders([]);
      setRows([]);
      setSuccessMessage('Google Account disconnected.');
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered rows for fast local search
  const filteredRows = rows.filter((r) =>
    r.some((cell) => cell.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Table2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Google Sheets Integration
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Connect Google OAuth 2.0 and live-read / live-append data to your Google Spreadsheets
            </p>
          </div>
        </div>

        {/* Google Connection Badge / Action */}
        {connection ? (
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl shadow-2xs">
            {connection.google_avatar_url ? (
              <img
                src={connection.google_avatar_url}
                alt="Google User"
                className="w-7 h-7 rounded-full border border-emerald-500"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                G
              </div>
            )}
            <div className="text-left">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{connection.google_name || connection.google_email || 'Connected'}</span>
              </div>
              <span className="text-[10px] text-slate-400 block">{connection.google_email}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnectGoogle}
              title="Disconnect Google Account"
              className="text-slate-400 hover:text-rose-500 text-xs ml-2 h-7 px-2"
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <a
            href="/api/google/auth"
            onClick={() => setIsConnectingGoogle(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition-all"
          >
            {isConnectingGoogle ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Connect Google Account</span>
              </>
            )}
          </a>
        )}
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-700 dark:text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3 text-emerald-700 dark:text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
        </div>
      )}

      {/* STEP 1: Connect Spreadsheet URL Input Card */}
      <div className="space-y-8">
        {/* Card: Paste Google Sheet URL */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Link2 className="w-5 h-5 text-emerald-500" />
              <span>Connect Google Spreadsheet</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste any Google Sheets URL (e.g. <span className="font-mono text-emerald-600">https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit</span>)
            </p>
          </div>

          <form onSubmit={handleConnectSpreadsheet} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FileSpreadsheet className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="Paste Google Sheets URL here (https://docs.google.com/spreadsheets/d/...)"
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoadingSpreadsheet}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shrink-0 h-11 px-6"
            >
              {isLoadingSpreadsheet ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Connect Spreadsheet</span>
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Active Connected Spreadsheet Overview & Data */}
          {activeSpreadsheetId && (
            <div className="space-y-6">
              {/* Spreadsheet Bar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {spreadsheetTitle}
                      </h3>
                      <a
                        href={`https://docs.google.com/spreadsheets/d/${activeSpreadsheetId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-emerald-500"
                        title="Open in Google Sheets"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {activeSpreadsheetId.substring(0, 16)}...
                    </span>
                  </div>
                </div>

                {/* Tabs Selector & Refresh */}
                <div className="flex items-center gap-3">
                  {tabs.length > 0 && (
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Tab:</span>
                      <select
                        value={activeTab}
                        onChange={(e) => {
                          setActiveTab(e.target.value);
                          loadSheetData(activeSpreadsheetId, e.target.value);
                        }}
                        className="bg-transparent text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none cursor-pointer"
                      >
                        {tabs.map((tab) => (
                          <option key={tab} value={tab} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                            {tab}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadSheetData(activeSpreadsheetId, activeTab)}
                    disabled={isLoadingSpreadsheet}
                    className="gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSpreadsheet ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </Button>
                </div>
              </div>

              {/* Form: Add New Row Live to Google Sheet */}
              {headers.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-500" />
                        <span>Add Row to Google Sheet ({activeTab})</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Enter values below to append live data into your Google Spreadsheet.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleAddRow} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {headers.map((header) => (
                        <div key={header} className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block">
                            {header}
                          </label>
                          <input
                            type="text"
                            value={newRowData[header] || ''}
                            onChange={(e) =>
                              setNewRowData((prev) => ({
                                ...prev,
                                [header]: e.target.value,
                              }))
                            }
                            placeholder={`Enter ${header}...`}
                            className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={isAddingRow}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                      >
                        {isAddingRow ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Adding Row...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Add Row to Sheet</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Data Table: Live Rows in Google Sheet */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Table2 className="w-4 h-4 text-emerald-500" />
                      <span>Spreadsheet Data ({rows.length} rows)</span>
                    </h3>
                    <p className="text-xs text-slate-500">Live view of data inside Google Sheets</p>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search rows..."
                      className="w-48 sm:w-64 pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
                        <th className="py-3 px-4 w-12 text-center text-slate-400">#</th>
                        {headers.map((h, i) => (
                          <th key={i} className="py-3 px-4 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={Math.max(headers.length + 1, 2)}
                            className="py-8 text-center text-slate-400 text-xs"
                          >
                            {isLoadingSpreadsheet ? 'Loading spreadsheet rows...' : 'No rows found in this sheet tab.'}
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="py-2.5 px-4 text-center text-slate-400 font-mono">
                              {rIdx + 1}
                            </td>
                            {headers.map((_, cIdx) => (
                              <td key={cIdx} className="py-2.5 px-4 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                {row[cIdx] !== undefined ? String(row[cIdx]) : ''}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}

export default function GoogleSheetsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Google Sheets...</div>}>
      <GoogleSheetsContent />
    </Suspense>
  );
}
