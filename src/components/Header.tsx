import React from 'react';
import { 
  FileText, 
  Download, 
  HelpCircle, 
  Columns, 
  Eye, 
  Code, 
  Sliders, 
  Image as ImageIcon,
  ChevronDown,
  Palette,
  Upload
} from 'lucide-react';
import { ViewMode, Frontmatter, ProjectAsset, ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  frontmatterOpen: boolean;
  setFrontmatterOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  mediaManagerOpen: boolean;
  setMediaManagerOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  assets: ProjectAsset[];
  frontmatter: Frontmatter;
  customCss: string;
  onExportZip: () => void;
  onDownloadMd: () => void;
  onDownloadHtml: () => void;
  onImportMd: (content: string, filename?: string) => void;
  isExporting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  frontmatterOpen,
  setFrontmatterOpen,
  mediaManagerOpen,
  setMediaManagerOpen,
  assets,
  frontmatter,
  customCss,
  onExportZip,
  onDownloadMd,
  onDownloadHtml,
  onImportMd,
  isExporting,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text !== undefined) {
        onImportMd(text, file.name);
      }
    };
    reader.readAsText(file);

    // Reset input so re-importing the same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasCustomCss = customCss.trim().length > 0;

  return (
    <header className="h-14 bg-black border-b border-neutral-800 text-white px-4 flex items-center justify-between gap-3 shrink-0 select-none">
      {/* Tab Navigation */}
      <div className="flex items-center gap-4">
        {/* Tab Switcher: High Contrast Black & White */}
        <div className="flex items-center bg-neutral-900 p-0.5 rounded border border-neutral-700">
          <button
            onClick={() => setActiveTab('writer')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'writer'
                ? 'bg-white text-black font-semibold'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Document</span>
          </button>
          
          <button
            onClick={() => setActiveTab('css')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'css'
                ? 'bg-white text-black font-semibold'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>CSS (style.css)</span>
            {hasCustomCss && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('instructions')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'instructions'
                ? 'bg-white text-black font-semibold'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Syntax Guide</span>
          </button>
        </div>
      </div>

      {/* Center Controls (Only in Writer Mode) */}
      {activeTab === 'writer' && (
        <div className="hidden md:flex items-center gap-2">
          {/* View Mode Buttons (Split, Preview, HTML) */}
          <div className="flex items-center bg-neutral-900 p-0.5 rounded border border-neutral-700 text-xs">
            <button
              onClick={() => setViewMode('split')}
              title="Split View (Editor & Live Preview)"
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                viewMode === 'split' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              title="Preview Only (Directly Editable)"
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                viewMode === 'preview' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setViewMode('html')}
              title="Clean HTML View"
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                viewMode === 'html' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>HTML</span>
            </button>
          </div>

          {/* Frontmatter Inspector Toggle */}
          <button
            onClick={() => setFrontmatterOpen(prev => !prev)}
            title="Toggle Frontmatter Inspector"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs border transition-colors ${
              frontmatterOpen 
                ? 'bg-white text-black border-white font-semibold' 
                : 'bg-black text-white border-neutral-700 hover:border-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Frontmatter</span>
          </button>

          {/* Media Manager Drawer Toggle */}
          <button
            onClick={() => setMediaManagerOpen(prev => !prev)}
            title="Manage images folder"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs border transition-colors ${
              mediaManagerOpen 
                ? 'bg-white text-black border-white font-semibold' 
                : 'bg-black text-white border-neutral-700 hover:border-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>images/</span>
            <span className="w-4 h-4 rounded-full bg-neutral-800 text-[10px] font-mono flex items-center justify-center text-white border border-neutral-600">
              {assets.length}
            </span>
          </button>
        </div>
      )}

      {/* Right Action: Import & Export Project ZIP */}
      <div className="flex items-center gap-2 relative">
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,text/markdown,text/plain"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-neutral-900 border border-neutral-700 hover:border-white text-neutral-200 hover:text-white rounded text-xs font-mono transition-colors cursor-pointer"
          title="Import an existing .md file (e.g. report.md)"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import .md</span>
        </button>

        <button
          onClick={onExportZip}
          disabled={isExporting}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-white text-black hover:bg-neutral-200 active:bg-neutral-300 rounded text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {isExporting ? (
            <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>Export(.zip)</span>
        </button>

        {/* Dropdown for individual downloads */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="p-1.5 bg-black hover:bg-neutral-900 border border-neutral-700 hover:border-white text-white rounded text-xs transition-colors cursor-pointer"
            title="More export formats"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {dropdownOpen && (
            <div 
              className="absolute right-0 top-full mt-1.5 w-48 bg-black border border-white/30 rounded shadow-2xl py-1 z-50 text-xs text-white"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
                Single File Exports
              </div>
              <button
                onClick={() => {
                  onDownloadHtml();
                  setDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-900 flex items-center gap-2"
              >
                <Code className="w-3.5 h-3.5 text-white" />
                <span>Download index.html</span>
              </button>
              <button
                onClick={() => {
                  onDownloadMd();
                  setDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-900 flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-white" />
                <span>Download report.md</span>
              </button>
              <button
                onClick={() => {
                  window.print();
                  setDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-900 flex items-center gap-2 border-t border-neutral-800"
              >
                <Eye className="w-3.5 h-3.5 text-white" />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
