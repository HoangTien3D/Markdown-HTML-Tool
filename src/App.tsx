/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from 'react';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('writer');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [rawMarkdown, setRawMarkdown] = useState<string>(INITIAL_MARKDOWN);
  const [assets, setAssets] = useState<ProjectAsset[]>(DEFAULT_ASSETS);
  const [customCss, setCustomCss] = useState<string>(USER_EMBEDDED_CSS); // Initialized with user's embedded CSS
  const [frontmatterOpen, setFrontmatterOpen] = useState(false);
  const [mediaManagerOpen, setMediaManagerOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
      return `${fmString}\n\n${newBody.trim()}`;
    });
  }, []);

  // Process dropped files into assets
  const handleAddFiles = useCallback((files: File[]) => {
    const newAssets: ProjectAsset[] = [];
    const snippetsToInsert: string[] = [];

    let processedCount = 0;
    const totalFiles = files.length;

    files.forEach(file => {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `images/${cleanName}`;
      const id = `${cleanName}-${Date.now()}`;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          newAssets.push({
            id,
            name: cleanName,
            path,
            dataUrl,
            size: file.size,
            type: file.type,
            addedAt: Date.now()
          });
          snippetsToInsert.push(`\n![${cleanName}](${path})\n`);
        }

        processedCount++;
        if (processedCount === totalFiles) {
          setAssets(prev => {
            const existingNames = new Set(prev.map(a => a.name));
            const filteredNew = newAssets.filter(a => !existingNames.has(a.name));
            return [...prev, ...filteredNew];
          });

          // Append markdown image snippet into document
          setRawMarkdown(prev => prev + snippetsToInsert.join(''));
        }
      };

      reader.readAsDataURL(file);
    });
  }, []);

  const handleRemoveAsset = useCallback((id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleInsertMarkdown = useCallback((snippet: string) => {
    setRawMarkdown(prev => prev + '\n' + snippet);
  }, []);

  const handleExportZip = useCallback(async () => {
    try {
      setIsExporting(true);
      await exportProjectZip(frontmatter, rawMarkdown, assets, customCss);
    } catch (err) {
      console.error('Failed to export project zip:', err);
      alert('Export failed. Please check console for details.');
    } finally {
      setIsExporting(false);
    }
  }, [frontmatter, rawMarkdown, assets, customCss]);

  const handleDownloadMd = useCallback(() => {
    downloadMarkdownFile(rawMarkdown, frontmatter);
  }, [rawMarkdown, frontmatter]);

  const handleDownloadHtml = useCallback(() => {
    downloadHtmlFile(frontmatter, body, customCss);
  }, [frontmatter, body, customCss]);

  const handleResetTemplate = useCallback(() => {
    setRawMarkdown(INITIAL_MARKDOWN);
    setAssets(DEFAULT_ASSETS);
  }, []);

  const handleImportMd = useCallback((text: string, filename?: string) => {
    if (!text || !text.trim()) return;
    setRawMarkdown(text);
    setActiveTab('writer');
  }, []);

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
        onExportZip={handleExportZip}
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
    </div>
  );
}
