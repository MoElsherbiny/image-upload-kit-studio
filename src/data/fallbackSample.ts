import type { UploadedImageData } from '@mo-elsherbiny/image-upload-kit';

const svgLqip = (a: string, b: string, c: string) =>
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 20"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23${a}"/><stop offset="50%" stop-color="%23${b}"/><stop offset="100%" stop-color="%23${c}"/></linearGradient></defs><rect width="32" height="20" fill="url(%23g)"/></svg>`;

/**
 * Shown only until the dev server's `/api/samples` responds with real
 * Sharp-processed images (usually < 1s). Keeps the first paint meaningful.
 */
export const FALLBACK_SAMPLE: UploadedImageData = {
  url: svgLqip('1E1B4B', '3B0764', '0F172A'),
  blurDataUrl: svgLqip('1E1B4B', '3B0764', '0F172A'),
  blurColor: '#312E81',
  blurHash: 'L5550^9F00~q_3IU4n%M00Rj~qof',
  altText: 'Loading sample image',
  width: 1280,
  height: 720,
  format: 'avif',
  size: 14_000,
  originalSize: 160_000,
  contentHash: 'fallback000000',
  preset: 'hero',
  uploadedAt: new Date(0).toISOString(),
} as UploadedImageData;
