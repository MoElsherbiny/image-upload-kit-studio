import type { IncomingMessage, ServerResponse } from 'node:http';
import type { UploadedImageData } from '@mo-elsherbiny/image-upload-kit';
import {
  createImageUploader,
  createUploadHttpHandler,
} from '@mo-elsherbiny/image-upload-kit/server';
import {
  createStorageAdapter,
  type StorageFileEntry,
} from '@mo-elsherbiny/image-upload-kit/storage';
import sharp from 'sharp';
import type { Plugin } from 'vite';

interface StoredAsset {
  buffer: Buffer;
  contentType: string;
  bucket: string;
  path: string;
  createdAt: string;
}

const CYBERPUNK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f0728"/>
      <stop offset="45%" stop-color="#3b0764"/>
      <stop offset="78%" stop-color="#be185d"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <radialGradient id="sun" cx="50%" cy="52%" r="28%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="55%" stop-color="#f43f5e"/>
      <stop offset="100%" stop-color="#f43f5e" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#sky)"/>
  <circle cx="640" cy="370" r="190" fill="url(#sun)"/>
  <polygon points="0,520 220,350 430,470 680,310 920,450 1120,340 1280,460 1280,720 0,720" fill="#1e1b4b" opacity="0.88"/>
  <polygon points="0,580 180,440 410,540 640,400 890,530 1140,430 1280,530 1280,720 0,720" fill="#090d16"/>
  <g stroke="#22d3ee" stroke-width="2" opacity="0.45">
    <line x1="0" y1="580" x2="1280" y2="580"/>
    <line x1="0" y1="620" x2="1280" y2="620"/>
    <line x1="0" y1="665" x2="1280" y2="665"/>
    <line x1="640" y1="540" x2="120" y2="720"/>
    <line x1="640" y1="540" x2="380" y2="720"/>
    <line x1="640" y1="540" x2="640" y2="720"/>
    <line x1="640" y1="540" x2="900" y2="720"/>
    <line x1="640" y1="540" x2="1160" y2="720"/>
  </g>
</svg>`;

const ALPINE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="sunset" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#311042"/>
      <stop offset="38%" stop-color="#9a3412"/>
      <stop offset="72%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fde68a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#sunset)"/>
  <circle cx="820" cy="260" r="110" fill="#fef08a" opacity="0.9"/>
  <polygon points="0,560 260,270 520,510 820,220 1200,520 1200,800 0,800" fill="#431407" opacity="0.82"/>
  <polygon points="0,640 310,390 610,600 940,360 1200,590 1200,800 0,800" fill="#1c1917"/>
</svg>`;

const EMERALD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
  <defs>
    <linearGradient id="em" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#022c22"/>
      <stop offset="50%" stop-color="#0d9488"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
  </defs>
  <rect width="900" height="900" fill="url(#em)"/>
  <circle cx="450" cy="450" r="290" fill="#064e3b" opacity="0.65"/>
  <circle cx="450" cy="360" r="115" fill="#fbbf24" opacity="0.92"/>
  <path d="M240 730 C260 540 640 540 660 730 Z" fill="#f59e0b" opacity="0.85"/>
  <circle cx="310" cy="250" r="48" fill="#34d399" opacity="0.5"/>
  <circle cx="620" cy="610" r="72" fill="#2dd4bf" opacity="0.4"/>
