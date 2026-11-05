import { Frontmatter } from '../types';

export const DEFAULT_FRONTMATTER: Frontmatter = {
  title: "Assignment 1",
  date: "2026-07-12 14:32:00",
  project: "Design Document",
  project_dir: "/home/you/projects/your-project",
  report_number: 1,
  subject: "Design document of Assignment",
  operator: "A Great Student",
  follows: "report-000",
  tldr: "This is a live example. Edit the Markdown on the left and the report regenerates on the right. The frontmatter block carries the metadata (title, date, project, and so on); the body uses a small, fixed set of headings.",
  tests_total: 3
};

/**
 * Parses frontmatter YAML block and body from raw markdown string
 */
export function parseDocument(raw: string): { frontmatter: Frontmatter; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

  if (!match) {
    return {
      frontmatter: { ...DEFAULT_FRONTMATTER },
      body: raw.trim()
    };
  }

  const yamlContent = match[1];
  const body = match[2];

  const frontmatter: Partial<Frontmatter> = {};
  const lines = yamlContent.split(/\r?\n/);
  let currentKey = '';
  let currentValue = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const keyMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);

    if (keyMatch) {
      if (currentKey) {
        frontmatter[currentKey] = cleanYamlValue(currentValue);
      }
      currentKey = keyMatch[1];
      currentValue = keyMatch[2];
    } else if (currentKey && (line.startsWith('  ') || line.startsWith('\t'))) {
      currentValue += ' ' + line.trim();
    }
  }

  if (currentKey) {
    frontmatter[currentKey] = cleanYamlValue(currentValue);
  }

  return {
    frontmatter: {
      ...DEFAULT_FRONTMATTER,
      ...frontmatter
    },
    body
  };
}

function cleanYamlValue(val: string): any {
  val = val.trim();
  // Check if quoted with " or '
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.substring(1, val.length - 1).replace(/\\"/g, '"');
  }
  // Check for integer
  if (/^-?\d+$/.test(val)) {
    return parseInt(val, 10);
  }
  if (/^-?\d+\.\d+$/.test(val)) {
    return parseFloat(val);
  }
  if (val.toLowerCase() === 'true') return true;
  if (val.toLowerCase() === 'false') return false;
  return val;
}

/**
 * Serializes frontmatter into the exact required format of report-core.js
 */
export function stringifyFrontmatter(fm: Frontmatter): string {
  const standardKeys = [
    'title',
    'date',
    'project',
    'project_dir',
    'report_number',
    'subject',
    'operator',
    'follows',
    'tldr',
    'tests_total',
    'qa_verdict'
  ];

  const lines: string[] = ['---'];

  // Render standard keys first in designated order
  for (const key of standardKeys) {
    if (key in fm && (fm as any)[key] !== undefined && (fm as any)[key] !== '') {
      lines.push(formatYamlLine(key, (fm as any)[key]));
    }
  }

  // Render any additional custom keys
  for (const key of Object.keys(fm)) {
    if (!standardKeys.includes(key)) {
      lines.push(formatYamlLine(key, (fm as any)[key]));
    }
  }

  lines.push('---');
  return lines.join('\n');
}

/**
 * Formats a YAML key-value pair strictly adhering to the report generator schema:
 * - date, project, project_dir, report_number, follows, tests_total, qa_verdict: NEVER quoted
 * - title, subject, operator, tldr: ALWAYS double-quoted
 */
function formatYamlLine(key: string, val: any): string {
  if (typeof val === 'number') {
    return `${key}: ${val}`;
  }
  const str = String(val ?? '').trim();

  // Strict list of keys that must NEVER be quoted for compatibility with report-core.js / CLI tools
  if (['date', 'project', 'project_dir', 'report_number', 'follows', 'tests_total', 'qa_verdict'].includes(key)) {
    const unquoted = str.replace(/^["'](.*)["']$/, '$1').trim();
    return `${key}: ${unquoted}`;
  }

  // Keys that must ALWAYS be double-quoted in this dialect
  if (['title', 'subject', 'operator', 'tldr'].includes(key)) {
    const unquoted = str.replace(/^["'](.*)["']$/, '$1');
    const escaped = unquoted.replace(/"/g, '\\"');
    return `${key}: "${escaped}"`;
  }

  // Fallback for any other custom metadata keys
  if (str.includes('"') || str.includes('\n')) {
    const escaped = str.replace(/^["'](.*)["']$/, '$1').replace(/"/g, '\\"');
    return `${key}: "${escaped}"`;
  }
  return `${key}: ${str}`;
}

/**
 * Replaces or injects frontmatter in a markdown document while preserving the body
 */
export function replaceFrontmatterInDoc(rawDoc: string, newFm: Frontmatter): string {
  const { body } = parseDocument(rawDoc);
  const fmString = stringifyFrontmatter(newFm);
  return `${fmString}\n\n${body.replace(/^\n+/, '')}`;
}
