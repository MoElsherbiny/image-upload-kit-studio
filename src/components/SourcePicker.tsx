import { useEffect, useRef } from 'react';
import type { StandardPresetName, UploadedImageData } from 'img-upload-kit';
import { useSingleUpload } from 'img-upload-kit/headless';
import confetti from 'canvas-confetti';
import { Check, ImagePlus, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { savingsPercent, STUDIO_PRESETS, type StudioPresetName } from '../data/codeScenarios';
import type { StudioImageEntry } from '../data/landscapeSamples';
import { humanizeFilename } from '../lib/demoUploader';

interface SourcePickerProps {
  entries: StudioImageEntry[];
  activeId: string;
  onSelect: (id: string) => void;
  onUploaded: (image: UploadedImageData, meta?: { label?: string; preset?: StudioPresetName }) => void;
  preset: StudioPresetName;
  onChangePreset: (preset: StudioPresetName) => void;
}

const PRESETS: StudioPresetName[] = [
  'hero',
  'cover',
  'card',
  'square',
  'portrait',
  'story',
  'avatar',
  'thumbnail',
  'logo',
  'original',
];

/**
 * Lets the user choose which image drives the whole studio: one of the 4 real
 * toolkit-processed landscapes, or their own uploaded photo (via Tier 4 `useSingleUpload`).
 */
export function SourcePicker({
  entries,
  activeId,
  onSelect,
  onUploaded,
  preset,
  onChangePreset,
}: SourcePickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-fg">Source landscape or custom upload</h3>
          <p className="text-xs text-muted">
            Pick a real Sharp-processed landscape or upload any photo — every metric, code token and placeholder updates live.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[11px] text-muted">Upload preset:</span>
          <div className="flex flex-wrap rounded-lg bg-surface-2 p-0.5" role="radiogroup" aria-label="Upload preset">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={preset === p}
                onClick={() => onChangePreset(p)}
                title={`${p}: max ${STUDIO_PRESETS[p]?.maxDimensions?.width ?? ''}×${STUDIO_PRESETS[p]?.maxDimensions?.height ?? ''}px`}
                className={`rounded-md px-2 py-0.5 font-mono text-[11px] transition ${
                  preset === p ? 'bg-surface text-accent shadow-sm ring-1 ring-line-strong' : 'text-muted hover:text-fg'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="no-scrollbar -mx-1 flex items-center gap-2.5 overflow-x-auto px-1 py-1" role="radiogroup" aria-label="Source image">
        <UploadTile preset={preset} onUploaded={onUploaded} />

        {entries.map((entry) => {
          const selected = entry.id === activeId;
          const savings = savingsPercent(entry.data);
          return (
            <button
              key={entry.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(entry.id)}
              className={`group relative flex shrink-0 items-center gap-2.5 rounded-xl border p-1.5 pe-3 text-start transition ${
                selected ? 'border-accent bg-accent/10 ring-2 ring-accent/20' : 'border-line bg-surface hover:border-line-strong'
              }`}
            >
              <span
                className="flex h-11 w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10"
                style={{ backgroundColor: entry.data.blurColor }}
              >
                <img
                  src={entry.data.url}
                  alt=""
                  className={`h-full w-full ${
                    entry.data.height > entry.data.width * 0.95 ? 'object-contain' : 'object-cover'
                  }`}
                />
              </span>
              <span className="flex flex-col">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-fg">
                  <span className="max-w-[8.5rem] truncate">{entry.label}</span>
                  {entry.isUserUpload && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-accent/15 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-accent">
                      <Sparkles className="h-2.5 w-2.5" /> Yours
                    </span>
                  )}
                </span>
                <span className="font-mono text-[10px] text-muted">
                  {entry.data.format.toUpperCase()} · {savings > 0 ? `−${savings}%` : 'Guarded'} · {entry.data.width}×{entry.data.height}
                </span>
              </span>
              {selected && <Check className="absolute -end-1.5 -top-1.5 h-4 w-4 rounded-full bg-accent p-0.5 text-canvas" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UploadTile({
  preset,
  onUploaded,
}: {
  preset: StudioPresetName;
  onUploaded: (img: UploadedImageData, meta?: { label?: string; preset?: StudioPresetName }) => void;
}) {
  const lastFileNameRef = useRef<string>('');
  const lastToastErrorRef = useRef<string>('');
  const presetConfig = STUDIO_PRESETS[preset];

  const upload = useSingleUpload({
    preset: preset as StandardPresetName,
    requireAltText: false,
    onChange: (data) => {
      if (!data) return;
      const savings = savingsPercent(data);
      const label = lastFileNameRef.current ? humanizeFilename(lastFileNameRef.current) : data.altText || 'Your upload';
      void confetti({ particleCount: 75, spread: 68, origin: { y: 0.35 }, colors: ['#38bdf8', '#3b82f6', '#a5f3fc'] });
      toast.success(
        savings > 0
          ? `Optimized "${label}" to ${data.format.toUpperCase()} (−${savings}%)`
          : `Processed "${label}" (${data.format.toUpperCase()} · size-guarded)`,
        {
          description: `${data.width}×${data.height} · 4-edge color ${data.blurColor} · LQIP & BlurHash ready`,
        },
      );
      onUploaded(data, { label, preset });
      lastFileNameRef.current = '';
      // Reset headless controller so the user can immediately upload another (or the exact same) file.
      queueMicrotask(() => upload.remove());
    },
  });

  useEffect(() => {
    if (upload.error && upload.error !== lastToastErrorRef.current) {
      lastToastErrorRef.current = upload.error;
      toast.error('Could not upload image', { description: upload.error });
    } else if (!upload.error) {
      lastToastErrorRef.current = '';
    }
  }, [upload.error]);

  const inputProps = upload.getInputProps();

  return (
    <div
      {...upload.getDropzoneProps({ 'aria-label': 'Upload your own image' })}
      className={`relative flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl border border-dashed p-1.5 pe-3.5 transition ${
        upload.isDragging
          ? 'border-accent bg-accent/15 ring-2 ring-accent/30'
          : upload.error
            ? 'border-rose-500/70 bg-rose-500/5 hover:border-rose-400'
            : 'border-accent/50 bg-accent/5 hover:border-accent hover:bg-accent/10'
      }`}
    >
      <input
        {...inputProps}
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) lastFileNameRef.current = picked.name;
          inputProps.onChange?.(e);
        }}
      />
      <span className="flex h-11 w-14 items-center justify-center rounded-lg bg-accent/15 text-accent">
        {upload.isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
      </span>
      <span className="flex flex-col">
        <span className="text-xs font-semibold text-fg">
          {upload.isUploading ? `Optimizing… ${Math.round(upload.progress)}%` : 'Upload your own'}
        </span>
        <span className="max-w-[11.5rem] truncate font-mono text-[10px] text-muted">
          {upload.error || `preset "${preset}" · ≤${presetConfig?.maxSizeMB ?? 15}MB`}
        </span>
      </span>
    </div>
  );
}
