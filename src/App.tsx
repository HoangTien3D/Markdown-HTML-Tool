/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Header } from './components/Header';
import { MarkdownEditor } from './components/MarkdownEditor';
import { DocumentPreview } from './components/DocumentPreview';
import { FrontmatterEditor } from './components/FrontmatterEditor';
import { MediaManager } from './components/MediaManager';
import { InstructionsTab } from './components/InstructionsTab';
import { HtmlSourceView } from './components/HtmlSourceView';
import { CssEditor } from './components/CssEditor';
import { ViewMode, ProjectAsset, Frontmatter, ActiveTab } from './types';
import { INITIAL_MARKDOWN, DEFAULT_ASSETS } from './utils/template';
import { parseDocument, replaceFrontmatterInDoc, stringifyFrontmatter } from './utils/frontmatter';
import { exportProjectZip, downloadMarkdownFile, downloadHtmlFile } from './utils/exportZip';
import { USER_EMBEDDED_CSS } from './utils/defaultStyle';
import { cleanRunawayBackslashes, extractAndCleanBase64Images } from './utils/htmlToMarkdown';

const LOCAL_STORAGE_KEY = 'simple_desdoc_project_backup';

/**
 * Generate a short, clean image file name (e.g. img_1.png, shot_1.jpg)
 */
