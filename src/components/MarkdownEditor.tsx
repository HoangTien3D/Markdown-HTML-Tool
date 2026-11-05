import React, { useRef, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Code, 
  List, 
  Quote, 
  Heading1, 
  Heading2, 
  Table, 
  Minus, 
  UploadCloud,
  Layers,
  ChevronDown
} from 'lucide-react';
import { ProjectAsset } from '../types';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onDropFiles: (files: File[]) => void;
  assets: ProjectAsset[];
  onOpenMediaManager: () => void;
}

const COMMON_SNIPPETS = [
  { name: '# Heading 1', snippet: '\n\n# Heading 1\n\n' },
  { name: '## Heading 2', snippet: '\n\n## Section Heading\n\n' },
  { name: '### Heading 3', snippet: '\n\n### Sub-heading\n\n' },
  { name: 'Fenced Code Block', snippet: '\n\n```typescript\n// code here\n```\n\n' },
  { name: 'Data Table', snippet: '\n\n| Column 1 | Column 2 |\n| :--- | :--- |\n| Value 1 | Value 2 |\n\n' },
  { name: 'Blockquote / Change-bar', snippet: '\n\n> Quote or change-bar text\n\n' },
  { name: 'Checklist Item', snippet: '\n- [ ] Task item\n' },
  { name: 'Divider Rule', snippet: '\n\n---\n\n' },
];

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onDropFiles,
  assets,
  onOpenMediaManager,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSectionMenu, setShowSectionMenu] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const updated = value.substring(0, start) + '  ' + value.substring(end);
      onChange(updated);

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = value.substring(start, end);

    const replacement = before + (selection || 'text') + after;
    const updated = value.substring(0, start) + replacement + value.substring(end);
    onChange(updated);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + (selection || 'text').length;
    });
  };

  const insertSnippet = (snippet: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const updated = value.substring(0, start) + snippet + value.substring(start);
    onChange(updated);
    setShowSectionMenu(false);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFiles(Array.from(e.dataTransfer.files));
    }
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const lineCount = value.split('\n').length;

  return (
    <div 
      className="flex-1 flex flex-col h-full bg-black border-r border-neutral-800 relative overflow-hidden select-text"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* High Contrast Formatting Toolbar */}
      <div className="h-10 border-b border-neutral-800 bg-neutral-950 px-3 flex items-center justify-between gap-1 shrink-0 text-white">
        <div className="flex items-center gap-1">
          {/* Quick Insert Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSectionMenu(!showSectionMenu)}
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-mono bg-black hover:bg-neutral-900 text-white border border-neutral-700 hover:border-white rounded transition-colors cursor-pointer"
              title="Insert Markdown block syntax"
            >
              <Layers className="w-3.5 h-3.5 text-white" />
              <span>Insert</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {showSectionMenu && (
              <div 
                className="absolute left-0 top-full mt-1 w-52 bg-black border border-neutral-700 rounded shadow-2xl py-1 z-50 text-xs font-mono"
                onMouseLeave={() => setShowSectionMenu(false)}
              >
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
                  Formatting Blocks
                </div>
                {COMMON_SNIPPETS.map((snip) => (
                  <button
                    key={snip.name}
                    onClick={() => insertSnippet(snip.snippet)}
                    className="w-full text-left px-3 py-1.5 hover:bg-white hover:text-black text-neutral-200 flex items-center justify-between transition-colors"
                  >
                    <span>{snip.name}</span>
                    <span className="text-[10px] text-neutral-500 hover:text-black">+add</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-neutral-800 mx-1" />

          {/* Quick Markdown formatting icons */}
          <button
            onClick={() => insertText('# ', '')}
            className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white"
            title="Heading 1 (# )"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertText('## ', '')}
            className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white"
            title="Heading 2 (## )"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertText('**', '**')}
            className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white"
            title="Bold (**text**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertText('*', '*')}
            className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white"
            title="Italic (*text*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertText('```typescript\n', '\n```')}
            className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white"
            title="Code Block (```)"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertText('> ', '')}
            className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white"
            title="Quote / Change-bar (> )"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertText('- ', '')}
            className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white"
            title="Bullet list (- )"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertText('\n| Column 1 | Column 2 |\n| :--- | :--- |\n| Value 1 | Value 2 |\n')}
            className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white"
            title="Table"
          >
            <Table className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertText('\n---\n')}
            className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white"
            title="Horizontal Divider (---)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Drag Drop Hint */}
        <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
          <span className="hidden sm:inline">Drop images into editor</span>
          <button
            onClick={onOpenMediaManager}
            className="text-white hover:underline font-mono text-[11px]"
          >
            images/ ({assets.length})
          </button>
        </div>
      </div>

      {/* High Contrast Text Area */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="w-full h-full bg-black text-white p-4 font-mono text-[13px] leading-relaxed resize-none focus:outline-none selection:bg-white selection:text-black overflow-y-auto"
          placeholder="Write your Markdown and YAML frontmatter here..."
        />

        {/* Drag & Drop Visual Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-black/90 border-2 border-dashed border-white flex flex-col items-center justify-center pointer-events-none z-30">
            <UploadCloud className="w-12 h-12 text-white mb-2 animate-bounce" />
            <div className="text-sm font-bold text-white font-mono">Drop image to bundle in images/</div>
            <div className="text-xs text-neutral-400 font-mono mt-1">Markdown syntax will be inserted</div>
          </div>
        )}
      </div>

      {/* Editor Status Bar */}
      <div className="h-7 border-t border-neutral-800 bg-neutral-950 px-3 flex items-center justify-between text-[11px] text-neutral-400 font-mono select-none">
        <div className="flex items-center gap-3">
          <span>{lineCount} lines</span>
          <span>&bull;</span>
          <span>{wordCount} words</span>
          <span>&bull;</span>
          <span>{value.length} characters</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-400">
          <span>Markdown + YAML Frontmatter</span>
        </div>
      </div>
    </div>
  );
};
