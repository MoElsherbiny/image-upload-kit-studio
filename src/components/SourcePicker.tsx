import type { StandardPresetName, UploadedImageData } from '@mo-elsherbiny/image-upload-kit';
import { useSingleUpload } from '@mo-elsherbiny/image-upload-kit/headless';
import confetti from 'canvas-confetti';
import { Check, ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { savingsPercent } from '../data/codeScenarios';

interface SourcePickerProps {
  samples: UploadedImageData[];
  activeImage: UploadedImageData;
  onSelect: (image: UploadedImageData) => void;
  preset: StandardPresetName;
}

const SAMPLE_NAMES = ['Neon horizon', 'Alpine sunset', 'Emerald portrait'];

/**
 * Lets the user choose which image drives the whole page: a built-in sample,
 * or their own upload (built with the headless `useSingleUpload` hook — Tier 4).
 */
export function SourcePicker({ samples, activeImage, onSelect, preset }: SourcePickerProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-sm font-semibold text-fg">Source image</h3>
        <p className="text-xs text-muted">Everything on this page updates for the image you pick.</p>
      </div>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1" role="radiogroup" aria-label="Source image">
        {samples.map((sample, i) => {
          const selected = sample.url === activeImage.url;
          return (
            <button
              key={sample.url}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(sample)}
              className={`group relative flex shrink-0 items-center gap-2.5 rounded-xl border p-1.5 pe-3 text-start transition ${
                selected ? 'border-accent bg-accent/10 ring-2 ring-accent/20' : 'border-line bg-surface hover:border-line-strong'
              }`}
            >
              <img src={sample.url} alt="" className="h-10 w-14 rounded-lg object-cover" />
              <span className="flex flex-col">
                <span className="text-xs font-semibold text-fg">{SAMPLE_NAMES[i] ?? `Your upload ${i - 2}`}</span>
                <span className="font-mono text-[10px] text-muted">
                  {sample.format.toUpperCase()} · −{savingsPercent(sample)}%
                </span>
              </span>
              {selected && <Check className="absolute -end-1.5 -top-1.5 h-4 w-4 rounded-full bg-accent p-0.5 text-canvas" />}
            </button>
          );
        })}
        <UploadTile preset={preset} onUploaded={onSelect} />
      </div>
    </div>
  );
}

function UploadTile({ preset, onUploaded }: { preset: StandardPresetName; onUploaded: (img: UploadedImageData) => void }) {
  const upload = useSingleUpload({
    preset,
    requireAltText: false,
    onChange: (data) => {
      if (!data) return;
      void confetti({ particleCount: 80, spread: 70, origin: { y: 0.35 }, colors: ['#38bdf8', '#3b82f6', '#a5f3fc'] });
      toast.success(`Optimized to ${data.format.toUpperCase()} — ${savingsPercent(data)}% smaller`, {
        description: `Ambient color ${data.blurColor} · BlurHash & LQIP generated`,
      });
      onUploaded(data);
    },
  });

  return (
    <div
      {...upload.getDropzoneProps({ 'aria-label': 'Upload your own image' })}
      className={`relative flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl border border-dashed p-1.5 pe-3 transition ${
        upload.isDragging ? 'border-accent bg-accent/10' : 'border-line-strong bg-surface hover:border-accent'
      }`}
    >
      <input {...upload.getInputProps()} />
      <span className="flex h-10 w-14 items-center justify-center rounded-lg bg-surface-2 text-accent">
        {upload.isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
      </span>
      <span className="flex flex-col">
        <span className="text-xs font-semibold text-fg">
          {upload.isUploading ? `Optimizing… ${Math.round(upload.progress)}%` : 'Upload your own'}
        </span>
        <span className="max-w-[10rem] truncate font-mono text-[10px] text-muted">
          {upload.error || 'drop or click · JPG PNG WebP'}
        </span>
      </span>
    </div>
  );
}