function generateShortImageName(originalName: string, existingNames: Set<string>): string {
  // Extract file extension or default to .png
  const lastDot = originalName.lastIndexOf('.');
  const rawExt = lastDot !== -1 ? originalName.slice(lastDot).toLowerCase() : '.png';
  const ext = rawExt === '.jpeg' ? '.jpg' : rawExt;

  // Clean the base name to alphanumeric, or use 'img' if too long / messy
  let base = originalName.substring(0, lastDot !== -1 ? lastDot : originalName.length)
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toLowerCase();

  // If base name is long, UUID-like, or meaningless, shorten to max 8 chars
  if (base.length > 10 || /^image\d*$/i.test(base) || /^[0-9a-f_-]{10,}$/i.test(base)) {
    base = 'img';
  }

  let candidate = `${base}${ext}`;
  let counter = 1;
  while (existingNames.has(candidate)) {
    candidate = `${base}_${counter}${ext}`;
    counter++;
  }
  return candidate;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('writer');
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  // Load initial state from local storage if available, fallback to defaults
  const [rawMarkdown, setRawMarkdown] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.rawMarkdown === 'string' && parsed.rawMarkdown.trim()) {
          const cleaned = cleanRunawayBackslashes(parsed.rawMarkdown);
          return extractAndCleanBase64Images(cleaned, []).cleanedMd;
        }
      }
    } catch (e) {}
    return cleanRunawayBackslashes(INITIAL_MARKDOWN);
  });

  const [assets, setAssets] = useState<ProjectAsset[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.assets) && parsed.assets.length > 0) {
          return parsed.assets;
        }
      }
    } catch (e) {}
    return DEFAULT_ASSETS;
  });

  const [customCss, setCustomCss] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.customCss === 'string') {
          return parsed.customCss;
        }
      }
    } catch (e) {}
    return USER_EMBEDDED_CSS;
  });

  const [frontmatterOpen, setFrontmatterOpen] = useState(false);
  // User requested image tab (media manager) open by default
  const [mediaManagerOpen, setMediaManagerOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Parse frontmatter and body reactively
  const { frontmatter, body } = useMemo(() => {
    return parseDocument(rawMarkdown);
  }, [rawMarkdown]);

  // Update frontmatter from inspector or directly from preview header
  const handleFrontmatterChange = useCallback((updatedFm: Frontmatter) => {
    setRawMarkdown(prev => replaceFrontmatterInDoc(prev, updatedFm));
  }, []);

  // Update markdown body from direct in-place preview editing
  const handleMarkdownBodyChange = useCallback((newBody: string) => {
    setRawMarkdown(prev => {
      const { frontmatter: currentFm } = parseDocument(prev);
      const fmString = stringifyFrontmatter(currentFm);
      const cleaned = cleanRunawayBackslashes(newBody.trim());
      // Also catch any base64 image strings that may have slipped in
      const { cleanedMd, newAssets } = extractAndCleanBase64Images(cleaned, assets);
      if (newAssets.length > 0) {
        setAssets(a => [...a, ...newAssets]);
      }
      return `${fmString}\n\n${cleanedMd}`;
    });
  }, [assets]);

  // Process dropped files into assets with short clean names
  const handleAddFiles = useCallback((files: File[]) => {
    const totalFiles = files.length;
    if (totalFiles === 0) return;

    setAssets(prevAssets => {
      const existingNames = new Set(prevAssets.map(a => a.name));
      const newlyAddedAssets: ProjectAsset[] = [];
      const snippetsToInsert: string[] = [];

      let processedCount = 0;

      files.forEach(file => {
        // Generate short clean name e.g. shot_1.png or img_1.jpg
        const shortName = generateShortImageName(file.name, existingNames);
        existingNames.add(shortName);
        const path = `images/${shortName}`;
        const id = `${shortName}-${Date.now()}`;

        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          if (dataUrl) {
            newlyAddedAssets.push({
              id,
              name: shortName,
              path,
              dataUrl,
              size: file.size,
              type: file.type || 'image/png',
              addedAt: Date.now()
            });
            snippetsToInsert.push(`\n\n![${shortName}](${path})\n`);
          }

          processedCount++;
          if (processedCount === totalFiles) {
            if (newlyAddedAssets.length > 0) {
              setAssets(curr => [...curr, ...newlyAddedAssets]);
              setRawMarkdown(currMd => currMd + snippetsToInsert.join(''));
              // Ensure image tab is open and notify user
              setMediaManagerOpen(true);
              setToastMessage(`Added ${newlyAddedAssets.length} image(s) to images/ directory`);
              setTimeout(() => setToastMessage(null), 3000);
            }
          }
        };

        reader.readAsDataURL(file);
      });

      return prevAssets;
    });
  }, []);

  const saveToLocalStorage = useCallback((md: string, css: string, assetList: ProjectAsset[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        rawMarkdown: md,
        customCss: css,
        assets: assetList,
        savedAt: Date.now()
      }));
    } catch (err) {
      console.warn('LocalStorage save warning (asset quota limit):', err);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
          rawMarkdown: md,
          customCss: css,
          assets: [],
          savedAt: Date.now()
        }));
      } catch (e) {}
    }
  }, []);

  // Debounced auto-save to browser local storage
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToLocalStorage(rawMarkdown, customCss, assets);
    }, 1000);
    return () => clearTimeout(timer);
  }, [rawMarkdown, customCss, assets, saveToLocalStorage]);

  const handleRemoveAsset = useCallback((id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleInsertMarkdown = useCallback((snippet: string) => {
    setRawMarkdown(prev => prev + '\n' + snippet);
  }, []);

  // Saves to local storage AND exports the project ZIP (triggered by button or Ctrl+S)
  const handleSaveProject = useCallback(async () => {
    try {
      setIsExporting(true);
      // 1. Immediately persist state to browser local storage
      saveToLocalStorage(rawMarkdown, customCss, assets);

      // 2. Export & download the full ZIP to local disk
      await exportProjectZip(frontmatter, rawMarkdown, assets, customCss);

      // 3. Show feedback toast
      setToastMessage('Saved to local storage & exported ZIP (Ctrl+S)');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Failed to export project zip:', err);
      setToastMessage('Save failed. Please check console for details.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsExporting(false);
    }
  }, [frontmatter, rawMarkdown, assets, customCss, saveToLocalStorage]);

  // Global window listener for Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveProject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveProject]);

  const handleDownloadMd = useCallback(() => {
    downloadMarkdownFile(rawMarkdown, frontmatter);
  }, [rawMarkdown, frontmatter]);

  const handleDownloadHtml = useCallback(() => {
    downloadHtmlFile(frontmatter, body, customCss);
  }, [frontmatter, body, customCss]);

  const handleResetTemplate = useCallback(() => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {}
    setRawMarkdown(cleanRunawayBackslashes(INITIAL_MARKDOWN));
    setAssets(DEFAULT_ASSETS);
    setCustomCss(USER_EMBEDDED_CSS);
    setToastMessage('Template reset to blank');
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const handleImportMd = useCallback((text: string, filename?: string) => {
    if (!text || !text.trim()) return;
    const cleaned = cleanRunawayBackslashes(text);
    setRawMarkdown(cleaned);
    saveToLocalStorage(cleaned, customCss, assets);
    setActiveTab('writer');
    setToastMessage(`Imported ${filename || 'markdown file'}`);
    setTimeout(() => setToastMessage(null), 2500);
  }, [customCss, assets, saveToLocalStorage]);

  // Global drag-and-drop listener on page
  const handleGlobalDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
    }
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);

      // Check for Markdown file import (.md or .markdown)
      const mdFile = files.find(f => f.name.endsWith('.md') || f.name.endsWith('.markdown'));
      if (mdFile) {
        e.preventDefault();
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          if (text) {
            handleImportMd(text, mdFile.name);
          }
        };
        reader.readAsText(mdFile);
      }

      // Check for images
      const imageFiles = files.filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        e.preventDefault();
        handleAddFiles(imageFiles);
      }
    }
  };

  return (
    <div 
      className="flex flex-col h-screen w-screen overflow-hidden bg-black font-sans"
      onDragOver={handleGlobalDragOver}
      onDrop={handleGlobalDrop}
    >
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        frontmatterOpen={frontmatterOpen}
        setFrontmatterOpen={setFrontmatterOpen}
        mediaManagerOpen={mediaManagerOpen}
        setMediaManagerOpen={setMediaManagerOpen}
        assets={assets}
        frontmatter={frontmatter}
        customCss={customCss}
        onExportZip={handleSaveProject}
        onDownloadMd={handleDownloadMd}
        onDownloadHtml={handleDownloadHtml}
        onImportMd={handleImportMd}
        isExporting={isExporting}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeTab === 'instructions' && (
          <InstructionsTab
            onBackToEditor={() => setActiveTab('writer')}
            onResetTemplate={handleResetTemplate}
          />
        )}

        {activeTab === 'css' && (
          <CssEditor
            css={customCss}
            onChange={setCustomCss}
            onViewDoc={() => {
              setActiveTab('writer');
              setViewMode('preview');
            }}
          />
        )}

        {activeTab === 'writer' && (
          <>
            {/* View Mode Switching */}
            {viewMode === 'split' && (
              <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
                <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col">
                  <MarkdownEditor
                    value={rawMarkdown}
                    onChange={setRawMarkdown}
                    onDropFiles={handleAddFiles}
                    assets={assets}
                    onOpenMediaManager={() => setMediaManagerOpen(true)}
                    onSaveShortcut={handleSaveProject}
                  />
                </div>
                <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col">
                  <DocumentPreview
                    frontmatter={frontmatter}
                    onFrontmatterChange={handleFrontmatterChange}
                    markdownBody={body}
                    onMarkdownBodyChange={handleMarkdownBodyChange}
                    assets={assets}
                    customCss={customCss}
                    onSaveShortcut={handleSaveProject}
                    onDropFiles={handleAddFiles}
                  />
                </div>
              </div>
            )}

            {viewMode === 'preview' && (
              <DocumentPreview
                frontmatter={frontmatter}
                onFrontmatterChange={handleFrontmatterChange}
                markdownBody={body}
                onMarkdownBodyChange={handleMarkdownBodyChange}
                assets={assets}
                customCss={customCss}
                onSaveShortcut={handleSaveProject}
                onDropFiles={handleAddFiles}
              />
            )}

            {viewMode === 'html' && (
              <HtmlSourceView
                frontmatter={frontmatter}
                markdownBody={body}
                embeddedCss={customCss}
              />
            )}

            {/* Frontmatter Inspector Drawer */}
            {frontmatterOpen && (
              <FrontmatterEditor
                frontmatter={frontmatter}
                onChange={handleFrontmatterChange}
                onClose={() => setFrontmatterOpen(false)}
              />
            )}

            {/* Media Manager Drawer */}
            {mediaManagerOpen && (
              <MediaManager
                assets={assets}
                onAddAssets={handleAddFiles}
                onRemoveAsset={handleRemoveAsset}
                onInsertMarkdown={handleInsertMarkdown}
                onClose={() => setMediaManagerOpen(false)}
              />
            )}
          </>
        )}
      </div>

      {/* Save Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-white text-black border border-white px-3.5 py-2 rounded shadow-2xl flex items-center gap-2.5 z-50 text-xs font-mono font-bold animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
