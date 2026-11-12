import JSZip from 'jszip';
import { Frontmatter, ProjectAsset } from '../types';
import { generateStandaloneHtml, formatReportNumber } from './htmlGenerator';
import { parseDocument, replaceFrontmatterInDoc } from './frontmatter';

/**
 * Converts a data URL to ArrayBuffer or string for JSZip
 */
function dataUrlToZipContent(dataUrl: string): { data: any; isBinary: boolean } {
  if (dataUrl.startsWith('data:image/svg+xml;utf8,')) {
    const svgText = decodeURIComponent(dataUrl.replace('data:image/svg+xml;utf8,', ''));
    return { data: svgText, isBinary: false };
  }

  const base64Index = dataUrl.indexOf(';base64,');
  if (base64Index !== -1) {
    const base64Data = dataUrl.substring(base64Index + 8);
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return { data: bytes.buffer, isBinary: true };
  }

  return { data: dataUrl, isBinary: false };
}

/**
 * Packages project into a ZIP archive containing:
 * - report.md (full markdown + frontmatter)
 * - index.html (clean/blank HTML)
 * - style.css (optional CSS file)
 * - images/ folder containing all referenced image assets
 */
export async function exportProjectZip(
  frontmatter: Frontmatter,
  rawMarkdown: string,
  assets: ProjectAsset[],
  customCss: string = ''
): Promise<void> {
  const zip = new JSZip();

  // 1. Markdown with frontmatter
  const fullMarkdown = replaceFrontmatterInDoc(rawMarkdown, frontmatter);
  zip.file('report.md', fullMarkdown);

  // 2. Clean HTML with embedded style
  const { body } = parseDocument(rawMarkdown);
  const standaloneHtml = generateStandaloneHtml(frontmatter, body, customCss);
  zip.file('index.html', standaloneHtml);
  const paddedNum = formatReportNumber(frontmatter.report_number);
  if (paddedNum) {
    zip.file(`report-${paddedNum}.html`, standaloneHtml);
  }

  // 3. Optional style.css
  zip.file('style.css', customCss || '/* style.css */\n');

  // 4. images/ directory
  const imagesFolder = zip.folder('images');
  if (imagesFolder) {
    for (const asset of assets) {
      const filename = asset.name || asset.path.replace(/^images\//, '');
      const { data, isBinary } = dataUrlToZipContent(asset.dataUrl);
      imagesFolder.file(filename, data, { binary: isBinary });
    }
  }

  // 5. README.txt
  const readmeText = `Simple DesDoc — Project Export
==============================
Title: ${frontmatter.title || 'Untitled Document'}
Project: ${frontmatter.project || 'Design Project'}
Date: ${frontmatter.date || new Date().toISOString()}

CONTENTS:
---------
1. index.html - Clean HTML document structure (links to style.css).
2. style.css  - Optional stylesheet. Edit this file to customize look and feel.
3. report.md  - Standard Markdown source with YAML frontmatter.
4. images/    - All images and figures used in the document.

Generated with Simple DesDoc.
`;
  zip.file('README.txt', readmeText);

  // Generate blob
  const content = await zip.generateAsync({ type: 'blob' });
  
  const safeName = (frontmatter.title || 'design-document')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'desdoc';
  const filename = `${safeName}-export.zip`;

  const downloadUrl = URL.createObjectURL(content);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Downloads just the Markdown file
 */
export function downloadMarkdownFile(rawMarkdown: string, frontmatter: Frontmatter): void {
  const fullMarkdown = replaceFrontmatterInDoc(rawMarkdown, frontmatter);
  const blob = new Blob([fullMarkdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(frontmatter.title || 'report').toLowerCase().replace(/\s+/g, '-')}.md`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Downloads just the HTML file with embedded CSS
 */
export function downloadHtmlFile(frontmatter: Frontmatter, markdownBody: string, embeddedCss: string = ''): void {
  const html = generateStandaloneHtml(frontmatter, markdownBody, embeddedCss);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const paddedNum = formatReportNumber(frontmatter.report_number);
  const filename = paddedNum ? `report-${paddedNum}.html` : `${(frontmatter.title || 'report').toLowerCase().replace(/\s+/g, '-')}.html`;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
