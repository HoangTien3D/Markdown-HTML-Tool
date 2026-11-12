import { Frontmatter } from '../types';

export const DEFAULT_FRONTMATTER: Frontmatter = {
  title: "Example Design Document: The Markdown Dialect",
  subtitle: "A worked example showing every block the design-document tool understands.",
  name: "A Great Student",
  student_number: "s1234567",
  date: "2026-11-11 09:00:00",
  report_number: 1,
  abstract: "This is a live example. Edit the Markdown on the left and the document regenerates on the right. The frontmatter block carries the metadata (title, subtitle, your name and student number, the date, and this abstract); the body uses a small, fixed set of top-level headings. Everything you see here, the sticky header, the contents sidebar, the typed blocks, comes from one engine, so what you preview is exactly what gets saved."
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

  // Preserve ONLY the actual keys present in the file, with minimal safe fallbacks
  const resolvedFm: Frontmatter = {
    title: frontmatter.title !== undefined ? String(frontmatter.title) : DEFAULT_FRONTMATTER.title,
    date: frontmatter.date !== undefined ? String(frontmatter.date) : DEFAULT_FRONTMATTER.date,
    report_number: frontmatter.report_number !== undefined ? frontmatter.report_number : 1,
    ...frontmatter
  };

  return {
    frontmatter: resolvedFm,
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
 * Serializes frontmatter into the exact required format of upstream report / design-doc CLI
 */
export function stringifyFrontmatter(fm: Frontmatter): string {
  // Upstream Design Document keys first, followed by legacy/fallback keys only if explicitly present
  const standardKeys = [
    'title',
    'subtitle',
    'name',
    'student_number',
    'date',
    'report_number',
    'abstract',
    'project',
    'project_dir',
    'subject',
    'operator',
    'follows',
    'tldr',
    'tests_total',
    'qa_verdict'
  ];

  const lines: string[] = ['---'];

  // Render standard keys first in designated order if present
  for (const key of standardKeys) {
    if (key in fm && (fm as any)[key] !== undefined && (fm as any)[key] !== null && String((fm as any)[key]).trim() !== '') {
      lines.push(formatYamlLine(key, (fm as any)[key]));
    }
  }

  // Render any additional custom keys
  for (const key of Object.keys(fm)) {
    if (!standardKeys.includes(key)) {
      if ((fm as any)[key] !== undefined && (fm as any)[key] !== null && String((fm as any)[key]).trim() !== '') {
        lines.push(formatYamlLine(key, (fm as any)[key]));
      }
    }
  }

  lines.push('---');
  return lines.join('\n');
}

/**
 * Formats a YAML key-value pair strictly adhering to upstream schema:
 * - date, student_number, report_number, project, project_dir, follows, tests_total, qa_verdict: NEVER quoted
 * - title, subtitle, name, abstract, subject, operator, tldr: ALWAYS double-quoted
 */
function formatYamlLine(key: string, val: any): string {
  if (typeof val === 'number') {
    return `${key}: ${val}`;
  }
  const str = String(val ?? '').trim();

  // Keys that must NEVER be quoted:
  if (['date', 'student_number', 'report_number', 'project', 'project_dir', 'follows', 'tests_total', 'qa_verdict'].includes(key)) {
    const unquoted = str.replace(/^["'](.*)["']$/, '$1').trim();
    return `${key}: ${unquoted}`;
  }

  // Keys that must ALWAYS be double-quoted in this dialect:
  if (['title', 'subtitle', 'name', 'abstract', 'subject', 'operator', 'tldr'].includes(key)) {
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