</svg>`;

async function readBodyBuffer(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export function imageUploadKitServerPlugin(): Plugin {
  const store = new Map<string, StoredAsset>();
  let samplesPromise: Promise<UploadedImageData[]> | null = null;

  const storage = createStorageAdapter({
    async upload({ bucket, path, data, contentType }) {
      const cleanPath = path.replace(/^\/+/, '');
      const key = `${bucket}/${cleanPath}`;
      store.set(key, {
        buffer: Buffer.from(data),
        contentType,
        bucket,
        path: cleanPath,
        createdAt: new Date().toISOString(),
      });
      return {
        bucket,
        path: cleanPath,
        url: `/uploads/${key}`,
      };
    },
    async delete(bucket, path) {
      const cleanPath = path.replace(/^\/+/, '');
      store.delete(`${bucket}/${cleanPath}`);
    },
    getPublicUrl(bucket, path) {
      return `/uploads/${bucket}/${path.replace(/^\/+/, '')}`;
    },
    async list(bucket, folder): Promise<StorageFileEntry[]> {
      const prefix = folder ? `${bucket}/${folder.replace(/^\/+|\/+$/g, '')}/` : `${bucket}/`;
      const items: StorageFileEntry[] = [];
      for (const [k, v] of store.entries()) {
        if (k.startsWith(prefix)) {
          items.push({
            name: v.path,
            id: k,
            createdAt: v.createdAt,
            size: v.buffer.byteLength,
          });
        }
      }
      return items;
    },
    async deleteByUrl(url) {
      const cleanUrl = url.split(/[?#]/)[0];
      const idx = cleanUrl.indexOf('/uploads/');
      if (idx === -1) return false;
      const key = decodeURIComponent(cleanUrl.slice(idx + '/uploads/'.length));
      return store.delete(key);
    },
  });

  const uploader = createImageUploader({
    storage,
    defaultBucket: 'studio',
    includeBlurHash: true,
    concurrency: 2,
  });

  const httpHandler = createUploadHttpHandler({
    uploader,
    allowClientBucketOverride: true,
  });

  async function ensureSamples(): Promise<UploadedImageData[]> {
    if (!samplesPromise) {
      samplesPromise = (async () => {
        const specs = [
          {
            svg: CYBERPUNK_SVG,
            name: 'cyberpunk-neon-horizon.png',
            altText: 'Cyberpunk Neon Horizon — Synthwave sunset over geometric grid mountains',
            preset: 'hero' as const,
          },
          {
            svg: ALPINE_SVG,
            name: 'alpine-golden-sunset.png',
            altText: 'Alpine Golden Sunset — Warm amber and violet mountain peaks at dusk',
            preset: 'cover' as const,
          },
          {
            svg: EMERALD_SVG,
            name: 'emerald-studio-portrait.png',
            altText: 'Emerald Studio Portrait — Minimalist gold and teal geometric composition',
            preset: 'card' as const,
          },
        ];

        const results: UploadedImageData[] = [];
        for (const item of specs) {
          const pngBuffer = await sharp(Buffer.from(item.svg)).png({ compressionLevel: 2 }).toBuffer();
          const uploaded = await uploader.uploadImage(
            { buffer: pngBuffer, name: item.name, type: 'image/png' },
            { preset: item.preset, altText: item.altText, includeBlurHash: true },
          );
          results.push(uploaded);
        }
        return results;
      })();
    }
    return samplesPromise;
  }

  return {
    name: 'image-upload-kit-demo-api',
    configureServer(server) {
      void ensureSamples();

      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const rawUrl = req.url || '/';
        const pathname = rawUrl.split('?')[0];

        try {
          if (pathname === '/api/samples' && req.method === 'GET') {
            const samples = await ensureSamples();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ samples, storageCount: store.size }));
            return;
          }

          if (pathname.startsWith('/uploads/') && req.method === 'GET') {
            const key = decodeURIComponent(pathname.slice('/uploads/'.length));
            const item = store.get(key);
            if (!item) {
              res.statusCode = 404;
              res.end('Not found');
              return;
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', item.contentType);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.end(item.buffer);
            return;
          }

          if (pathname === '/api/upload' && (req.method === 'POST' || req.method === 'DELETE')) {
            const host = req.headers.host || 'localhost:5173';
            const fullUrl = `http://${host}${rawUrl}`;
            const headers = new Headers();
            for (const [k, v] of Object.entries(req.headers)) {
              if (Array.isArray(v)) headers.set(k, v.join(', '));
              else if (typeof v === 'string') headers.set(k, v);
            }

            const bodyBuf = req.method === 'POST' ? await readBodyBuffer(req) : undefined;
            const webReq = new Request(fullUrl, {
              method: req.method,
              headers,
              body: bodyBuf ? new Uint8Array(bodyBuf) : undefined,
            });

            const webRes =
              req.method === 'POST' ? await httpHandler.POST(webReq) : await httpHandler.DELETE(webReq);

            res.statusCode = webRes.status;
            webRes.headers.forEach((val, key) => res.setHeader(key, val));
            const arrayBuf = await webRes.arrayBuffer();
            res.end(Buffer.from(arrayBuf));
            return;
          }
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              error: err instanceof Error ? err.message : 'Unexpected server error',
            }),
          );
          return;
        }

        next();
      });
    },
  };
}
