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
  onSaveShortcut?: () => void;
  onDropFiles?: (files: File[]) => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  frontmatter,
  onFrontmatterChange,
  markdownBody,
  onMarkdownBodyChange,
  assets,
  customCss = '',
  onSaveShortcut,
  onDropFiles,
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

      let hasInputEdited = false;
      let lastHtml = article.innerHTML;

      const handleInput = () => {
        isTypingInsideIframe.current = true;
        hasInputEdited = true;
      };

      const handleBlur = () => {
        isTypingInsideIframe.current = false;
        // CRITICAL: Do NOT convert HTML to Markdown if user just clicked, selected, or dragged!
        if (!hasInputEdited) return;
        hasInputEdited = false;

        const currentHtml = article.innerHTML;
        if (currentHtml === lastHtml) return;
        lastHtml = currentHtml;

        try {
          let html = currentHtml;
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
      let titleEdited = false;
      titleEl.addEventListener('input', () => {
        isTypingInsideIframe.current = true;
        titleEdited = true;
      });
      titleEl.addEventListener('blur', () => {
        isTypingInsideIframe.current = false;
        if (!titleEdited) return;
        titleEdited = false;
        const val = titleEl.innerText.trim();
        if (val !== (frontmatter.title || '')) {
          onFrontmatterChange({ ...frontmatter, title: val });
        }
      });
    }

    // 3. Make Project Name directly editable inside the iframe header
    const projectEl = doc.querySelector('.header-project') as HTMLElement;
    if (projectEl) {
      projectEl.contentEditable = directEditEnabled ? 'true' : 'false';
      projectEl.style.outline = 'none';
      let projectEdited = false;
      projectEl.addEventListener('input', () => {
        isTypingInsideIframe.current = true;
        projectEdited = true;
      });
      projectEl.addEventListener('blur', () => {
        isTypingInsideIframe.current = false;
        if (!projectEdited) return;
        projectEdited = false;
        const val = projectEl.innerText.trim();
        if (val !== (frontmatter.project || '')) {
          onFrontmatterChange({ ...frontmatter, project: val });
        }
      });
    }

    // 4. Make Working Directory directly editable inside the iframe header
    const cwdCodeEl = doc.querySelector('.header-cwd code') as HTMLElement;
    if (cwdCodeEl) {
      cwdCodeEl.contentEditable = directEditEnabled ? 'true' : 'false';
      cwdCodeEl.style.outline = 'none';
      let cwdEdited = false;
      cwdCodeEl.addEventListener('input', () => {
        isTypingInsideIframe.current = true;
        cwdEdited = true;
      });
      cwdCodeEl.addEventListener('blur', () => {
        isTypingInsideIframe.current = false;
        if (!cwdEdited) return;
        cwdEdited = false;
        const val = cwdCodeEl.innerText.trim();
        if (val !== (frontmatter.project_dir || '')) {
          onFrontmatterChange({ ...frontmatter, project_dir: val });
        }
      });
    }

    // 5. Make TL;DR directly editable inside the iframe
    const tldrP = doc.querySelector('.slide p') as HTMLElement;
    if (tldrP) {
      tldrP.contentEditable = directEditEnabled ? 'true' : 'false';
      tldrP.style.outline = 'none';
      let tldrEdited = false;
      tldrP.addEventListener('input', () => {
        isTypingInsideIframe.current = true;
        tldrEdited = true;
      });
      tldrP.addEventListener('blur', () => {
        isTypingInsideIframe.current = false;
        if (!tldrEdited) return;
        tldrEdited = false;
        const val = tldrP.innerText.trim();
        if (val !== (frontmatter.tldr || '')) {
          onFrontmatterChange({ ...frontmatter, tldr: val });
        }
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

    // 7. Handle Ctrl+S / Cmd+S inside iframe
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSaveShortcut?.();
      }
    };
    doc.addEventListener('keydown', handleKeyDown);

    // 8. CRITICAL: Intercept drag-and-drop on preview iframe to prevent browser inserting massive raw base64 data URLs!
    const handleIframeDragOver = (e: DragEvent) => {
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleIframeDrop = (e: DragEvent) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const imageFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (imageFiles.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          onDropFiles?.(imageFiles);
        }
      }
    };

    const handleIframePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const imageFiles = Array.from(e.clipboardData.files).filter(f => f.type.startsWith('image/'));
        if (imageFiles.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          onDropFiles?.(imageFiles);
        }
      }
    };

    doc.addEventListener('dragover', handleIframeDragOver);
    doc.addEventListener('drop', handleIframeDrop);
    doc.addEventListener('paste', handleIframePaste);
    if (article) {
      article.addEventListener('dragover', handleIframeDragOver);
      article.addEventListener('drop', handleIframeDrop);
      article.addEventListener('paste', handleIframePaste);
    }
  }, [directEditEnabled, frontmatter, onFrontmatterChange, onMarkdownBodyChange, assets, onSaveShortcut, onDropFiles]);

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

      {/* Sandboxed Iframe Container: ZERO Style Leakage & Handled Drop */}
      <div 
        className="flex-1 w-full h-full relative bg-white"
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
          }
        }}
        onDrop={(e) => {
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const imageFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            if (imageFiles.length > 0) {
              e.preventDefault();
              e.stopPropagation();
              onDropFiles?.(imageFiles);
            }
          }
        }}
      >
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
