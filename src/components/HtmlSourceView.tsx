import React, { useState } from 'react';
import { Copy, Check, Download, FileCode } from 'lucide-react';
import { Frontmatter } from '../types';
import { generateStandaloneHtml } from '../utils/htmlGenerator';

interface HtmlSourceViewProps {
  frontmatter: Frontmatter;
  markdownBody: string;
  embeddedCss?: string;
}

export const HtmlSourceView: React.FC<HtmlSourceViewProps> = ({
  frontmatter,
  markdownBody,
  embeddedCss = '',
}) => {
  const [copied, setCopied] = useState(false);

  const htmlSource = React.useMemo(() => {
    return generateStandaloneHtml(frontmatter, markdownBody, embeddedCss);
  }, [frontmatter, markdownBody, embeddedCss]);

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlSource);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([htmlSource], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-black text-white overflow-hidden font-mono text-xs">
      {/* Top Bar */}
      <div className="h-10 border-b border-neutral-800 bg-neutral-950 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-white" />
          <span className="font-bold text-white tracking-wide uppercase">index.html (Compiled Standalone HTML)</span>
          <span className="text-[10px] bg-black border border-neutral-700 px-2 py-0.5 rounded text-neutral-300">
            {htmlSource.length.toLocaleString()} bytes
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 bg-black hover:bg-neutral-900 border border-neutral-700 hover:border-white text-white rounded transition-colors text-xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-white" />
                <span>Copy HTML</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-neutral-200 text-black font-bold rounded transition-colors text-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download HTML</span>
          </button>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="flex-1 overflow-auto p-4 bg-black">
        <pre className="text-white leading-relaxed font-mono select-text">
          <code>{htmlSource}</code>
        </pre>
      </div>
    </div>
  );
};
