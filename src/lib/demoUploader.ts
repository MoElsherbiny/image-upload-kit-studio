import {
  STANDARD_PRESETS,
  type StandardPresetName,
  type UploadedImageData,
  validateImageFile,
} from 'img-upload-kit';
import type { CustomUploaderFn } from 'img-upload-kit/react';

interface ServerUploadResponse extends UploadedImageData {
  inlineBase64?: string;
  mimeType?: string;
  error?: string;
}

const activeBlobUrls = new Set<string>();
const uploadedLabels = new Map<string, string>();

export function getUploadedFileLabel(url: string): string | undefined {
  return uploadedLabels.get(url);
}

export function humanizeFilename(filename: string): string {
  const stem = filename
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!stem) return 'Uploaded photo';
  return stem.charAt(0).toUpperCase() + stem.slice(1);
}

function base64ToBlobUrl(base64: string, mimeType: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  activeBlobUrls.add(url);
  return url;
}

function extractPerimeterColor(ctx: CanvasRenderingContext2D, w: number, h: number): string {
  const { data } = ctx.getImageData(0, 0, w, h);
  const bandX = Math.max(1, Math.round(w * 0.12));
  const bandY = Math.max(1, Math.round(h * 0.12));
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let count = 0;

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const isEdge = x < bandX || x >= w - bandX || y < bandY || y >= h - bandY;
      if (!isEdge) continue;
      const idx = (y * w + x) * 4;
      if (data[idx + 3] < 16) continue;
      rSum += data[idx];
      gSum += data[idx + 1];
      bSum += data[idx + 2];
      count += 1;
    }
  }

  if (count === 0) return '#1e293b';
  const toHex = (n: number) => Math.round(n / count).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(rSum)}${toHex(gSum)}${toHex(bSum)}`;
}

async function clientFallbackOptimize(
  file: File,
  presetName: StandardPresetName,
  altText: string,
): Promise<UploadedImageData> {
  const preset = STANDARD_PRESETS[presetName] ?? STANDARD_PRESETS.hero;
  const err = validateImageFile(file, preset.maxSizeMB ?? 15, 'en');
  if (err) throw new Error(err);

  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not decode selected image'));
      el.src = bitmapUrl;
    });

    const maxW = preset.maxDimensions?.width ?? 2560;
    const maxH = preset.maxDimensions?.height ?? 1440;
    const scale = Math.min(1, maxW / Math.max(1, img.naturalWidth), maxH / Math.max(1, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(img, 0, 0, width, height);

    const quality = (preset.quality ?? 88) / 100;
    const webpBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', quality));
    const useOriginal = !webpBlob || (scale === 1 && webpBlob.size >= file.size);
    const finalBlob = useOriginal ? file : webpBlob;
    const format = useOriginal
      ? ((file.type.split('/')[1]?.replace('jpeg', 'jpeg') || 'webp') as UploadedImageData['format'])
      : 'webp';

    const lqipCanvas = document.createElement('canvas');
    const lqipW = 28;
    const lqipH = Math.max(16, Math.round((height / width) * lqipW));
    lqipCanvas.width = lqipW;
    lqipCanvas.height = lqipH;
    const lqipCtx = lqipCanvas.getContext('2d');
    lqipCtx?.drawImage(img, 0, 0, lqipW, lqipH);
    const blurColor = lqipCtx ? extractPerimeterColor(lqipCtx, lqipW, lqipH) : '#1e293b';
    const blurDataUrl = lqipCanvas.toDataURL('image/webp', 0.65);

    const finalUrl = URL.createObjectURL(finalBlob);
    activeBlobUrls.add(finalUrl);

    return {
      url: finalUrl,
      storagePath: `${preset.folder ?? 'uploads'}/${file.name.replace(/\.[^.]+$/, '')}.${format}`,
      bucket: 'studio',
      blurDataUrl,
      blurColor,
      altText,
      width,
      height,
      format,
      size: finalBlob.size,
      originalSize: file.size,
      contentHash: `local-${Date.now().toString(36)}`,
      uploadedAt: new Date().toISOString(),
    };
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

/**
 * Universal demo uploader:
 * 1. Sends FormData with real XHR progress to `/api/upload` (Sharp in Vite dev/preview & Vercel Serverless).
 * 2. Hydrates inline base64 payloads from stateless Vercel functions into fast same-origin `blob:` URLs.
 * 3. Falls back to client Canvas WebP + LQIP + 4-edge extraction only if deployed to a static-only host (404/405).
 */
export const demoUploader: CustomUploaderFn = async (file, options) => {
  const presetName = ((options.preset as StandardPresetName) || 'hero') as StandardPresetName;
  const fileLabel = humanizeFilename(file.name);
  const resolvedAlt = fileLabel || options.altText?.trim() || 'Uploaded photo';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('preset', presetName);
  formData.append('altText', resolvedAlt);
  formData.append('includeBlurHash', 'true');
  if (options.quality) formData.append('quality', String(options.quality));
  if (options.outputFormat) formData.append('outputFormat', options.outputFormat);
  if (options.folder) formData.append('folder', options.folder);
  if (options.bucket) formData.append('bucket', options.bucket);

  const xhrResult = await new Promise<
    { ok: true; data: ServerUploadResponse } | { ok: false; status: number; message: string }
  >((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        options.onUploadProgress?.(Math.min(95, Math.round((evt.loaded / evt.total) * 95)));
      }
    };

    xhr.onload = () => {
      try {
        const parsed = JSON.parse(xhr.responseText || '{}') as ServerUploadResponse;
        if (xhr.status >= 200 && xhr.status < 300 && parsed.url) {
          resolve({ ok: true, data: parsed });
          return;
        }
        resolve({
          ok: false,
          status: xhr.status,
          message: parsed.error || `Upload failed (HTTP ${xhr.status})`,
        });
      } catch {
        resolve({
          ok: false,
          status: xhr.status,
          message: `Upload endpoint returned HTTP ${xhr.status}`,
        });
      }
    };

    xhr.onerror = () => resolve({ ok: false, status: 0, message: 'Network error' });
    xhr.send(formData);
  });

  if (xhrResult.ok) {
    options.onUploadProgress?.(100);
    const { inlineBase64, mimeType, ...cleanData } = xhrResult.data;
    const finalUrl = inlineBase64
      ? base64ToBlobUrl(inlineBase64, mimeType || `image/${cleanData.format}`)
      : cleanData.url;
    uploadedLabels.set(finalUrl, resolvedAlt);
    return {
      ...cleanData,
      url: finalUrl,
      altText: cleanData.altText?.trim() || resolvedAlt,
    };
  }

  // Real validation error (400/413/415/422) from Sharp server — surface directly to the user!
  if (xhrResult.status >= 400 && xhrResult.status !== 404 && xhrResult.status !== 405) {
    throw new Error(xhrResult.message);
  }

  // Static-only host fallback (no Node backend available)
  options.onUploadProgress?.(60);
  const fallback = await clientFallbackOptimize(file, presetName, resolvedAlt);
  uploadedLabels.set(fallback.url, resolvedAlt);
  options.onUploadProgress?.(100);
  return fallback;
};
