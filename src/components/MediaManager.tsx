import React from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Copy, 
  Plus, 
  Check, 
  FileImage,
  Maximize2
} from 'lucide-react';
import { ProjectAsset } from '../types';
import { ImageRescaleModal } from './ImageRescaleModal';

interface MediaManagerProps {
  assets: ProjectAsset[];
  onAddAssets: (files: File[]) => void;
  onRemoveAsset: (id: string) => void;
  onUpdateAsset: (updatedAsset: ProjectAsset) => void;
  onInsertMarkdown: (snippet: string) => void;
  onClose: () => void;
}

export const MediaManager: React.FC<MediaManagerProps> = ({
  assets,
  onAddAssets,
  onRemoveAsset,
  onUpdateAsset,
  onInsertMarkdown,
  onClose,
}) => {
  const [dragActive, setDragActive] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [rescalingAsset, setRescalingAsset] = React.useState<ProjectAsset | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddAssets(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddAssets(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const copyPath = (asset: ProjectAsset) => {
    navigator.clipboard.writeText(asset.path);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-84 bg-black border-l border-neutral-800 text-white flex flex-col h-full shrink-0 shadow-2xl z-20 overflow-hidden font-sans">
      {/* Header */}
      <div className="h-12 border-b border-neutral-800 px-4 flex items-center justify-between shrink-0 bg-neutral-950">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-white" />
          <span className="font-bold text-xs tracking-wider uppercase text-white font-mono">
            images/ directory ({assets.length})
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Close Media Manager"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 border-b border-neutral-800 bg-neutral-950/60">
        <p className="text-[11px] text-neutral-400 leading-snug">
          Dropped images are bundled into the <code className="text-white font-mono bg-neutral-900 px-1 py-0.5 border border-neutral-700">images/</code> folder during export.
        </p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div className="p-3">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded p-4 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-white bg-neutral-900 scale-[0.99]'
              : 'border-neutral-700 hover:border-white bg-neutral-950 hover:bg-neutral-900'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          <Upload className={`w-5 h-5 mx-auto mb-1.5 transition-colors ${dragActive ? 'text-white' : 'text-neutral-400'}`} />
          <div className="text-xs font-bold text-white font-mono">Drop images here</div>
          <div className="text-[10px] text-neutral-400 mt-0.5 font-mono">or click to browse</div>
        </div>
      </div>

      {/* Assets List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2.5">
        {assets.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-xs font-mono">
            <FileImage className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No images yet.
          </div>
        ) : (
          assets.map((asset) => (
            <div
              key={asset.id}
              className="bg-neutral-950 border border-neutral-800 rounded p-2.5 flex flex-col gap-2 hover:border-neutral-600 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded bg-black border border-neutral-700 overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src={asset.dataUrl}
                    alt={asset.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-white truncate" title={asset.name}>
                    {asset.name}
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span>{formatSize(asset.size)}</span>
                    {asset.width && asset.height && (
                      <>
                        <span>&bull;</span>
                        <span className="text-neutral-300">{asset.width}×{asset.height}px</span>
                      </>
                    )}
                    <span>&bull;</span>
                    <span className="text-white truncate max-w-[110px]" title={asset.path}>{asset.path}</span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => onRemoveAsset(asset.id)}
                  className="p-1 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                  title="Remove Image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-800 text-[11px] font-mono">
                <button
                  onClick={() => onInsertMarkdown(`![${asset.name}](${asset.path})\n`)}
                  className="flex-1 py-1 px-1.5 bg-neutral-900 hover:bg-white hover:text-black border border-neutral-700 text-white rounded flex items-center justify-center gap-1 font-bold transition-colors cursor-pointer"
                  title="Insert markdown image syntax"
                >
                  <Plus className="w-3 h-3" /> Insert
                </button>

                <button
                  onClick={() => setRescalingAsset(asset)}
                  className="py-1 px-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white rounded flex items-center gap-1 transition-colors cursor-pointer"
                  title="Rescale image pixel resolution"
                >
                  <Maximize2 className="w-3 h-3 text-neutral-300" />
                  <span className="text-[10px]">Rescale</span>
                </button>

                <button
                  onClick={() => copyPath(asset)}
                  className="py-1 px-2 bg-black hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copy path"
                >
                  {copiedId === asset.id ? (
                    <>
                      <Check className="w-3 h-3 text-white" />
                      <span className="text-[10px] text-white">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="text-[10px]">Path</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rescale Modal */}
      {rescalingAsset && (
        <ImageRescaleModal
          asset={rescalingAsset}
          onSave={(updated) => {
            onUpdateAsset(updated);
            setRescalingAsset(null);
          }}
          onClose={() => setRescalingAsset(null)}
        />
      )}
    </div>
  );
};
