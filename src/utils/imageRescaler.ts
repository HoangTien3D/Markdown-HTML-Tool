/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface RescaleResult {
  dataUrl: string;
  size: number;
  width: number;
  height: number;
}

/**
 * Loads a dataUrl into an Image element and extracts natural dimensions
 */
export function getImageDimensions(dataUrl: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || img.width || 800;
      const height = img.naturalHeight || img.height || 600;
      resolve({ width, height });
    };
    img.onerror = () => {
      // Fallback default for SVGs or corrupted images
      resolve({ width: 800, height: 600 });
    };
    img.src = dataUrl;
  });
}

/**
 * Rescales an image using an offscreen HTML Canvas
 * Directly alters pixel dimensions of the image asset dataUrl.
 * Does not modify markdown, CSS, or HTML markup.
 */
export function rescaleImage(
  dataUrl: string,
  targetWidth: number,
  targetHeight: number,
  mimeType: string = 'image/png',
  quality: number = 0.92
): Promise<RescaleResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = Math.max(1, Math.round(targetWidth));
      const h = Math.max(1, Math.round(targetHeight));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      // High quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // If converting from or to JPEG, fill white background to avoid black background on transparent PNGs
      if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }

      ctx.drawImage(img, 0, 0, w, h);

      // Determine output mime type
      const outputMime = (mimeType === 'image/svg+xml' || !mimeType) ? 'image/png' : mimeType;
      const newDataUrl = canvas.toDataURL(outputMime, quality);

      // Calculate byte size from base64 string
      const base64Index = newDataUrl.indexOf('base64,');
      const base64Str = base64Index !== -1 ? newDataUrl.slice(base64Index + 7) : '';
      const size = Math.round((base64Str.length * 3) / 4);

      resolve({
        dataUrl: newDataUrl,
        size,
        width: w,
        height: h
      });
    };

    img.onerror = (err) => {
      reject(err);
    };

    img.src = dataUrl;
  });
}
