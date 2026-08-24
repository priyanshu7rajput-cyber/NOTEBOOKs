export type Priority = 'high' | 'medium' | 'low';

export type CoverTheme = 
  | 'classic'
  | 'leather'
  | 'gradient'
  | 'grid'
  | 'minimal'
  | 'forest'
  | 'purple'
  | 'math'
  | 'code'
  | 'blueprint'
  | 'study'
  | 'custom';

export interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  theme_preference: 'light' | 'dark' | 'system';
  notebook_preferences: {
    line_height: number;
    default_font: string;
    default_pen_size: number;
    default_pen_color: string;
    default_theme: CoverTheme;
  };
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  description: string;
  purpose: string;
  category: string;
  cover_theme: CoverTheme;
  cover_theme_value: string;
  cover_image_url: string | null;
  is_favorite: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  last_opened_page_id: string | null;
  created_at: string;
  updated_at: string;
  // Computed client-side or joined
  page_count?: number;
  total_tasks?: number;
  completed_tasks?: number;
  pending_tasks?: number;
  progress_percentage?: number;
}

export interface Page {
  id: string;
  book_id: string;
  user_id: string;
  title: string;
  page_number: number;
  content: any; // JSONB document for Tiptap
  handwriting_data: HandwritingData;
  handwriting_version: number;
  is_favorite: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  last_cursor_position: any | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  book_id: string | null;
  page_id: string | null;
  user_id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority;
  due_date: string | null;
  position: number;
  is_deleted: boolean;
  deleted_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Optional relations
  book_title?: string;
  page_title?: string;
  page_number?: number;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  user_id: string;
  book_id: string | null;
  page_id: string | null;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
  signed_url?: string;
}

export interface UserState {
  user_id: string;
  last_opened_book_id: string | null;
  last_opened_page_id: string | null;
  last_task_id: string | null;
  last_cursor_position: any | null;
  updated_at: string;
  // Joined for Continue where you left off
  book?: Book;
  page?: Page;
  task?: Task;
}

// Handwriting vector stroke model
export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface HandwritingStroke {
  id: string;
  points: StrokePoint[];
  color: string;
  width: number;
  isEraser?: boolean;
}

export interface HandwritingData {
  version: number;
  strokes: HandwritingStroke[];
}
