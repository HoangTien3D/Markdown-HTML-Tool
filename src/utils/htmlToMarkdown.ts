import TurndownService from 'turndown';
// @ts-ignore
import { gfm } from 'turndown-plugin-gfm';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*'
});

try {
  turndownService.use(gfm);
} catch (e) {
  console.warn('GFM plugin init warning:', e);
}

// CRITICAL FIX: Turndown by default escapes markdown syntax characters like . after numbers (1\. Abstract),
// * into \*, _ into \_, brackets, etc. Overriding escape prevents backslashes from multiplying.
turndownService.escape = function (str: string) {
  return str;
};

// Custom rule for figures/images with captions
turndownService.addRule('docFigure', {
  filter: 'figure',
  replacement: function (content, node) {
    const img = (node as HTMLElement).querySelector('img');
    const caption = (node as HTMLElement).querySelector('figcaption');
    if (!img) return content;
    const src = img.getAttribute('src') || '';
    const alt = caption?.textContent?.trim() || img.getAttribute('alt') || '';
    return `\n\n![${alt}](${src})\n\n`;
  }
});

// Remove anchor links from headings
turndownService.addRule('headingAnchor', {
  filter: function (node) {
    return (node as HTMLElement).classList?.contains('heading-anchor') || false;
  },
  replacement: function () {
    return '';
  }
});

// Preserve semantic status badges as [TOKEN]
turndownService.addRule('statusToken', {
  filter: function (node) {
    return (node as HTMLElement).classList?.contains('status') || false;
  },
  replacement: function (content) {
    const text = content.trim().replace(/^\[|\]$/g, '');
    return text ? `[${text}]` : '';
  }
});

/**
 * Strips runaway backslash escapes caused by browser contentEditable or legacy editors
 */
export function cleanRunawayBackslashes(md: string): string {
  if (!md) return '';
  return md
    // Clean numbers followed by backslash-escaped dots (e.g. 1\. or 1\\. -> 1.)
    .replace(/(\d+)\\+\.\s/g, '$1. ')
    // Clean escaped asterisks, underscores, code backticks, brackets, hashes (e.g. \*\* -> **)
    .replace(/\\+(\*|_|`|#|\[|\])/g, '$1');
}

export function convertHtmlToMarkdown(html: string): string {
  const md = turndownService.turndown(html);
  return cleanRunawayBackslashes(md);
}
