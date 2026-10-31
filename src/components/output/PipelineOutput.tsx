import { STANDARD_PRESETS, type StandardPresetName, type UploadedImageData } from 'img-upload-kit';
import { FileJson, HardDrive, Settings2, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { savingsPercent } from '../../data/codeScenarios';

interface PipelineOutputProps {
  image: UploadedImageData;
  completed: number;
  preset: StandardPresetName;
}

const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

/** Live output for the upload route example — the server pipeline, step by step. */
export function PipelineOutput({ image, completed, preset }: PipelineOutputProps) {
  const config = STANDARD_PRESETS[preset];
  const original = image.originalSize ?? image.size;
  const ratio = Math.max(0.04, Math.min(1, image.size / Math.max(1, original)));
  const savings = savingsPercent(image);
  const displayUrl =
    image.url.startsWith('blob:') && image.storagePath
      ? `/uploads/${image.bucket ? `${image.bucket}/` : ''}${image.storagePath}`
      : image.url;

  const payload = {
    url: displayUrl.length > 44 ? `${displayUrl.slice(0, 42)}…` : displayUrl,
    format: image.format,
    width: image.width,
    height: image.height,
    size: image.size,
    originalSize: original,
    blurColor: image.blurColor,
    blurHash: image.blurHash ?? null,
    blurDataUrl: image.blurDataUrl ? `${image.blurDataUrl.slice(0, 26)}…` : '',
  };

  const rows = [
    {
      icon: HardDrive,
      title: 'Storage adapter',
      body: (
        <p className="font-mono text-xs text-muted">
          pluggable adapter → <span className="text-fg-2">S3 / R2 / Supabase / LocalFS</span>
        </p>
      ),
    },
    {
      icon: Settings2,
      title: `Preset "${preset}"`,
      body: (
        <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
          {[
            `max ${config.maxDimensions?.width ?? '—'}×${config.maxDimensions?.height ?? '—'}`,
            `≤ ${config.maxSizeMB ?? '—'} MB`,
            `quality ${config.quality ?? '—'}`,
          ].map((chip) => (
            <span key={chip} className="rounded-md bg-surface-3 px-2 py-0.5 text-fg-2">
              {chip}
            </span>
          ))}
        </div>
      ),
    },
    {
      icon: Zap,
      title: `Sharp → ${image.format.toUpperCase()}  ${savings > 0 ? `(−${savings}%)` : '(size-guarded)'}`,
      body: (
        <div className="space-y-1.5 font-mono text-[11px] text-muted">
          <Bar label="original" value={kb(original)} width={1} tone="bg-slate-500/60" show={completed >= 3} />
          <Bar label="optimized" value={kb(image.size)} width={ratio} tone="bg-accent" show={completed >= 3} />
        </div>
      ),
    },
    {
      icon: FileJson,
      title: '200 OK · UploadedImageData',
      body: (
        <pre className="max-h-40 overflow-auto rounded-lg bg-[#0b0f19] p-3 font-mono text-[11px] leading-5 text-sky-200">
          {JSON.stringify(payload, null, 2)}
        </pre>
      ),
    },
  ];

  return (
    <ol className="space-y-2.5">
      {rows.map((row, i) => {
        const done = completed > i;
        const Icon = row.icon;
        return (
          <motion.li
            key={row.title}
            animate={{ opacity: done ? 1 : 0.35, y: done ? 0 : 4 }}
            transition={{ duration: 0.35 }}
            className={`flex gap-3 rounded-xl border p-3 ${done ? 'border-accent/40 bg-surface' : 'border-dashed border-line bg-transparent'}`}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${done ? 'bg-accent/15 text-accent' : 'bg-surface-2 text-muted'}`}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-sm font-semibold text-fg">{row.title}</p>
              {done && row.body}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}

function Bar({ label, value, width, tone, show }: { label: string; value: string; width: number; tone: string; show: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
        <motion.div
          className={`h-full rounded-full ${tone}`}
          initial={{ width: 0 }}
          animate={{ width: show ? `${width * 100}%` : 0 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        />
      </div>
      <span className="w-16 shrink-0 text-end text-fg-2">{value}</span>
    </div>
  );
}
