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
  Upload,
  Undo2,
  Redo2,
  LogOut,
  Cloud
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
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  user?: {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null;
  authLoading?: boolean;
  isSyncingCloud?: boolean;
  onGoogleSignIn?: () => void;
  onSignOut?: () => void;
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
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  user = null,
  authLoading = false,
  isSyncingCloud = false,
  onGoogleSignIn,
  onSignOut,
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
            <span>CSS</span>
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

          {/* Undo & Redo Toolbar Controls */}
          <div className="flex items-center bg-neutral-900 p-0.5 rounded border border-neutral-700 text-xs">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
                canUndo 
                  ? 'text-neutral-200 hover:text-white hover:bg-neutral-800 cursor-pointer' 
                  : 'text-neutral-600 cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
                canRedo 
                  ? 'text-neutral-200 hover:text-white hover:bg-neutral-800 cursor-pointer' 
                  : 'text-neutral-600 cursor-not-allowed'
              }`}
            >
              <Redo2 className="w-3.5 h-3.5" />
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
          title="Save project & export ZIP to local storage (Ctrl+S / Cmd+S)"
        >
          {isExporting ? (
            <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>Save (.zip)</span>
          <kbd className="hidden lg:inline px-1 py-0.5 bg-neutral-200 text-black text-[10px] font-mono rounded border border-neutral-300 font-semibold">
            Ctrl+S
          </kbd>
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

        {/* Google Account Sign-In / Cloud Sync */}
        <div className="h-5 w-px bg-neutral-800 mx-0.5 hidden sm:block" />
        {authLoading ? (
          <div className="px-2.5 py-1.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-400 text-xs flex items-center gap-1.5">
            <div className="w-3 h-3 border-2 border-neutral-500 border-t-white rounded-full animate-spin" />
          </div>
        ) : user ? (
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-700 rounded px-2 py-1">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || user.email || 'Account'}
                className="w-5 h-5 rounded-full object-cover border border-neutral-600"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden xl:inline text-xs text-neutral-200 max-w-[110px] truncate" title={user.email || user.displayName || ''}>
              {user.displayName || user.email}
            </span>
            {isSyncingCloud && (
              <span title="Syncing to cloud..." className="inline-flex items-center">
                <Cloud className="w-3.5 h-3.5 text-neutral-300 animate-pulse" />
              </span>
            )}
            <button
              onClick={onSignOut}
              title={`Sign out (${user.email || user.displayName || 'Google'})`}
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onGoogleSignIn}
            title="Sign in with Google to save uploaded images & documents to the cloud"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-white text-white rounded text-xs font-medium transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            <span className="hidden sm:inline">Sign in</span>
          </button>
        )}
      </div>
    </header>
  );
};
