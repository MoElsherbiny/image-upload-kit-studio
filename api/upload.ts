import type { IncomingMessage, ServerResponse } from 'node:http';
import { createImageUploader, createUploadHttpHandler } from 'img-upload-kit/server';
import { createStorageAdapter } from 'img-upload-kit/storage';

interface CapturedAsset {
  buffer: Buffer;
  contentType: string;
}

async function readBodyBuffer(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Stateless Serverless Function (`POST /api/upload` & `DELETE /api/upload`) for Vercel deployments.
 * Runs real Sharp AVIF/WebP optimization, size-guarding, WebP LQIP, BlurHash & 4-edge color extraction,
 * returning the optimized binary inline so stateless deployments render instant same-origin Blob URLs.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const method = req.method || 'GET';
  if (method !== 'POST' && method !== 'DELETE') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let latestCapture: CapturedAsset | null = null;

  const storage = createStorageAdapter({
    async upload({ bucket, path: filePath, data, contentType }) {
      const cleanPath = filePath.replace(/^\/+/, '');
      latestCapture = {
        buffer: Buffer.from(data),
        contentType,
      };
      return {
        bucket,
        path: cleanPath,
        url: `/uploads/${bucket}/${cleanPath}`,
      };
    },
    async delete() {
      // Stateless ephemeral storage — client revokes Blob URL locally.
    },
    getPublicUrl(bucket, filePath) {
      return `/uploads/${bucket}/${filePath.replace(/^\/+/, '')}`;
    },
    async deleteByUrl() {
      return true;
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

  try {
    const rawUrl = req.url || '/api/upload';
    const host = req.headers.host || 'upload-kit.buildwithsherbo.com';
    const proto = req.headers['x-forwarded-proto'] === 'http' ? 'http' : 'https';
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) headers.set(k, v.join(', '));
      else if (typeof v === 'string') headers.set(k, v);
    }

    const bodyBuf = method === 'POST' ? await readBodyBuffer(req) : undefined;
    const webReq = new Request(`${proto}://${host}${rawUrl}`, {
      method,
      headers,
      body: bodyBuf ? new Uint8Array(bodyBuf) : undefined,
    });

    const webRes = method === 'POST' ? await httpHandler.POST(webReq) : await httpHandler.DELETE(webReq);
    res.statusCode = webRes.status;
    res.setHeader('Content-Type', 'application/json');

    if (method === 'POST' && webRes.ok && latestCapture) {
      const payload = (await webRes.json()) as Record<string, unknown>;
      const captured: CapturedAsset = latestCapture;
      res.end(
        JSON.stringify({
          ...payload,
          inlineBase64: captured.buffer.toString('base64'),
          mimeType: captured.contentType,
        }),
      );
      return;
    }

    const text = await webRes.text();
    res.end(text);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Unexpected upload error',
      }),
    );
  }
}
