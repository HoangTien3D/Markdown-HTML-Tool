import { marked } from 'marked';
import { Frontmatter } from '../types';

/**
 * Extracts sections from markdown for table of contents
 */
export function extractHeadings(markdown: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  const lines = markdown.split(/\r?\n/);
  
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = slugify(text);
      headings.push({ id, text, level });
    }
  }
  return headings;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Generates standalone HTML document with embedded CSS matching the report stylesheet classes
 */
export function generateStandaloneHtml(
  frontmatter: Frontmatter, 
  markdownBody: string,
  embeddedCss: string = ''
): string {
  const renderer: any = new marked.Renderer();
  
  renderer.heading = function({ text, depth }: any) {
    const id = slugify(String(text).replace(/<[^>]+>/g, ''));
    return `<h${depth} id="${id}">${text}</h${depth}>`;
  };

  renderer.table = function(token: any) {
    const headerHtml = token.header?.map((cell: any) => `<th>${cell.text}</th>`).join('') || '';
    const rowsHtml = token.rows?.map((row: any) => 
      `<tr>${row.map((cell: any) => `<td>${cell.text}</td>`).join('')}</tr>`
    ).join('') || '';

    return `<table>
  <thead><tr>${headerHtml}</tr></thead>
  <tbody>${rowsHtml}</tbody>
</table>`;
  };

  renderer.image = function({ href, title, text }: any) {
    return `<img src="${href}" alt="${text || ''}" title="${title || ''}" />`;
  };

  const parsedBody = marked.parse(markdownBody, { renderer, gfm: true }) as string;

  // Replace status tokens [DONE], [FIXED], [VERIFIED], [PENDING], [BROKEN]
  const enhancedBody = parsedBody.replace(
    /\[(DONE|FIXED|VERIFIED|PENDING|BROKEN)\]/g,
    (_match: string, token: string) => {
      const lower = token.toLowerCase();
      const statusClass = (lower === 'done' || lower === 'fixed' || lower === 'verified')
        ? 'verified'
        : (lower === 'broken')
          ? 'incorrect'
          : 'pending';
      return `<span class="status ${statusClass}">${token}</span>`;
    }
  );

  const headings = extractHeadings(markdownBody);

  const verdict = String(frontmatter.qa_verdict || '').toUpperCase();
  const verdictStatusClass = verdict === 'PASS' 
    ? 'status verified' 
    : verdict === 'FAIL' 
      ? 'status incorrect' 
      : verdict === 'PENDING' 
        ? 'status pending' 
        : 'status';

  const title = frontmatter.title || 'Untitled Document';
  const project = frontmatter.project || '';
  const subject = frontmatter.subject || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}${project ? ` — ${escapeHtml(project)}` : ''}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
${embeddedCss ? `  <style>\n${embeddedCss}\n  </style>\n` : ''}</head>
<body>

  <!-- Full-width sticky header matching .header -->
  <header class="header">
    ${project ? `<div class="header-project">${escapeHtml(project)}</div>` : ''}
    <h1 class="header-title">${escapeHtml(title)}</h1>
    <p class="meta">
      ${frontmatter.report_number ? `<span>Report #${escapeHtml(String(frontmatter.report_number))}</span>` : ''}
      ${subject ? ` &bull; <span>Subject: ${escapeHtml(subject)}</span>` : ''}
      ${verdict ? ` &bull; <span class="${verdictStatusClass}">Verdict: ${escapeHtml(verdict)}</span>` : ''}
      ${frontmatter.tests_total !== undefined ? ` &bull; <span>Tests: ${escapeHtml(String(frontmatter.tests_total))}</span>` : ''}
    </p>
    ${frontmatter.project_dir ? `<div class="header-cwd"><code>${escapeHtml(frontmatter.project_dir)}</code></div>` : ''}
  </header>

  <!-- Table of Contents: fixed in the left gutter matching .toc -->
  <nav class="toc" aria-label="Table of Contents">
    <div class="toc-title">Contents</div>
    ${headings.map(h => {
      const indentStyle = h.level === 2 
        ? 'padding-left: 26px; font-size: 11px;' 
        : h.level >= 3 
          ? 'padding-left: 36px; font-size: 10px; color: #888;' 
          : 'font-weight: 600;';
      return `<a href="#${h.id}" style="${indentStyle}">${escapeHtml(h.text)}</a>`;
    }).join('')}
    
    <hr class="toc-rule">
    <div class="toc-meta">
      ${frontmatter.operator ? `<div><strong>Operator:</strong> ${escapeHtml(frontmatter.operator)}</div>` : ''}
      ${frontmatter.follows ? `<div><strong>Follows:</strong> ${escapeHtml(frontmatter.follows)}</div>` : ''}
      ${frontmatter.date ? `<div><strong>Date:</strong> ${escapeHtml(frontmatter.date)}</div>` : ''}
    </div>
  </nav>

  <!-- Reading column matching .container -->
  <main class="container">
    ${frontmatter.tldr ? `
    <div class="slide">
      <h3>TL;DR</h3>
      <p>${escapeHtml(frontmatter.tldr)}</p>
    </div>
    ` : ''}

    <article>
      ${enhancedBody}
    </article>

    <footer class="footer">
      <div>Report generated via Simple DesDoc &bull; ${escapeHtml(frontmatter.date || new Date().toISOString())}</div>
    </footer>
  </main>

  <script>
    function updateHeaderHeight() {
      var h = document.querySelector('.header');
      if (h) {
        document.documentElement.style.setProperty('--header-h', (h.offsetHeight + 10) + 'px');
      }
    }
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('DOMContentLoaded', updateHeaderHeight);
    updateHeaderHeight();
  </script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
