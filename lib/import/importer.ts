import { z } from 'zod';
import * as XLSX from 'xlsx';
import { Priority } from '@/types/database';

export const TaskImportSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional().default(''),
  priority: z.enum(['high', 'medium', 'low']).catch('medium'),
  due_date: z.string().nullable().optional(),
});

export type ValidatedImportTask = z.infer<typeof TaskImportSchema>;

export async function parseTasksFile(file: File): Promise<ValidatedImportTask[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'json') {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid JSON format: Expected an array of tasks.');
    }
    return parsed.map((item) => TaskImportSchema.parse(item));
  }

  if (extension === 'csv' || extension === 'xlsx' || extension === 'xls') {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    return rows.map((row) => {
      const title = row['Task Title'] || row['Title'] || row['task'] || row['title'] || '';
      const description = row['Description'] || row['description'] || '';
      const priorityRaw = (row['Priority'] || row['priority'] || 'medium').toString().toLowerCase();
      const priority: Priority = ['high', 'medium', 'low'].includes(priorityRaw)
        ? (priorityRaw as Priority)
        : 'medium';

      return TaskImportSchema.parse({
        title: String(title).trim(),
        description: String(description).trim(),
        priority,
        due_date: null,
      });
    });
  }

  throw new Error('Unsupported file format. Please upload CSV, XLSX, or JSON.');
}
