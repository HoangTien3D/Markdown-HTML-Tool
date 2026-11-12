export interface Frontmatter {
  title: string;
  subtitle?: string;
  name?: string;
  student_number?: number | string;
  date: string;
  report_number: number | string;
  abstract?: string;

  // Legacy or alternative fields for backwards compatibility:
  project?: string;
  project_dir?: string;
  subject?: string;
  operator?: string;
  follows?: string;
  tldr?: string;
  tests_total?: number | string;
  qa_verdict?: string;
  [key: string]: any;
}

export interface ProjectAsset {
  id: string;
  name: string; // e.g. "moodboard-palette.png"
  path: string; // "images/moodboard-palette.png"
  dataUrl: string;
  size: number;
  type: string;
  addedAt: number;
  width?: number;
  height?: number;
  originalDataUrl?: string;
  originalWidth?: number;
  originalHeight?: number;
  originalSize?: number;
}

export type ViewMode = 'split' | 'preview' | 'html';
export type ActiveTab = 'writer' | 'css' | 'instructions';
