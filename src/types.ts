export interface Frontmatter {
  title: string;
  date: string;
  project: string;
  project_dir: string;
  report_number: number | string;
  subject: string;
  operator: string;
  follows: string;
  tldr: string;
  tests_total: number | string;
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
}

export type ViewMode = 'split' | 'preview' | 'html';
export type ActiveTab = 'writer' | 'css' | 'instructions';
