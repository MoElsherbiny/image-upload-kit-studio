import fs from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StandardPresetName, UploadedImageData } from 'img-upload-kit';
import {
  createImageUploader,
  createUploadHttpHandler,
} from 'img-upload-kit/server';
import {
  createStorageAdapter,
  type StorageFileEntry,
} from 'img-upload-kit/storage';
import type { Connect, Plugin } from 'vite';

interface StoredAsset {
  buffer: Buffer;
  contentType: string;
  bucket: string;
  path: string;
  createdAt: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANDSCAPES_DIR = path.resolve(__dirname, '..', 'assets', 'landscapes');

const LANDSCAPE_SPECS: Array<{
  file: string;
  slug: string;
  preset: StandardPresetName;
  altText: string;
}> = [
  {
    file: 'misty-nordic-fjord.jpg',
    slug: 'glacial-mountain-peaks',
    preset: 'cover',
    altText: 'Snow-capped alpine mountain range overlooking evergreen valley',
  },
  {
    file: 'golden-desert-dunes.jpg',
    slug: 'sahara-golden-dunes',
    preset: 'hero',
    altText: 'Warm golden desert sand dunes under twilight sky',
  },
  {
    file: 'coastal-sunset-cliffs.jpg',
    slug: 'pacific-sunset-shore',
    preset: 'card',
    altText: 'Golden sunset reflection across turquoise ocean waves and sandy shore',
  },
  {
    file: 'alpine-emerald-lake.jpg',
    slug: 'yosemite-dawn-valley',
    preset: 'cover',
    altText: 'Yosemite valley granite cliffs and misty pines reflected in dawn river',
  },
];

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
    async upload({ bucket, path: filePath, data, contentType }) {
      const cleanPath = filePath.replace(/^\/+/, '');
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
    async delete(bucket, filePath) {
      const cleanPath = filePath.replace(/^\/+/, '');
      store.delete(`${bucket}/${cleanPath}`);
    },
    getPublicUrl(bucket, filePath) {
      return `/uploads/${bucket}/${filePath.replace(/^\/+/, '')}`;
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
        const results: UploadedImageData[] = [];
        for (const item of LANDSCAPE_SPECS) {
          const jpgBuffer = await fs.readFile(path.join(LANDSCAPES_DIR, item.file));
          const uploaded = await uploader.uploadImage(
            { buffer: jpgBuffer, name: item.file, type: 'image/jpeg' },
            {
              preset: item.preset,
              customFilename: item.slug,
              altText: item.altText,
              includeBlurHash: true,
            },
          );
          results.push(uploaded);
        }
        return results;
      })();
    }
    return samplesPromise;
  }

  function registerMiddlewares(middlewares: Connect.Server) {
    middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
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
  }

  return {
    name: 'img-upload-kit-demo-api',
    configureServer(server) {
      registerMiddlewares(server.middlewares);
    },
    configurePreviewServer(server) {
      registerMiddlewares(server.middlewares);
    },
  };
}
