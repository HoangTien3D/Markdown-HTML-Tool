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

export function formatReportNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '';
  const str = String(num).trim();
  if (!str) return '';
  const parsed = parseInt(str, 10);
  if (!isNaN(parsed)) {
    return String(parsed).padStart(3, '0');
  }
  return str;
}

export function formatReportDate(dateInput?: string | Date | number): string {
  if (!dateInput) {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
  }
  const str = String(dateInput).trim();
  if (str.includes('T')) {
    return str.replace('T', ' ').replace(/\.\d+Z?$/, '').replace(/Z$/, '');
  }
  return str;
}

/**
 * Generates standalone HTML document with embedded CSS matching the report stylesheet classes
 */
export function generateStandaloneHtml(
  frontmatter: Frontmatter, 
  markdownBody: string,
  embeddedCss: string = '',
  assetMap?: Map<string, string>
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
    let resolvedSrc = href || '';
    let assetPath = href || '';
    if (assetMap) {
      if (assetMap.has(href)) {
        resolvedSrc = assetMap.get(href) || href;
      } else if (assetMap.has(`images/${href}`)) {
        resolvedSrc = assetMap.get(`images/${href}`) || href;
        assetPath = `images/${href}`;
      } else if (href.startsWith('images/')) {
        const bareName = href.replace('images/', '');
        if (assetMap.has(bareName)) {
          resolvedSrc = assetMap.get(bareName) || href;
        }
      }
    }
    return `<img src="${resolvedSrc}" alt="${text || ''}" title="${title || ''}" data-asset-path="${assetPath}" />`;
  };

  const parsedBody = marked.parse(markdownBody, { renderer, gfm: true }) as string;

  // Replace status tokens [DONE], [FIXED], [VERIFIED], [PENDING], [BROKEN], [PASS], [FAIL]
  const enhancedBody = parsedBody.replace(
    /\[(DONE|FIXED|VERIFIED|PENDING|BROKEN|PASS|FAIL)\]/gi,
    (_match: string, token: string) => {
      const upper = token.toUpperCase();
      const statusClass = (upper === 'DONE' || upper === 'FIXED' || upper === 'VERIFIED' || upper === 'PASS')
        ? 'verified'
        : (upper === 'BROKEN' || upper === 'FAIL')
          ? 'incorrect'
          : 'pending';
      return `<span class="status ${statusClass}">${upper}</span>`;
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

  const rawTitle = frontmatter.title || 'Untitled Document';
  const cleanedTitle = rawTitle.replace(/^report\s+\d+:\s*/i, '').trim();
  const paddedNum = formatReportNumber(frontmatter.report_number);
  const displayTitle = paddedNum ? `Report ${paddedNum}: ${cleanedTitle || 'Untitled Document'}` : rawTitle;

  const subtitle = frontmatter.subtitle || frontmatter.project || '';
  const authorName = frontmatter.name || frontmatter.operator || '';
  const studentNum = frontmatter.student_number ? String(frontmatter.student_number) : '';
  const subject = frontmatter.subject || '';
  const dateFormatted = formatReportDate(frontmatter.date);

  const abstractContent = frontmatter.abstract || frontmatter.tldr || '';
  const abstractLabel = frontmatter.abstract ? 'Abstract' : (frontmatter.tldr ? 'TL;DR' : '');

  const hasMath = markdownBody.includes('$');

  const footerText = paddedNum
    ? `${displayTitle} | ${frontmatter.report_number} | Generated ${dateFormatted} | report-${paddedNum}.html`
    : `${displayTitle} | Generated ${dateFormatted}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(displayTitle)}${subtitle ? ` — ${escapeHtml(subtitle)}` : ''}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
${hasMath ? `  <script>
    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
        displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']]
      }
    };
  </script>
  <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>\n` : ''}${embeddedCss ? `  <style>\n${embeddedCss}\n  </style>\n` : ''}</head>
<body>

  <!-- Full-width sticky header matching .header -->
  <header class="header">
    ${subtitle ? `<div class="header-project">${escapeHtml(subtitle)}</div>` : ''}
    <h1 class="header-title">${escapeHtml(displayTitle)}</h1>
    <p class="meta">
      ${frontmatter.report_number !== undefined && frontmatter.report_number !== '' ? `<span>Report #${escapeHtml(String(frontmatter.report_number))}</span>` : ''}
      ${authorName ? ` &bull; <span>${escapeHtml(authorName)}${studentNum ? ` (${escapeHtml(studentNum)})` : ''}</span>` : (studentNum ? ` &bull; <span>${escapeHtml(studentNum)}</span>` : '')}
      ${subject ? ` &bull; <span>Subject: ${escapeHtml(subject)}</span>` : ''}
      ${verdict ? ` &bull; <span class="${verdictStatusClass}">Verdict: ${escapeHtml(verdict)}</span>` : ''}
      ${frontmatter.tests_total !== undefined ? ` &bull; <span>Tests: ${escapeHtml(String(frontmatter.tests_total))}</span>` : ''}
    </p>
    ${frontmatter.project_dir ? `<div class="header-cwd"><code>${escapeHtml(frontmatter.project_dir)}</code></div>` : ''}
  </header>

  <!-- Table of Contents: fixed in the left gutter matching .toc -->
  <nav class="toc" aria-label="Table of Contents">
    <div class="toc-title">Contents</div>
    ${abstractContent ? `<a href="#abstract" style="font-weight: 600;">${escapeHtml(abstractLabel)}</a>` : ''}
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
      ${authorName ? `<div><strong>Author:</strong> ${escapeHtml(authorName)}</div>` : ''}
      ${studentNum ? `<div><strong>Student ID:</strong> ${escapeHtml(studentNum)}</div>` : ''}
      ${frontmatter.follows ? `<div><strong>Follows:</strong> ${escapeHtml(frontmatter.follows)}</div>` : ''}
      ${frontmatter.date ? `<div><strong>Date:</strong> ${escapeHtml(frontmatter.date)}</div>` : ''}
    </div>
  </nav>

  <!-- Reading column matching .container -->
  <main class="container">
    ${abstractContent ? `
    <div id="abstract" class="slide">
      <h3>${escapeHtml(abstractLabel)}</h3>
      <p>${escapeHtml(abstractContent)}</p>
    </div>
    ` : ''}

    <article>
      ${enhancedBody}
    </article>

    <footer class="footer">
      <div>${escapeHtml(footerText)}</div>
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
