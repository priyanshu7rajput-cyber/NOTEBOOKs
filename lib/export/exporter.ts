import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Task, Book } from '@/types/database';

export function exportTasksToCSV(tasks: Task[], filename = 'tasks-export.csv') {
  const headers = ['Task Title', 'Status', 'Priority', 'Due Date', 'Notebook', 'Page', 'Created Date'];
  const rows = tasks.map((t) => [
    `"${t.title.replace(/"/g, '""')}"`,
    t.completed ? 'Completed' : 'Pending',
    t.priority,
    t.due_date || '',
    `"${(t.book_title || '').replace(/"/g, '""')}"`,
    t.page_number || '',
    t.created_at,
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportTasksToExcel(tasks: Task[], filename = 'tasks-export.xlsx') {
  const data = tasks.map((t) => ({
    'Task Title': t.title,
    'Description': t.description || '',
    'Status': t.completed ? 'Completed' : 'Pending',
    'Priority': t.priority.toUpperCase(),
    'Due Date': t.due_date ? new Date(t.due_date).toLocaleDateString() : 'None',
    'Notebook': t.book_title || 'N/A',
    'Page': t.page_number || 1,
    'Created At': new Date(t.created_at).toLocaleDateString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
  XLSX.writeFile(workbook, filename);
}

export function downloadJSON(data: any, filename: string) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function exportTasksToJSON(tasks: any[], filename = 'tasks-backup.json') {
  downloadJSON(tasks, filename);
}

export function exportNotebookToJSON(book: any, pages: any[], tasks: any[] = [], filename?: string) {
  const exportPayload = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    appName: 'MyNotebook',
    type: 'notebook_backup',
    book,
    pages,
    tasks,
  };
  const name = filename || `${(book?.title || 'notebook').toLowerCase().replace(/\s+/g, '-')}-backup.json`;
  downloadJSON(exportPayload, name);
}

export function exportTasksToPDF(tasks: Task[], title = 'Pending Tasks Report', filename = 'pending-tasks-report.pdf') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner Background (Deep Indigo Gradient/Solid Luxury Header)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, 14, contentWidth, 34, 4, 4, 'F');

  // Top Accent Bar (Gradient Indigo / Violet simulation)
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.rect(margin + 4, 18, 4, 26, 'F');

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(title, margin + 12, 27);

  // Subtitle / Metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc.text(`Generated on ${dateStr} • Digital Notebook Task Management`, margin + 12, 36);
  doc.text(`Total Tasks: ${tasks.length}`, margin + 12, 42);

  // Status Badge in Top Right of Header
  const pendingCount = tasks.filter((t) => !t.completed).length;
  doc.setFillColor(239, 68, 68, 0.2); // rose tint
  doc.roundedRect(pageWidth - margin - 38, 22, 32, 18, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(248, 113, 113); // rose-400
  doc.text(`${pendingCount}`, pageWidth - margin - 22, 31, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text('PENDING', pageWidth - margin - 22, 36, { align: 'center' });

  // Starting position for task cards
  let y = 56;
  let pageNum = 1;

  // Add Page Number Footer helper
  const drawFooter = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text('Confidential • Digital Notebook Workspace', margin, pageHeight - 7);
    doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  };

  drawFooter();

  tasks.forEach((t, i) => {
    // Check if we need a new page (Card height ~14mm)
    if (y + 18 > pageHeight - 18) {
      doc.addPage();
      pageNum += 1;
      drawFooter();
      y = 18;
    }

    const isDone = Boolean(t.completed);

    // Card Box (Minimalist Clean Design)
    doc.setFillColor(isDone ? 248 : 255, isDone ? 250 : 255, isDone ? 252 : 255);
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

    // Custom Checkbox Square
    doc.setDrawColor(isDone ? 34 : 148, isDone ? 197 : 163, isDone ? 94 : 184);
    doc.setFillColor(isDone ? 220 : 255, isDone ? 252 : 255, isDone ? 231 : 255);
    doc.roundedRect(margin + 5, y + 4, 6, 6, 1.2, 1.2, isDone ? 'FD' : 'D');
    if (isDone) {
      doc.setTextColor(22, 101, 52);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('✓', margin + 6.3, y + 8.5);
    }

    // Task Title
    doc.setFont('helvetica', isDone ? 'normal' : 'bold');
    doc.setFontSize(11);
    doc.setTextColor(isDone ? 148 : 15, isDone ? 163 : 23, isDone ? 184 : 42); // slate-400 vs slate-900

    const cleanTitle = t.title.length > 75 ? t.title.substring(0, 72) + '...' : t.title;
    doc.text(cleanTitle, margin + 16, y + 8.5);

    y += 17;
  });

  doc.save(filename);
}
