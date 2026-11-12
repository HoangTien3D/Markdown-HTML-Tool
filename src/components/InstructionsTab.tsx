import React from 'react';
import { 
  ArrowRight, 
  RotateCcw, 
  Check, 
  Heading1, 
  Heading2, 
  Table, 
  Code2, 
  FileText, 
  Quote, 
  List, 
  Image as ImageIcon,
  Sliders,
  CheckCircle2
} from 'lucide-react';

interface InstructionsTabProps {
  onBackToEditor: () => void;
  onResetTemplate: () => void;
}

export const InstructionsTab: React.FC<InstructionsTabProps> = ({
  onBackToEditor,
  onResetTemplate,
}) => {
  const [resetConfirm, setResetConfirm] = React.useState(false);

  const handleReset = () => {
    onResetTemplate();
    setResetConfirm(true);
    setTimeout(() => {
      setResetConfirm(false);
      onBackToEditor();
    }, 1200);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-black text-white p-6 md:p-12 font-sans select-text">
      <div className="max-w-4xl mx-auto space-y-12">

        {/* High Contrast Header Banner */}
        <div className="bg-neutral-950 border border-neutral-700 rounded-xl p-6 shadow-2xl">
          <div className="inline-block px-2.5 py-1 bg-white text-black font-mono font-bold text-[11px] uppercase tracking-wider mb-2">
            Editor Formatting Guide
          </div>
          <p className="text-neutral-300 text-sm leading-relaxed max-w-2xl">
            This guide covers the Markdown syntax used by the document engine. 
          </p>

          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <button
              onClick={onBackToEditor}
              className="px-4 py-2 bg-white text-black hover:bg-neutral-200 font-bold rounded text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Back to Document Editor</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              className="px-4 py-2 bg-black hover:bg-neutral-900 border border-neutral-700 hover:border-white text-white rounded text-xs flex items-center gap-2 transition-colors cursor-pointer font-mono"
            >
              {resetConfirm ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Template Reset!</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset to Blank Template</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 1. Headings Hierarchy */}
        <div className="space-y-4">
          <div className="border-b border-neutral-800 pb-2">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wide flex items-center gap-2">
              <Heading1 className="w-4 h-4" />
              <span>1. Headings &amp; Table of Contents</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Headings format text hierarchy and automatically generate items in the fixed Table of Contents sidebar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 font-mono text-xs text-neutral-200 space-y-2">
              <div className="text-neutral-500 font-semibold mb-1">Markdown Syntax:</div>
              <div># Primary Heading 1</div>
              <div>## Major Section Heading 2</div>
              <div>### Sub-section Heading 3</div>
              <div>#### Topic Heading 4</div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-xs space-y-2.5">
              <div className="text-neutral-500 font-mono font-semibold mb-1">Behavior &amp; Rendering:</div>
              <div>
                <strong className="text-white font-mono"># H1:</strong> Rendered in uppercase 24px bold. Serves as document section dividers.
              </div>
              <div>
                <strong className="text-white font-mono">## H2:</strong> Rendered in 20px bold. Automatically linked in the sidebar TOC.
              </div>
              <div>
                <strong className="text-white font-mono">### H3:</strong> Rendered in 17px medium gray (#444) for secondary subsections.
              </div>
              <div>
                <strong className="text-white font-mono">#### H4:</strong> Shares body font size (14px) with uppercase weight.
              </div>
            </div>
          </div>
        </div>

        {/* 2. Frontmatter YAML Block */}
        <div className="space-y-4">
          <div className="border-b border-neutral-800 pb-2">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wide flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              <span>2. Frontmatter Metadata Header</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Place at the very top of your file between two <code className="bg-neutral-800 px-1 py-0.5 rounded text-white font-mono">---</code> lines.
            </p>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 font-mono text-xs text-neutral-200 leading-relaxed overflow-x-auto">
            <div className="text-neutral-600">---</div>
            <div><span className="text-white font-bold">title</span>: "Example Design Document: The Markdown Dialect"</div>
            <div><span className="text-white font-bold">subtitle</span>: "A worked example showing every block the design-document tool understands."</div>
            <div><span className="text-white font-bold">name</span>: "A Great Student"</div>
            <div><span className="text-white font-bold">student_number</span>: s1234567</div>
            <div><span className="text-white font-bold">date</span>: 2026-11-11 09:00:00</div>
            <div><span className="text-white font-bold">report_number</span>: 1</div>
            <div><span className="text-white font-bold">abstract</span>: "This is a live example. Edit the Markdown on the left..."</div>
            <div className="text-neutral-600">---</div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg text-xs text-neutral-300 space-y-1.5">
            <div>&bull; <strong className="text-white font-mono">Quoting Rules:</strong> <code className="text-white font-mono">title</code>, <code className="text-white font-mono">subtitle</code>, <code className="text-white font-mono">name</code>, and <code className="text-white font-mono">abstract</code> must be double-quoted. Metadata like <code className="text-white font-mono">student_number</code>, <code className="text-white font-mono">date</code>, and <code className="text-white font-mono">report_number</code> are unquoted.</div>
            <div>&bull; <strong className="text-white font-mono">Fixed Dialect Sections:</strong> Top-level <code className="text-white font-mono">#</code> headings name the fixed sections: <code className="text-white font-mono"># Content</code> (required), and the optional <code className="text-white font-mono"># Prompt</code> and <code className="text-white font-mono"># Lesson</code>. Inside <code className="text-white font-mono"># Content</code>, use numbered <code className="text-white font-mono">## N. Section</code> headings and typed blocks (<code className="text-white font-mono">### Phase:</code>, <code className="text-white font-mono">### Slide:</code>, <code className="text-white font-mono">### Bug:</code>, <code className="text-white font-mono">### Metrics</code>).</div>
            <div>&bull; <strong className="text-white font-mono">Abstract:</strong> The <code className="text-white font-mono">abstract</code> in frontmatter renders as the first section of the document and is listed at the top of the contents sidebar.</div>
            <div>&bull; <strong className="text-white font-mono">Math Support:</strong> Math blocks like <code className="text-white font-mono">$E = mc^2$</code> and <code className="text-white font-mono">$$...$$</code> are typeset automatically using MathJax.</div>
          </div>
        </div>

        {/* 3. Inline Styles, Quotes, & Code */}
        <div className="space-y-4">
          <div className="border-b border-neutral-800 pb-2">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wide flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              <span>3. Text Formatting &amp; Code Blocks</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Standard GitHub-Flavored Markdown styles for body copy, code, and callouts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 font-mono text-xs text-neutral-200 space-y-3">
              <div>
                <span className="text-neutral-500 block mb-1">Bold &amp; Italic:</span>
                <div>**Bold font text**</div>
                <div>*Italic emphasis*</div>
                <div>***Bold and italic***</div>
              </div>

              <div>
                <span className="text-neutral-500 block mb-1">Inline Code &amp; Keystrokes:</span>
                <div>`const x = 42;`</div>
              </div>

              <div>
                <span className="text-neutral-500 block mb-1">Links:</span>
                <div>[Link Label](https://example.com)</div>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 font-mono text-xs text-neutral-200 space-y-3">
              <div>
                <span className="text-neutral-500 block mb-1">Fenced Code Block:</span>
                <div className="text-neutral-400">```typescript</div>
                <div className="pl-3">interface Report &#123;</div>
                <div className="pl-6">title: string;</div>
                <div className="pl-6">verdict: 'PASS' | 'FAIL';</div>
                <div className="pl-3">&#125;</div>
                <div className="text-neutral-400">```</div>
              </div>

              <div>
                <span className="text-neutral-500 block mb-1">Quote / Change-bar:</span>
                <div>&gt; "Erase non-data ink. White page, centered column."</div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Tables & Lists */}
        <div className="space-y-4">
          <div className="border-b border-neutral-800 pb-2">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wide flex items-center gap-2">
              <Table className="w-4 h-4" />
              <span>4. Tables &amp; Lists Syntax</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Tables render with clean horizontal rules, no vertical border noise, and optimal data-ink density.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 font-mono text-xs text-neutral-200 space-y-2">
              <div className="text-neutral-500 font-semibold mb-1">Table Syntax:</div>
              <div>| Persona | Objective | Pain Point |</div>
              <div>| :--- | :--- | :--- |</div>
              <div>| Assessor | Fast verify | Missing data |</div>
              <div>| Developer | Clear specs | Ambiguous code |</div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 font-mono text-xs text-neutral-200 space-y-2">
              <div className="text-neutral-500 font-semibold mb-1">Lists Syntax:</div>
              <div>- Bullet item one</div>
              <div>- Bullet item two</div>
              <div className="pt-1">1. Numbered item step 1</div>
              <div>2. Numbered item step 2</div>
              <div className="pt-1">- [x] Completed task</div>
              <div>- [ ] Unfinished task</div>
            </div>
          </div>
        </div>

        {/* 5. Drag & Drop Images & File Bundling */}
        <div className="space-y-4">
          <div className="border-b border-neutral-800 pb-2">
            <h2 className="text-lg font-bold text-white uppercase font-mono tracking-wide flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span>5. Image Syntax &amp; images/ Folder</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Drag images into the editor to automatically bundle them into the relative <code className="text-white font-mono">images/</code> directory.
            </p>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 font-mono text-xs text-neutral-200 space-y-2">
            <div>![Caption / Alt Description](images/my-sketch.png)</div>
            <p className="text-neutral-400 text-[11px] pt-1 font-sans">
              Images render with responsive width and optional caption. In exported ZIP archives, images reside in the <code className="text-white font-mono">images/</code> folder next to <code className="text-white font-mono">index.html</code>.
            </p>
          </div>
        </div>

        {/* 6. In-Place Preview Editing Tip */}
        <div className="bg-neutral-950 border border-neutral-700 rounded-lg p-5">
          <h3 className="text-sm font-bold text-white uppercase font-mono mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Interactive Editing Tip</span>
          </h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            You do not have to write everything in Markdown! You can click anywhere directly inside the <strong>Preview pane</strong> (headings, paragraphs, lists, header title, or project) and type your edits directly. All modifications are converted to Markdown and synchronized with the editor on the left.
          </p>
        </div>

        {/* 7. Save & Local Storage Shortcut */}
        <div className="bg-neutral-950 border border-neutral-700 rounded-lg p-5">
          <h3 className="text-sm font-bold text-white uppercase font-mono mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Save Shortcut (Ctrl+S / Cmd+S)</span>
          </h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Press <code className="bg-neutral-800 text-white px-1.5 py-0.5 rounded font-mono text-[11px]">Ctrl+S</code> (or <code className="bg-neutral-800 text-white px-1.5 py-0.5 rounded font-mono text-[11px]">Cmd+S</code> on Mac) anywhere in the editor or preview to instantly persist your document to browser local storage and export your portable submission ZIP package (<code className="text-white font-mono">report.md</code>, <code className="text-white font-mono">index.html</code>, and <code className="text-white font-mono">images/</code>).
          </p>
        </div>

      </div>
    </div>
  );
};
