import TurndownService from 'turndown';
// @ts-ignore
import { gfm } from 'turndown-plugin-gfm';
import { ProjectAsset } from '../types';

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

/**
 * Automatically detects and cleans massive raw base64 data URLs in markdown,
 * converting them into short, portable images/ filenames and extracting the assets.
 */
export function extractAndCleanBase64Images(
  md: string,
  existingAssets: ProjectAsset[] = []
): { cleanedMd: string; newAssets: ProjectAsset[] } {
  if (!md || !md.includes('data:image/')) {
    return { cleanedMd: md, newAssets: [] };
  }

  const newAssets: ProjectAsset[] = [];
  const existingNames = new Set(existingAssets.map(a => a.name));
  let count = 1;

  const cleanedMd = md.replace(
    /!\[(.*?)\]\((data:image\/([a-zA-Z0-9+]+);base64,([^\s\)]+))\)/g,
    (_fullMatch, alt, dataUrl, subtype) => {
      let ext = subtype === 'jpeg' ? '.jpg' : `.${subtype}`;
      let shortName = `img_${count}${ext}`;
      while (existingNames.has(shortName)) {
        count++;
        shortName = `img_${count}${ext}`;
      }
      existingNames.add(shortName);

      const path = `images/${shortName}`;
      newAssets.push({
        id: `${shortName}-${Date.now()}`,
        name: shortName,
        path,
        dataUrl,
        size: Math.round(dataUrl.length * 0.75),
        type: `image/${subtype}`,
        addedAt: Date.now()
      });
      count++;
      return `![${alt || shortName}](${path})`;
    }
  );

  return { cleanedMd, newAssets };
}

export function convertHtmlToMarkdown(html: string): string {
  const md = turndownService.turndown(html);
  return cleanRunawayBackslashes(md);
}
