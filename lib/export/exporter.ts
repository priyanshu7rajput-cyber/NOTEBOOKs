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

export function exportTasksToJSON(tasks: Task[], filename = 'tasks-backup.json') {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportTasksToPDF(tasks: Task[], title = 'Task Report', filename = 'tasks-report.pdf') {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(title, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on ${new Date().toLocaleDateString()} • Total Tasks: ${tasks.length}`, 14, 28);
  doc.line(14, 32, 196, 32);

  let y = 42;
  tasks.forEach((t, i) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(t.completed ? 148 : 30, t.completed ? 163 : 41, t.completed ? 184 : 59);
    const statusIcon = t.completed ? '[x]' : '[ ]';
    doc.text(`${statusIcon} ${t.title}`, 14, y);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const meta = `Priority: ${t.priority.toUpperCase()} | Due: ${t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A'} | Book: ${t.book_title || 'N/A'}`;
    doc.text(meta, 18, y + 5);

    y += 12;
  });

  doc.save(filename);
}
