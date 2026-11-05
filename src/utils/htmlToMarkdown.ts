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

export function convertHtmlToMarkdown(html: string): string {
  // Strip out temporary UI helper elements if any
  return turndownService.turndown(html);
}
