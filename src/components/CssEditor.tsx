import React, { useState } from 'react';
import { 
  Palette, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  RotateCcw, 
  Eye
} from 'lucide-react';
import { USER_EMBEDDED_CSS } from '../utils/defaultStyle';

interface CssEditorProps {
  css: string;
  onChange: (newCss: string) => void;
  onViewDoc: () => void;
}

export const CssEditor: React.FC<CssEditorProps> = ({
  css,
  onChange,
  onViewDoc,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([css], { type: 'text/css;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'style.css';
    a.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = css.split('\n').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-black text-white overflow-hidden font-mono text-xs">
      {/* Top action toolbar */}
      <div className="h-12 border-b border-neutral-800 bg-neutral-950 px-4 flex items-center justify-between shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-white" />
          <span className="font-bold text-white tracking-tight uppercase">Embedded HTML Stylesheet</span>
          <span className="text-[10px] bg-black border border-neutral-700 px-2 py-0.5 rounded text-neutral-300 font-mono">
            {css.trim().length === 0 ? 'Blank CSS' : `${lineCount} lines • ${css.length} bytes`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange(USER_EMBEDDED_CSS)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-black hover:bg-neutral-900 border border-neutral-700 hover:border-white text-white rounded text-xs transition-colors cursor-pointer"
            title="Reset to the default Tufte report CSS"
          >
            <RotateCcw className="w-3.5 h-3.5 text-white" />
            <span>Reset to Tufte CSS</span>
          </button>

          {css.trim().length > 0 && (
            <button
              onClick={() => onChange('')}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-black hover:bg-neutral-900 border border-neutral-700 hover:border-white text-neutral-300 hover:text-white rounded text-xs transition-colors cursor-pointer"
              title="Clear CSS for completely blank unstyled HTML"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Make Blank</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-black hover:bg-neutral-900 border border-neutral-700 hover:border-white text-white rounded text-xs transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-white" />
                <span>Copy CSS</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-black hover:bg-neutral-900 border border-neutral-700 hover:border-white text-white rounded text-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Download style.css</span>
          </button>

          <button
            onClick={onViewDoc}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-neutral-200 text-black font-bold rounded text-xs transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Preview</span>
          </button>
        </div>
      </div>

      {/* Info notice */}
      <div className="bg-neutral-950/80 border-b border-neutral-800 px-4 py-2 text-[11px] text-neutral-400 flex items-center justify-between">
        <div>
          {css.trim().length === 0 ? (
            <span className="text-white font-sans">
              ℹ️ CSS is currently <strong>blank</strong>. Your HTML document has zero styles.
            </span>
          ) : (
            <span className="text-white font-sans">
              ✓ Style active. This CSS is <strong>embedded directly in the &lt;style&gt; tag</strong> of the document.
            </span>
          )}
        </div>
        <div className="text-[10px] text-neutral-400 font-mono">
          Embedded &lt;style&gt;
        </div>
      </div>

      {/* CSS Code Editor */}
      <div className="flex-1 relative">
        <textarea
          value={css}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="w-full h-full bg-black text-white p-4 font-mono text-[13px] leading-relaxed resize-none focus:outline-none selection:bg-white selection:text-black overflow-y-auto"
          placeholder="/* Write your CSS here — it will be directly embedded inside <style> in the HTML */"
        />
      </div>
    </div>
  );
};
