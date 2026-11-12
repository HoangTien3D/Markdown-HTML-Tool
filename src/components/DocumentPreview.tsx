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
  onRescaleImagePixels?: (assetId: string, width: number, height: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
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
  onRescaleImagePixels,
  onUndo,
  onRedo,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isTypingInsideIframe = useRef(false);
  const [directEditEnabled, setDirectEditEnabled] = useState(true);

  // Preserve scroll position so rescaling or editing never snaps back to the top of the page
  const savedScrollY = useRef(0);
  const prevFrontmatterJson = useRef('');
  const prevMarkdownBody = useRef('');
  const prevCustomCss = useRef('');

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

  // Generate full HTML string with embedded CSS and assetMap resolution
  const fullHtml = useMemo(() => {
    return generateStandaloneHtml(frontmatter, markdownBody, customCss, assetMap);
  }, [frontmatter, markdownBody, customCss, assetMap]);

  // Sync HTML into iframe without leaking styles to outer app, preserving scroll position!
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // If user is actively typing in the iframe, don't re-render entire srcdoc to avoid cursor jump
    if (isTypingInsideIframe.current) return;

    // Check if only image assets changed while text, frontmatter, and CSS remained unchanged
    const currentFmJson = JSON.stringify(frontmatter);
    const textAndStructureUnchanged = 
      prevMarkdownBody.current === markdownBody &&
      prevFrontmatterJson.current === currentFmJson &&
      prevCustomCss.current === customCss;

    prevMarkdownBody.current = markdownBody;
    prevFrontmatterJson.current = currentFmJson;
    prevCustomCss.current = customCss;

    // If only assets changed (e.g. image rescale), update ONLY the specific matching image source in place!
    if (textAndStructureUnchanged && iframe.contentDocument && iframe.contentDocument.body) {
      const doc = iframe.contentDocument;
      const images = doc.querySelectorAll('img');
      images.forEach(img => {
        const path = img.getAttribute('data-asset-path') || '';
        const bareName = path.replace('images/', '');
        const matched = assets.find(a => (path && (a.path === path || a.name === bareName || a.name === path)));
        if (matched && img.src !== matched.dataUrl) {
          img.src = matched.dataUrl;
        }
      });
      return;
    }

    // Capture current scroll before replacing srcdoc
    if (iframe.contentWindow) {
      const currentScroll = iframe.contentWindow.scrollY || iframe.contentDocument?.documentElement.scrollTop || 0;
      if (currentScroll > 0) {
        savedScrollY.current = currentScroll;
      }
    }

    iframe.srcdoc = fullHtml;
  }, [fullHtml, frontmatter, markdownBody, customCss, assetMap]);

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
        let cleaned = val;
        if (frontmatter.report_number !== undefined && frontmatter.report_number !== '') {
          cleaned = val.replace(/^report\s+\d+:\s*/i, '').trim();
        }
        if (cleaned !== (frontmatter.title || '')) {
          onFrontmatterChange({ ...frontmatter, title: cleaned });
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

    // Restore saved scroll position so the document never snaps back to the top
    if (savedScrollY.current > 0) {
      const y = savedScrollY.current;
      doc.defaultView?.scrollTo(0, y);
      doc.documentElement.scrollTop = y;
      requestAnimationFrame(() => {
        doc.defaultView?.scrollTo(0, y);
        doc.documentElement.scrollTop = y;
      });
    }

    // Continuously keep savedScrollY updated
    const handleScroll = () => {
      if (doc.defaultView) {
        savedScrollY.current = doc.defaultView.scrollY || doc.documentElement.scrollTop || 0;
      }
    };
    doc.addEventListener('scroll', handleScroll, { passive: true });

    // 7. Handle Ctrl+S (Save), Ctrl+Z (Undo), Ctrl+Y (Redo) inside iframe
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      if (!isCtrlOrMeta) return;

      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSaveShortcut?.();
      } else if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo?.();
        } else {
          onUndo?.();
        }
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        onRedo?.();
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
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(f => f.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(f.name));
        if (imageFiles.length > 0) {
          onDropFiles?.(imageFiles);
        }
      }
    };

    const handleIframePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const files = Array.from(e.clipboardData.files);
        const imageFiles = files.filter(f => f.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(f.name));
        if (imageFiles.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          onDropFiles?.(imageFiles);
        }
      }
    };

    doc.addEventListener('dragover', handleIframeDragOver);
    doc.addEventListener('drop', handleIframeDrop);
    // 9. Interactive Drag-and-Release Image Rescaling directly on the preview
    // Does NOT open the modal window; rescales the image asset directly when drag is released!
    const existingOverlay = doc.getElementById('img-resize-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = doc.createElement('div');
    overlay.id = 'img-resize-overlay';
    overlay.style.position = 'absolute';
    overlay.style.display = 'none';
    overlay.style.pointerEvents = 'none';
    overlay.style.border = '2px solid #2563eb';
    overlay.style.zIndex = '9999';
    overlay.style.boxSizing = 'border-box';

    // Resize handle at bottom-right corner
    const handle = doc.createElement('div');
    handle.id = 'img-resize-handle';
    handle.style.position = 'absolute';
    handle.style.right = '-7px';
    handle.style.bottom = '-7px';
    handle.style.width = '14px';
    handle.style.height = '14px';
    handle.style.backgroundColor = '#ffffff';
    handle.style.border = '2px solid #2563eb';
    handle.style.borderRadius = '3px';
    handle.style.cursor = 'nwse-resize';
    handle.style.pointerEvents = 'auto';
    handle.title = 'Drag and release to rescale image pixels';

    // Live dimension badge
    const badge = doc.createElement('div');
    badge.id = 'img-resize-badge';
    badge.style.position = 'absolute';
    badge.style.bottom = '-24px';
    badge.style.right = '0';
    badge.style.backgroundColor = '#0f172a';
    badge.style.color = '#ffffff';
    badge.style.padding = '2px 6px';
    badge.style.fontSize = '10px';
    badge.style.fontFamily = 'monospace';
    badge.style.borderRadius = '3px';
    badge.style.whiteSpace = 'nowrap';
    badge.style.pointerEvents = 'none';
    badge.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';

    overlay.appendChild(handle);
    overlay.appendChild(badge);
    doc.body.appendChild(overlay);

    let activeImg: HTMLImageElement | null = null;

    const updateOverlayPosition = (img: HTMLImageElement) => {
      const rect = img.getBoundingClientRect();
      const scrollX = doc.defaultView?.scrollX || 0;
      const scrollY = doc.defaultView?.scrollY || 0;
      overlay.style.left = `${rect.left + scrollX}px`;
      overlay.style.top = `${rect.top + scrollY}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      badge.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)} px`;
    };

    // Keep overlay in sync with scrolling and window resizing
    const handleScrollOrResize = () => {
      if (activeImg && activeImg.isConnected) {
        updateOverlayPosition(activeImg);
      } else {
        overlay.style.display = 'none';
        activeImg = null;
      }
    };
    doc.addEventListener('scroll', handleScrollOrResize, true);
    doc.defaultView?.addEventListener('resize', handleScrollOrResize);

    // Dismiss overlay on outside clicks
    doc.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'IMG' && target !== handle) {
        overlay.style.display = 'none';
        activeImg = null;
      }
    });

    // Attach click listeners to all images in article to select them for resizing
    if (article) {
      const imgElements = article.querySelectorAll('img');
      imgElements.forEach(img => {
        img.style.cursor = 'pointer';
        img.title = 'Click to activate drag-and-release resize handle';
        img.addEventListener('click', (e) => {
          e.stopPropagation();
          activeImg = img;
          overlay.style.display = 'block';
          updateOverlayPosition(img);
        });
      });
    }

    // Handle interactive drag-and-release scaling
    let isDragging = false;
    let startX = 0;
    let startWidth = 0;
    let startHeight = 0;
    let aspectRatio = 1;
    let currentTargetW = 0;
    let currentTargetH = 0;

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !activeImg) return;
      e.preventDefault();

      const deltaX = e.clientX - startX;
      const newW = Math.max(50, Math.round(startWidth + deltaX));
      const newH = Math.max(30, Math.round(newW * aspectRatio));

      currentTargetW = newW;
      currentTargetH = newH;

      activeImg.style.width = `${newW}px`;
      activeImg.style.height = `${newH}px`;
      updateOverlayPosition(activeImg);
      badge.textContent = `${newW} × ${newH} px (Release to rescale)`;
    };

    const onMouseUp = () => {
      if (!isDragging || !activeImg) return;
      isDragging = false;

      doc.removeEventListener('mousemove', onMouseMove);
      doc.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      const imgToRescale = activeImg;
      const targetW = currentTargetW;
      const targetH = currentTargetH;

      // Remove temporary visual inline styling so the image displays cleanly at its new native pixel resolution
      imgToRescale.style.width = '';
      imgToRescale.style.height = '';

      const path = imgToRescale.getAttribute('data-asset-path') || '';
      const bareName = path.replace('images/', '');
      const src = imgToRescale.getAttribute('src') || '';
      const match = assets.find(a => 
        (path && (a.path === path || a.name === bareName || a.name === path)) ||
        a.dataUrl === src
      );

      if (match && targetW > 0 && targetH > 0) {
        onRescaleImagePixels?.(match.id, targetW, targetH);
      }

      setTimeout(() => {
        if (imgToRescale.isConnected) {
          updateOverlayPosition(imgToRescale);
        }
      }, 100);
    };

    handle.addEventListener('mousedown', (e) => {
      if (!activeImg) return;
      e.preventDefault();
      e.stopPropagation();

      isDragging = true;
      startX = e.clientX;
      startWidth = activeImg.offsetWidth;
      startHeight = activeImg.offsetHeight;
      const natW = activeImg.naturalWidth || startWidth;
      const natH = activeImg.naturalHeight || startHeight;
      aspectRatio = natH / (natW || 1);
      currentTargetW = startWidth;
      currentTargetH = startHeight;

      doc.addEventListener('mousemove', onMouseMove);
      doc.addEventListener('mouseup', onMouseUp);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }, [directEditEnabled, frontmatter, onFrontmatterChange, onMarkdownBodyChange, assets, onSaveShortcut, onDropFiles, onRescaleImagePixels, onUndo, onRedo]);

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
            (preview editor)
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
        className="flex-1 w-full h-full relative bg-black"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            const imageFiles = files.filter(f => f.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(f.name));
            if (imageFiles.length > 0) {
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
