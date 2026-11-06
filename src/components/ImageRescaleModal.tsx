/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Maximize2, 
  Link2, 
  Link2Off, 
  RotateCcw, 
  Check, 
  Sliders, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { ProjectAsset } from '../types';
import { rescaleImage, getImageDimensions } from '../utils/imageRescaler';

interface ImageRescaleModalProps {
  asset: ProjectAsset;
  onSave: (updatedAsset: ProjectAsset) => void;
  onClose: () => void;
}

export const ImageRescaleModal: React.FC<ImageRescaleModalProps> = ({
  asset,
  onSave,
  onClose,
}) => {
  // Original / source image dimensions
  const [naturalWidth, setNaturalWidth] = useState<number>(asset.originalWidth || asset.width || 800);
  const [naturalHeight, setNaturalHeight] = useState<number>(asset.originalHeight || asset.height || 600);
  const [isLoadingDimensions, setIsLoadingDimensions] = useState(true);

  // Target dimensions state
  const [targetWidth, setTargetWidth] = useState<number>(asset.width || 800);
  const [targetHeight, setTargetHeight] = useState<number>(asset.height || 600);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [quality, setQuality] = useState(0.92);
  const [format, setFormat] = useState<string>(() => {
    if (asset.type === 'image/jpeg' || asset.name.endsWith('.jpg') || asset.name.endsWith('.jpeg')) {
      return 'image/jpeg';
    }
    if (asset.type === 'image/webp' || asset.name.endsWith('.webp')) {
      return 'image/webp';
    }
    return 'image/png';
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch true natural dimensions of the source image upon mounting
  useEffect(() => {
    let isMounted = true;
    const sourceDataUrl = asset.originalDataUrl || asset.dataUrl;

    getImageDimensions(sourceDataUrl)
      .then(({ width, height }) => {
        if (!isMounted) return;
        setNaturalWidth(width);
        setNaturalHeight(height);
        setTargetWidth(asset.width || width);
        setTargetHeight(asset.height || height);
        setIsLoadingDimensions(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsLoadingDimensions(false);
      });

    return () => {
      isMounted = false;
    };
  }, [asset]);

  // Handle Width change with aspect ratio lock
  const handleWidthChange = (val: number) => {
    const newWidth = Math.max(1, Math.round(val));
    setTargetWidth(newWidth);
    if (lockAspectRatio && naturalWidth > 0) {
      const ratio = naturalHeight / naturalWidth;
      setTargetHeight(Math.max(1, Math.round(newWidth * ratio)));
    }
  };

  // Handle Height change with aspect ratio lock
  const handleHeightChange = (val: number) => {
    const newHeight = Math.max(1, Math.round(val));
    setTargetHeight(newHeight);
    if (lockAspectRatio && naturalHeight > 0) {
      const ratio = naturalWidth / naturalHeight;
      setTargetWidth(Math.max(1, Math.round(newHeight * ratio)));
    }
  };

  // Preset percentage scale
  const handlePresetScale = (percent: number) => {
    const scale = percent / 100;
    const newW = Math.max(1, Math.round(naturalWidth * scale));
    const newH = Math.max(1, Math.round(naturalHeight * scale));
    setTargetWidth(newW);
    setTargetHeight(newH);
  };

  // Preset max width fit
  const handleFitWidth = (maxW: number) => {
    if (naturalWidth <= maxW) {
      setTargetWidth(naturalWidth);
      setTargetHeight(naturalHeight);
      return;
    }
    const ratio = naturalHeight / naturalWidth;
    setTargetWidth(maxW);
    setTargetHeight(Math.max(1, Math.round(maxW * ratio)));
  };

  // Reset to original dimensions
  const handleResetToOriginal = () => {
    setTargetWidth(naturalWidth);
    setTargetHeight(naturalHeight);
  };

  // Calculate current scale percentage
  const currentScalePercent = useMemo(() => {
    if (naturalWidth === 0) return 100;
    return Math.round((targetWidth / naturalWidth) * 100);
  }, [targetWidth, naturalWidth]);

  // Estimate new file size factor
  const estimatedSizeRatio = useMemo(() => {
    if (naturalWidth === 0 || naturalHeight === 0) return 1;
    const areaRatio = (targetWidth * targetHeight) / (naturalWidth * naturalHeight);
    return areaRatio;
  }, [targetWidth, targetHeight, naturalWidth, naturalHeight]);

  const originalByteSize = asset.originalSize || asset.size;
  const estimatedNewBytes = Math.round(originalByteSize * estimatedSizeRatio);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Execute Canvas Rescale
  const handleApplyRescale = async () => {
    try {
      setIsProcessing(true);
      const sourceDataUrl = asset.originalDataUrl || asset.dataUrl;

      // Rescale pixels using canvas
      const result = await rescaleImage(
        sourceDataUrl,
        targetWidth,
        targetHeight,
        format,
        quality
      );

      // Save updated asset, preserving original source for future rescaling without multi-generation loss
      const updatedAsset: ProjectAsset = {
        ...asset,
        dataUrl: result.dataUrl,
        size: result.size,
        type: format,
        width: result.width,
        height: result.height,
        originalDataUrl: asset.originalDataUrl || asset.dataUrl,
        originalWidth: asset.originalWidth || naturalWidth,
        originalHeight: asset.originalHeight || naturalHeight,
        originalSize: asset.originalSize || asset.size,
      };

      onSave(updatedAsset);
      onClose();
    } catch (err) {
      console.error('Failed to rescale image:', err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-150">
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg max-w-xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white">
        {/* Header */}
        <div className="h-12 px-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-black">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-white" />
            <span className="font-bold text-xs uppercase tracking-wider font-mono">
              Rescale Image Asset
            </span>
            <span className="text-xs text-neutral-400 font-mono truncate max-w-[200px]">
              ({asset.name})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Image Preview & Current vs Target Stats */}
          <div className="bg-black border border-neutral-800 rounded-md p-3 flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-32 h-32 rounded bg-neutral-900 border border-neutral-800 overflow-hidden flex items-center justify-center shrink-0 relative">
              <img
                src={asset.originalDataUrl || asset.dataUrl}
                alt={asset.name}
                className="max-w-full max-h-full object-contain"
              />
              <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[9px] font-mono text-neutral-300">
                {currentScalePercent}%
              </div>
            </div>

            <div className="flex-1 w-full space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-neutral-800/80 pb-1.5">
                <span className="text-neutral-400">Original Resolution:</span>
                <span className="text-white font-bold">
                  {isLoadingDimensions ? 'Loading...' : `${naturalWidth} × ${naturalHeight} px`}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-800/80 pb-1.5">
                <span className="text-neutral-400">Target Resolution:</span>
                <span className="text-white font-bold flex items-center gap-1.5">
                  <span>{targetWidth} × {targetHeight} px</span>
                  {currentScalePercent !== 100 && (
                    <span className="text-[10px] bg-neutral-800 px-1.5 py-0.2 rounded text-neutral-200">
                      ({currentScalePercent}%)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-800/80 pb-1.5">
                <span className="text-neutral-400">Original File Size:</span>
                <span className="text-neutral-300">{formatSize(originalByteSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Est. New File Size:</span>
                <span className={estimatedNewBytes < originalByteSize ? 'text-emerald-400 font-bold' : 'text-neutral-200 font-bold'}>
                  ~{formatSize(estimatedNewBytes)}
                  {estimatedNewBytes < originalByteSize && (
                    <span className="text-[10px] ml-1">
                      (↓ {Math.round((1 - estimatedSizeRatio) * 100)}%)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Scale Presets
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {[25, 50, 75, 100, 125, 150, 200].map((pct) => (
                <button
                  key={pct}
                  onClick={() => handlePresetScale(pct)}
                  className={`py-1.5 px-2 rounded text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    currentScalePercent === pct
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-600 hover:text-white'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Fit Width Presets */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Fit Width Constraints
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { label: 'Thumb (480px)', w: 480 },
                { label: 'Medium (800px)', w: 800 },
                { label: 'Standard (1200px)', w: 1200 },
                { label: 'Full (1600px)', w: 1600 },
              ].map(({ label, w }) => (
                <button
                  key={w}
                  onClick={() => handleFitWidth(w)}
                  className={`py-1.5 px-2 rounded text-xs font-mono border transition-colors cursor-pointer ${
                    targetWidth === w
                      ? 'bg-white text-black font-bold border-white'
                      : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-600 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Dimension Inputs */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-md p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Custom Dimensions
              </span>
              <button
                onClick={() => setLockAspectRatio(!lockAspectRatio)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                  lockAspectRatio
                    ? 'bg-neutral-800 text-white border-neutral-600'
                    : 'bg-neutral-950 text-neutral-500 border-neutral-800'
                }`}
                title={lockAspectRatio ? 'Aspect ratio locked' : 'Aspect ratio free'}
              >
                {lockAspectRatio ? <Link2 className="w-3 h-3 text-white" /> : <Link2Off className="w-3 h-3" />}
                <span>{lockAspectRatio ? 'Locked Ratio' : 'Unlocked'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 mb-1">
                  Width (px)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={targetWidth}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)}
                  className="w-full bg-black border border-neutral-700 rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 mb-1">
                  Height (px)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={targetHeight}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)}
                  className="w-full bg-black border border-neutral-700 rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-white"
                />
              </div>
            </div>

            {/* Slider */}
            <div>
              <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                <span>Scale Ratio</span>
                <span className="text-white font-bold">{currentScalePercent}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="250"
                value={currentScalePercent}
                onChange={(e) => handlePresetScale(parseInt(e.target.value))}
                className="w-full accent-white cursor-pointer"
              />
            </div>
          </div>

          {/* Format and Quality Controls */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 mb-1">
                Output Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full bg-black border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-white cursor-pointer"
              >
                <option value="image/png">PNG (Lossless, Transparency)</option>
                <option value="image/jpeg">JPEG (Compressed)</option>
                <option value="image/webp">WebP (Modern, Compact)</option>
              </select>
            </div>

            {format !== 'image/png' ? (
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 mb-1">
                  Quality ({Math.round(quality * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.4"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full mt-1.5 accent-white cursor-pointer"
                />
              </div>
            ) : (
              <div className="flex items-center text-[11px] text-neutral-400 font-mono pt-4">
                <span>Lossless PNG preservation</span>
              </div>
            )}
          </div>

          {/* Informational Callout */}
          <div className="p-2.5 bg-neutral-900/60 border border-neutral-800 rounded text-[11px] text-neutral-400 font-mono flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
            <div>
              Rescaling modifies the underlying image asset pixels directly. The Markdown link (<code className="text-white bg-black px-1 py-0.5 border border-neutral-800">{asset.path}</code>), HTML, and CSS are completely untouched.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="h-14 px-4 border-t border-neutral-800 flex items-center justify-between shrink-0 bg-black">
          <button
            onClick={handleResetToOriginal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 rounded text-xs font-mono transition-colors cursor-pointer"
            title="Reset dimensions back to original"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Original</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-transparent hover:bg-neutral-900 text-neutral-400 hover:text-white rounded text-xs font-mono transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyRescale}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-black hover:bg-neutral-200 font-bold rounded text-xs font-mono transition-colors cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Rescaling...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-black" />
                  <span>Apply Rescale</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
