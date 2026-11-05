import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { 
  Edit3, 
  Lock, 
  Unlock, 
  Maximize2, 
  RotateCcw,
  ExternalLink,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { Frontmatter, ProjectAsset } from '../types';
import { generateStandaloneHtml } from '../utils/htmlGenerator';
import { convertHtmlToMarkdown } from '../utils/htmlToMarkdown';

interface DocumentPreviewProps {
  frontmatter: Frontmatter;
  onFrontmatterChange: (updated: Frontmatter) => void;
  markdownBody: string;
  onMarkdownBodyChange: (newBody: string) => void;
  assets: ProjectAsset[];
  customCss?: string;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  frontmatter,
  onFrontmatterChange,
  markdownBody,
  onMarkdownBodyChange,
  assets,
  customCss = '',
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isTypingInsideIframe = useRef(false);
  const [directEditEnabled, setDirectEditEnabled] = useState(true);

  // Asset lookup map: replaces images/xxx with dataUrl for preview inside iframe
  const assetMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const asset of assets) {
      map.set(asset.path, asset.dataUrl);
      map.set(asset.name, asset.dataUrl);
      map.set(`images/${asset.name}`, asset.dataUrl);
    }
    return map;
  }, [assets]);

  // Pre-process markdown body so local images/... resolve to dataUrls in preview
  const resolvedMarkdownBody = useMemo(() => {
    let text = markdownBody;
    for (const [key, dataUrl] of assetMap.entries()) {
      text = text.split(`(${key})`).join(`(${dataUrl})`);
    }
    return text;
  }, [markdownBody, assetMap]);

  // Generate full HTML string with embedded CSS
  const fullHtml = useMemo(() => {
    return generateStandaloneHtml(frontmatter, resolvedMarkdownBody, customCss);
  }, [frontmatter, resolvedMarkdownBody, customCss]);

  // Sync HTML into iframe without leaking styles to outer app
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // If user is actively typing in the iframe, don't re-render entire srcdoc to avoid cursor jump
    if (isTypingInsideIframe.current) return;

    iframe.srcdoc = fullHtml;
  }, [fullHtml]);

  // Setup event listeners and contentEditable inside the iframe once loaded
  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const doc = iframe.contentDocument;

    // 1. Make the article body contentEditable for direct preview editing
    const article = doc.querySelector('article');
    if (article) {
      article.contentEditable = directEditEnabled ? 'true' : 'false';
      article.style.outline = 'none';

      const handleInput = () => {
        isTypingInsideIframe.current = true;
        try {
          // Re-map data URLs back to relative paths for markdown
          let html = article.innerHTML;
          for (const asset of assets) {
            html = html.split(asset.dataUrl).join(asset.path);
          }
          const md = convertHtmlToMarkdown(html);
          onMarkdownBodyChange(md);
        } catch (e) {
          console.warn('Error converting HTML to Markdown:', e);
        }
      };

      const handleBlur = () => {
        isTypingInsideIframe.current = false;
        try {
          let html = article.innerHTML;
          for (const asset of assets) {
            html = html.split(asset.dataUrl).join(asset.path);
          }
          const md = convertHtmlToMarkdown(html);
          onMarkdownBodyChange(md);
        } catch (e) {
          console.warn('Error converting HTML to Markdown on blur:', e);
        }
      };

      article.addEventListener('input', handleInput);
      article.addEventListener('blur', handleBlur);
    }

    // 2. Make Title directly editable inside the iframe header
    const titleEl = doc.querySelector('.header-title') as HTMLElement;
    if (titleEl) {
      titleEl.contentEditable = directEditEnabled ? 'true' : 'false';
      titleEl.style.outline = 'none';
      titleEl.addEventListener('input', () => {
        isTypingInsideIframe.current = true;
        onFrontmatterChange({ ...frontmatter, title: titleEl.innerText.trim() });
      });
      titleEl.addEventListener('blur', () => {
        isTypingInsideIframe.current = false;
      });
    }

    // 3. Make Project Name directly editable inside the iframe header
    const projectEl = doc.querySelector('.header-project') as HTMLElement;
    if (projectEl) {
      projectEl.contentEditable = directEditEnabled ? 'true' : 'false';
      projectEl.style.outline = 'none';
      projectEl.addEventListener('input', () => {
        isTypingInsideIframe.current = true;
        onFrontmatterChange({ ...frontmatter, project: projectEl.innerText.trim() });
      });
      projectEl.addEventListener('blur', () => {
        isTypingInsideIframe.current = false;
      });
    }

    // 4. Make Working Directory directly editable inside the iframe header
    const cwdCodeEl = doc.querySelector('.header-cwd code') as HTMLElement;
    if (cwdCodeEl) {
      cwdCodeEl.contentEditable = directEditEnabled ? 'true' : 'false';
      cwdCodeEl.style.outline = 'none';
      cwdCodeEl.addEventListener('input', () => {
        isTypingInsideIframe.current = true;
        onFrontmatterChange({ ...frontmatter, project_dir: cwdCodeEl.innerText.trim() });
      });
      cwdCodeEl.addEventListener('blur', () => {
        isTypingInsideIframe.current = false;
      });
    }

    // 5. Make TL;DR directly editable inside the iframe
    const tldrP = doc.querySelector('.slide p') as HTMLElement;
    if (tldrP) {
      tldrP.contentEditable = directEditEnabled ? 'true' : 'false';
      tldrP.style.outline = 'none';
      tldrP.addEventListener('input', () => {
        isTypingInsideIframe.current = true;
        onFrontmatterChange({ ...frontmatter, tldr: tldrP.innerText.trim() });
      });
      tldrP.addEventListener('blur', () => {
        isTypingInsideIframe.current = false;
      });
    }

    // 6. Make QA Verdict status clickable inside the iframe
    const statusEl = doc.querySelector('.header .status') as HTMLElement;
    if (statusEl) {
      statusEl.style.cursor = 'pointer';
      statusEl.title = 'Click to cycle QA Verdict (PASS / FAIL / PENDING)';
      statusEl.addEventListener('click', () => {
        const cur = String(frontmatter.qa_verdict || '').toUpperCase();
        const next = cur === 'PASS' ? 'FAIL' : cur === 'FAIL' ? 'PENDING' : cur === 'PENDING' ? '' : 'PASS';
        onFrontmatterChange({ ...frontmatter, qa_verdict: next });
      });
    }

    // Measure header height inside the iframe
    const header = doc.querySelector('.header') as HTMLElement;
    if (header) {
      doc.documentElement.style.setProperty('--header-h', `${header.offsetHeight + 10}px`);
    }
  }, [directEditEnabled, frontmatter, onFrontmatterChange, onMarkdownBodyChange, assets]);

  // Open standalone HTML in new window/tab
  const handleOpenNewWindow = () => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(fullHtml);
      win.document.close();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-black overflow-hidden relative">
      {/* Top Preview Control Bar (High Contrast Black & White) */}
      <div className="h-9 bg-black border-b border-neutral-800 px-3.5 flex items-center justify-between text-xs text-white shrink-0">
        <div className="flex items-center gap-2">
          <Edit3 className="w-3.5 h-3.5 text-white" />
          <span className="font-bold text-white font-mono text-[11px] uppercase tracking-wide">
            {directEditEnabled ? 'Preview Editing: Active' : 'Preview: Locked'}
          </span>
          <span className="text-[11px] text-neutral-400 hidden sm:inline font-mono">
            (Isolated in iframe)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDirectEditEnabled(!directEditEnabled)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
              directEditEnabled 
                ? 'bg-white text-black font-bold border border-white' 
                : 'bg-black text-neutral-400 border border-neutral-700 hover:text-white hover:border-white'
            }`}
            title="Toggle direct in-place editing on the preview"
          >
            {directEditEnabled ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            <span>{directEditEnabled ? 'Editable' : 'Locked'}</span>
          </button>

          <button
            onClick={handleOpenNewWindow}
            className="flex items-center gap-1 px-2 py-0.5 bg-black hover:bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-700 hover:border-white rounded text-[11px] font-mono transition-colors cursor-pointer"
            title="Open report in separate browser window"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">Pop Out</span>
          </button>
        </div>
      </div>

      {/* Sandboxed Iframe Container: ZERO Style Leakage */}
      <div className="flex-1 w-full h-full relative bg-white">
        <iframe
          ref={iframeRef}
          id="preview"
          title="Document Preview"
          onLoad={handleIframeLoad}
          className="w-full h-full border-none bg-white block"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
};
