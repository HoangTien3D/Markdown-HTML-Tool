import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Plus, 
  Trash2,
  Sliders
} from 'lucide-react';
import { Frontmatter } from '../types';

interface FrontmatterEditorProps {
  frontmatter: Frontmatter;
  onChange: (updated: Frontmatter) => void;
  onClose: () => void;
}

export const FrontmatterEditor: React.FC<FrontmatterEditorProps> = ({
  frontmatter,
  onChange,
  onClose,
}) => {
  const [newKey, setNewKey] = React.useState('');
  const [newVal, setNewVal] = React.useState('');
  const [showAddCustom, setShowAddCustom] = React.useState(false);

  const updateField = (field: keyof Frontmatter, value: any) => {
    onChange({
      ...frontmatter,
      [field]: value
    });
  };

  const handleSetCurrentDate = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    updateField('date', formatted);
  };

  const handleAddCustomKey = () => {
    if (!newKey.trim()) return;
    onChange({
      ...frontmatter,
      [newKey.trim()]: newVal.trim()
    });
    setNewKey('');
    setNewVal('');
    setShowAddCustom(false);
  };

  const handleRemoveCustomKey = (key: string) => {
    const updated = { ...frontmatter };
    delete updated[key];
    onChange(updated);
  };

  const [showLegacy, setShowLegacy] = useState(false);

  const standardKeys = [
    'title',
    'subtitle',
    'name',
    'student_number',
    'date',
    'report_number',
    'abstract',
    'project',
    'project_dir',
    'subject',
    'operator',
    'follows',
    'tldr',
    'tests_total',
    'qa_verdict'
  ];

  const customKeys = Object.keys(frontmatter).filter(k => !standardKeys.includes(k));

  return (
    <div className="w-80 bg-black border-l border-neutral-800 text-white flex flex-col h-full shrink-0 shadow-2xl z-20 overflow-hidden font-sans">
      {/* Header */}
      <div className="h-12 border-b border-neutral-800 px-4 flex items-center justify-between shrink-0 bg-neutral-950">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-white" />
          <span className="font-bold text-xs tracking-wider uppercase text-white font-mono">
            Frontmatter Inspector
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Title */}
        <div>
          <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
            title
          </label>
          <input
            type="text"
            value={frontmatter.title || ''}
            onChange={(e) => updateField('title', e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-700 focus:border-white rounded px-2.5 py-1.5 text-white font-medium focus:outline-none"
            placeholder="Document Title"
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
            subtitle
          </label>
          <input
            type="text"
            value={frontmatter.subtitle !== undefined ? frontmatter.subtitle : (frontmatter.project || '')}
            onChange={(e) => updateField('subtitle', e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-700 focus:border-white rounded px-2.5 py-1.5 text-white focus:outline-none"
            placeholder="A worked example showing every block..."
          />
        </div>

        {/* Name (Author) & Student Number */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
              name
            </label>
            <input
              type="text"
              value={frontmatter.name !== undefined ? frontmatter.name : (frontmatter.operator || '')}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-white rounded px-2 py-1.5 text-white focus:outline-none"
              placeholder="A Great Student"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
              student_number
            </label>
            <input
              type="text"
              value={frontmatter.student_number || ''}
              onChange={(e) => updateField('student_number', e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-white rounded px-2 py-1.5 text-white font-mono focus:outline-none"
              placeholder="s1234567"
            />
          </div>
        </div>

        {/* Report Number & Date */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
              report_number
            </label>
            <input
              type="number"
              value={frontmatter.report_number ?? 1}
              onChange={(e) => updateField('report_number', parseInt(e.target.value, 10) || 0)}
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-white rounded px-2 py-1.5 text-white font-mono focus:outline-none"
              placeholder="1"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono uppercase text-neutral-400">
                date
              </label>
              <button
                onClick={handleSetCurrentDate}
                className="text-[10px] text-white hover:underline flex items-center gap-1 font-mono cursor-pointer"
                title="Set to current date and time"
              >
                <Clock className="w-3 h-3" /> Now
              </button>
            </div>
            <input
              type="text"
              value={frontmatter.date || ''}
              onChange={(e) => updateField('date', e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 focus:border-white rounded px-2 py-1.5 text-white font-mono text-[11px] focus:outline-none"
              placeholder="2026-11-11 09:00:00"
            />
          </div>
        </div>

        {/* Abstract */}
        <div>
          <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
            abstract (Rendered First Section)
          </label>
          <textarea
            rows={4}
            value={frontmatter.abstract !== undefined ? frontmatter.abstract : (frontmatter.tldr || '')}
            onChange={(e) => updateField('abstract', e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-700 focus:border-white rounded px-2.5 py-1.5 text-white text-xs leading-relaxed resize-none focus:outline-none font-sans"
            placeholder="Three sentences summarizing the document..."
          />
        </div>

        {/* Collapsible Legacy / Advanced Fields */}
        <div className="border-t border-neutral-800 pt-2">
          <button
            type="button"
            onClick={() => setShowLegacy(!showLegacy)}
            className="w-full text-left py-1 text-[11px] font-mono uppercase text-neutral-400 hover:text-white flex items-center justify-between cursor-pointer"
          >
            <span>{showLegacy ? 'Hide Secondary Fields' : 'Show Secondary Fields'}</span>
            <span className="text-neutral-500 text-xs">{showLegacy ? '▲' : '▼'}</span>
          </button>

          {showLegacy && (
            <div className="space-y-3 mt-2 pt-2 border-t border-neutral-900">
              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                  project (Eyebrow Fallback)
                </label>
                <input
                  type="text"
                  value={frontmatter.project || ''}
                  onChange={(e) => updateField('project', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                  project_dir
                </label>
                <input
                  type="text"
                  value={frontmatter.project_dir || ''}
                  onChange={(e) => updateField('project_dir', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono text-[10px] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                  subject
                </label>
                <input
                  type="text"
                  value={frontmatter.subject || ''}
                  onChange={(e) => updateField('subject', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                    follows
                  </label>
                  <input
                    type="text"
                    value={frontmatter.follows || ''}
                    onChange={(e) => updateField('follows', e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono text-[10px] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                    tests_total
                  </label>
                  <input
                    type="number"
                    value={frontmatter.tests_total ?? ''}
                    onChange={(e) => updateField('tests_total', parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-white font-mono text-[10px] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                  qa_verdict
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['PASS', 'FAIL', 'PENDING'] as const).map((status) => {
                    const active = String(frontmatter.qa_verdict || '').toUpperCase() === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateField('qa_verdict', active ? undefined : status)}
                        className={`py-1 px-1 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-white text-black border-white'
                            : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                        }`}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Custom Metadata Fields */}
        {customKeys.length > 0 && (
          <div className="border-t border-neutral-800 pt-3 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
              Custom Attributes
            </span>
            {customKeys.map(k => (
              <div key={k} className="flex items-center gap-1.5 bg-neutral-950 p-1.5 rounded border border-neutral-800">
                <span className="font-mono text-[10px] text-neutral-400 w-24 truncate">{k}:</span>
                <input
                  type="text"
                  value={frontmatter[k] || ''}
                  onChange={(e) => updateField(k, e.target.value)}
                  className="flex-1 bg-transparent text-[11px] text-white focus:outline-none"
                />
                <button
                  onClick={() => handleRemoveCustomKey(k)}
                  className="text-neutral-500 hover:text-white p-0.5 cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add custom key */}
        {!showAddCustom ? (
          <button
            onClick={() => setShowAddCustom(true)}
            className="w-full py-1.5 border border-dashed border-neutral-700 hover:border-white rounded text-neutral-400 hover:text-white text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer font-mono"
          >
            <Plus className="w-3 h-3" /> Add Custom Field
          </button>
        ) : (
          <div className="bg-neutral-950 p-2.5 rounded border border-neutral-700 space-y-2">
            <input
              type="text"
              placeholder="key_name"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-full bg-black border border-neutral-700 focus:border-white rounded px-2 py-1 text-[11px] font-mono text-white focus:outline-none"
            />
            <input
              type="text"
              placeholder="value"
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              className="w-full bg-black border border-neutral-700 focus:border-white rounded px-2 py-1 text-[11px] text-white focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddCustomKey}
                className="flex-1 bg-white hover:bg-neutral-200 text-black rounded py-1 text-[10px] font-bold cursor-pointer"
              >
                Add Field
              </button>
              <button
                onClick={() => setShowAddCustom(false)}
                className="px-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded py-1 text-[10px] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
