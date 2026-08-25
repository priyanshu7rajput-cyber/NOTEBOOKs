'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  Check,
  Search,
  RefreshCw,
  FileCheck2,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  parsePreviousDayExcel,
  parseTaskNamesFromExcel,
  calculateDailyTaskReport,
  exportDailyReportToExcel,
  generateDailyReportMessage,
  TaskReportRow,
  DailyReportSummary,
} from '@/lib/reports/dailyReport';

export default function DailyTaskReportPage() {
  // File states
  const [previousFile, setPreviousFile] = useState<File | null>(null);
  const [newTasksFile, setNewTasksFile] = useState<File | null>(null);
  const [solvedTasksFile, setSolvedTasksFile] = useState<File | null>(null);

  // Manual inputs
  const [verifiedCount, setVerifiedCount] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Result state
  const [reportRows, setReportRows] = useState<TaskReportRow[] | null>(null);
  const [summary, setSummary] = useState<DailyReportSummary | null>(null);
  const [newTasksList, setNewTasksList] = useState<string[]>([]);
  const [solvedTasksList, setSolvedTasksList] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  const handleProcessReport = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!previousFile && !newTasksFile && !solvedTasksFile) {
      setErrorMessage('Please upload at least one file (Previous Excel, New Tasks Excel, or Solved Tasks Excel).');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Parse Previous Day Excel (if provided)
      let prevData = new Map<string, { displayName: string; closing: number }>();
      if (previousFile) {
        try {
          prevData = await parsePreviousDayExcel(previousFile);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Invalid format';
          throw new Error(`[Previous Day Excel Error] ${msg}`);
        }
      }

      // 2. Parse New Tasks Excel (if provided)
      let newResult = { names: [] as string[], normalizedCounts: new Map<string, { displayName: string; count: number }>(), developerCounts: new Map<string, { displayName: string; count: number }>() };
      if (newTasksFile) {
        try {
          newResult = await parseTaskNamesFromExcel(newTasksFile, 'New Tasks');
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Invalid format';
          throw new Error(`[New Tasks Excel Error] ${msg}`);
        }
      }

      // 3. Parse Solved Tasks Excel (if provided)
      let solvedResult = { names: [] as string[], normalizedCounts: new Map<string, { displayName: string; count: number }>(), developerCounts: new Map<string, { displayName: string; count: number }>() };
      if (solvedTasksFile) {
        try {
          solvedResult = await parseTaskNamesFromExcel(solvedTasksFile, 'Solved Tasks');
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Invalid format';
          throw new Error(`[Solved Tasks Excel Error] ${msg}`);
        }
      }

      // 4. Calculate Report
      const result = calculateDailyTaskReport(prevData, newResult, solvedResult);

      setReportRows(result.rows);
      setSummary(result.summary);
      setNewTasksList(newResult.names);
      setSolvedTasksList(solvedResult.names);
      setSuccessMessage(`Successfully processed ${result.rows.length} unique records!`);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred while processing files.';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadExcel = () => {
    if (!reportRows || reportRows.length === 0) return;
    exportDailyReportToExcel(reportRows, selectedDate);
  };

  const handleCopyMessage = async () => {
    if (!summary) return;
    const msg = generateDailyReportMessage(summary, verifiedCount, newTasksList, solvedTasksList);
    try {
      await navigator.clipboard.writeText(msg);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy to clipboard', e);
    }
  };

  const handleResetAll = () => {
    setPreviousFile(null);
    setNewTasksFile(null);
    setSolvedTasksFile(null);
    setReportRows(null);
    setSummary(null);
    setNewTasksList([]);
    setSolvedTasksList([]);
    setErrorMessage(null);
    setSuccessMessage(null);
    setSearchQuery('');
  };

  // Filtered rows for interactive table search
  const filteredRows = (reportRows || []).filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Daily Task Report
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Automated reconciliation: Opening + New - Solved = Closing
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-violet-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-xs font-mono"
            />
          </div>
          {reportRows && (
            <Button variant="outline" size="sm" onClick={handleResetAll} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Error & Success Alerts */}
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

      {/* Section 1: Upload Files & Verification Input */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-500" />
            <span>1. Upload Files</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload your previous day Closing Excel and today&apos;s New/Solved Task Excels (.xlsx, .xls, .csv)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Previous Day Excel */}
          <div
            className={`border-2 border-dashed rounded-2xl p-5 transition-all flex flex-col justify-between ${
              previousFile
                ? 'border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-violet-400 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Previous Day Excel
                </span>
                {previousFile && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
              <p className="text-[11px] text-slate-400 mb-4">
                Reads <strong>Closing</strong> as today&apos;s <strong>Opening</strong>
              </p>
            </div>

            <div>
              <label className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer transition-all shadow-2xs">
                <FileText className="w-4 h-4 text-violet-500" />
                <span className="truncate max-w-[170px]">
                  {previousFile ? previousFile.name : 'Upload Previous Excel'}
                </span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setPreviousFile(e.target.files[0]);
                  }}
                  className="hidden"
                />
              </label>
              {previousFile && (
                <button
                  onClick={() => setPreviousFile(null)}
                  className="text-[10px] text-rose-500 hover:underline mt-1.5 block mx-auto text-center"
                >
                  Remove file
                </button>
              )}
            </div>
          </div>

          {/* Card 2: New Tasks Excel */}
          <div
            className={`border-2 border-dashed rounded-2xl p-5 transition-all flex flex-col justify-between ${
              newTasksFile
                ? 'border-indigo-500/60 bg-indigo-50/20 dark:bg-indigo-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-violet-400 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  New Tasks Excel
                </span>
                {newTasksFile && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
              </div>
              <p className="text-[11px] text-slate-400 mb-4">
                Extracts <strong>Task Name</strong> only (adds to <strong>New</strong>)
              </p>
            </div>

            <div>
              <label className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer transition-all shadow-2xs">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span className="truncate max-w-[170px]">
                  {newTasksFile ? newTasksFile.name : 'Upload New Excel'}
                </span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setNewTasksFile(e.target.files[0]);
                  }}
                  className="hidden"
                />
              </label>
              {newTasksFile && (
                <button
                  onClick={() => setNewTasksFile(null)}
                  className="text-[10px] text-rose-500 hover:underline mt-1.5 block mx-auto text-center"
                >
                  Remove file
                </button>
              )}
            </div>
          </div>

          {/* Card 3: Solved Tasks Excel */}
          <div
            className={`border-2 border-dashed rounded-2xl p-5 transition-all flex flex-col justify-between ${
              solvedTasksFile
                ? 'border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-violet-400 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Solved Tasks Excel
                </span>
                {solvedTasksFile && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
              <p className="text-[11px] text-slate-400 mb-4">
                Extracts <strong>Task Name</strong> only (subtracts as <strong>Solved</strong>)
              </p>
            </div>

            <div>
              <label className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer transition-all shadow-2xs">
                <FileText className="w-4 h-4 text-emerald-500" />
                <span className="truncate max-w-[170px]">
                  {solvedTasksFile ? solvedTasksFile.name : 'Upload Solved Excel'}
                </span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setSolvedTasksFile(e.target.files[0]);
                  }}
                  className="hidden"
                />
              </label>
              {solvedTasksFile && (
                <button
                  onClick={() => setSolvedTasksFile(null)}
                  className="text-[10px] text-rose-500 hover:underline mt-1.5 block mx-auto text-center"
                >
                  Remove file
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Verified Tasks Input & Process Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="w-full sm:w-auto flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 px-4 py-2 rounded-2xl">
            <FileCheck2 className="w-4 h-4 text-violet-500" />
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Verified Tasks of Previous Day:
            </label>
            <input
              type="number"
              min="0"
              value={verifiedCount}
              onChange={(e) => setVerifiedCount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-20 px-2.5 py-1 text-xs font-bold text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <Button
            onClick={handleProcessReport}
            disabled={isProcessing || (!previousFile && !newTasksFile && !solvedTasksFile)}
            className="w-full sm:w-auto px-8 gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-indigo-500/25 font-bold"
            size="lg"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing files...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Process Report</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Results Section (Summary Cards, Excel Table, Today's Message) */}
      {summary && reportRows && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Section 2: Summary Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-500" />
                <span>Today&apos;s Summary</span>
              </h2>
              <span className="text-xs font-semibold text-slate-400">
                {reportRows.length} Total Task Rows
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Card: Today's New */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                    Today&apos;s New
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-4xl font-extrabold text-slate-900 dark:text-white mt-3">
                  {summary.newToday}
                </div>
                <span className="text-xs font-medium text-slate-400 mt-1 block">
                  New tasks added today
                </span>
              </div>

              {/* Card: Today's Solved */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                    Today&apos;s Solved
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-3">
                  {summary.solvedToday}
                </div>
                <span className="text-xs font-medium text-slate-400 mt-1 block">
                  Tasks completed & closed
                </span>
              </div>

              {/* Card: Total Pending */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                    Total Pending
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-4xl font-extrabold text-rose-600 dark:text-rose-400 mt-3">
                  {summary.totalPending}
                </div>
                <span className="text-xs font-medium text-slate-400 mt-1 block">
                  Total Closing backlog
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Task Report Table with Search & Excel Download */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
                  <span>Task Report</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Itemized task table with calculated Closing counts
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Search in table */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search task name..."
                    className="w-48 sm:w-64 pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <Button
                  onClick={handleDownloadExcel}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  size="sm"
                >
                  <Download className="w-4 h-4" />
                  Download Excel
                </Button>
              </div>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
                    <th className="py-3 px-4 w-12 text-center text-slate-400">#</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4 text-right">Opening</th>
                    <th className="py-3 px-4 text-right text-indigo-600 dark:text-indigo-400">New</th>
                    <th className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">Solved</th>
                    <th className="py-3 px-4 text-right text-rose-600 dark:text-rose-400">Closing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No tasks found matching &quot;{searchQuery}&quot;
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, idx) => (
                      <tr
                        key={`${row.name}-${idx}`}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-2.5 px-4 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 text-slate-900 dark:text-slate-100 font-semibold max-w-md break-words">
                          {row.name}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-600 dark:text-slate-400 font-mono">
                          {row.opening > 0 ? row.opening : ''}
                        </td>
                        <td className="py-2.5 px-4 text-right text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                          {row.newCount > 0 ? row.newCount : ''}
                        </td>
                        <td className="py-2.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                          {row.solvedCount > 0 ? row.solvedCount : ''}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-black text-rose-600 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-950/20">
                          {row.closing}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-800/90 border-t-2 border-slate-300 dark:border-slate-700 font-black text-xs text-slate-900 dark:text-white">
                    <td className="py-3 px-4 text-center">∑</td>
                    <td className="py-3 px-4 uppercase tracking-wider">Total</td>
                    <td className="py-3 px-4 text-right font-mono">{summary.totalOpening}</td>
                    <td className="py-3 px-4 text-right font-mono text-indigo-600 dark:text-indigo-400">
                      {summary.newToday}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {summary.solvedToday}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                      {summary.totalPending}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 4: Today's Text Message & 1-Click Copy */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Copy className="w-5 h-5 text-indigo-500" />
                  <span>Today&apos;s Message</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Formatted summary ready to send on communication channels
                </p>
              </div>

              <Button
                onClick={handleCopyMessage}
                className="gap-2 font-bold shadow-sm"
                variant={hasCopied ? 'secondary' : 'default'}
                size="sm"
              >
                {hasCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Report copied successfully</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Report</span>
                  </>
                )}
              </Button>
            </div>

            {/* Formatted Text Box */}
            <div className="relative">
              <pre className="p-5 rounded-2xl bg-slate-900 text-slate-100 dark:bg-slate-950 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap select-all border border-slate-800">
                {generateDailyReportMessage(summary, verifiedCount, newTasksList, solvedTasksList)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
