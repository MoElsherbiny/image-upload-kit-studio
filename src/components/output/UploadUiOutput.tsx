import { useEffect, useState } from 'react';
import type { StandardPresetName, UploadedImageData } from 'img-upload-kit';
import { AnimatedImage, SingleImageUpload } from 'img-upload-kit/react';
import confetti from 'canvas-confetti';
import { ArrowLeft, ArrowRight, Camera, ClipboardPaste, FileCode2, Star, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import type { ImageFitMode, StudioPresetName } from '../../data/codeScenarios';
import { savingsPercent } from '../../data/codeScenarios';
import { LANDSCAPE_SAMPLES } from '../../data/landscapeSamples';
import { getUploadedFileLabel } from '../../lib/demoUploader';

function moveItem<T>(items: readonly T[], fromIndex: number, toIndex: number): T[] {
  if (items.length <= 1) return [...items];
  const from = Math.max(0, Math.min(items.length - 1, Math.trunc(fromIndex)));
  const to = Math.max(0, Math.min(items.length - 1, Math.trunc(toIndex)));
  if (from === to) return [...items];
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function promoteToCover<T>(items: readonly T[], index: number): T[] {
  return moveItem(items, index, 0);
}

interface UploadUiOutputProps {
  image: UploadedImageData;
  completed: number;
  preset: StudioPresetName;
  objectFit: ImageFitMode;
  onUploaded: (image: UploadedImageData, meta?: { label?: string; preset?: StudioPresetName }) => void;
}

interface GalleryItem {
  id: string;
  label: string;
  data: UploadedImageData;
}

const reveal = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

function buildInitialGallery(primary: UploadedImageData): GalleryItem[] {
  const rest = LANDSCAPE_SAMPLES.filter((s) => s.data.url !== primary.url).slice(0, 2);
  return [
    {
      id: primary.url,
      label: primary.altText?.split(' ').slice(0, 2).join(' ') || 'Primary photo',
      data: primary,
    },
    ...rest.map((s) => ({
      id: s.id,
      label: s.label,
      data: s.data,
    })),
  ];
}

/**
 * Live output for the <SingleImageUpload /> & <MultiImageUpload reorderable /> example.
 * Controlled via `value` so selecting a landscape OR uploading/editing blur color & alt text
 * stays synchronized across the entire studio.
 */
export function UploadUiOutput({ image, completed, preset, objectFit, onUploaded }: UploadUiOutputProps) {
  const [clearedForDrop, setClearedForDrop] = useState(false);
  const [gallery, setGallery] = useState<GalleryItem[]>(() => buildInitialGallery(image));

  // Sync back whenever the user selects another image from SourcePicker.
  useEffect(() => {
    setClearedForDrop(false);
    setGallery((prev) => {
      const existingIdx = prev.findIndex((g) => g.data.url === image.url);
      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          label: image.altText?.split(' ').slice(0, 2).join(' ') || copy[existingIdx].label,
          data: image,
        };
        return copy;
      }
      return buildInitialGallery(image);
    });
  }, [image]);

  const handleFieldChange = (data: UploadedImageData | null) => {
    if (!data) {
      setClearedForDrop(true);
      return;
    }
    setClearedForDrop(false);
    const isNewFile = data.url !== image.url;
    const freshFileLabel = isNewFile ? getUploadedFileLabel(data.url) : undefined;
    const normalizedData: UploadedImageData =
      isNewFile && freshFileLabel ? { ...data, altText: freshFileLabel } : data;
    if (isNewFile) {
      const savings = savingsPercent(normalizedData);
      void confetti({ particleCount: 70, spread: 65, origin: { y: 0.4 }, colors: ['#38bdf8', '#3b82f6', '#a5f3fc'] });
      toast.success(
        savings > 0
          ? `Optimized "${freshFileLabel || 'photo'}" to ${normalizedData.format.toUpperCase()} (−${savings}%)`
          : `Processed "${freshFileLabel || 'photo'}" (${normalizedData.format.toUpperCase()} · size-guarded)`,
        { description: `${normalizedData.width}×${normalizedData.height} · ambient color ${normalizedData.blurColor}` },
      );
    }
    onUploaded(normalizedData, { label: freshFileLabel || normalizedData.altText || undefined, preset });
  };

  const activeValue = clearedForDrop ? null : image;

  return (
    <div
      className={`space-y-3 rounded-xl border-2 border-dashed p-3 transition ${
        completed >= 1 ? 'border-accent/40' : 'border-line'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[11px] text-muted">
          {completed >= 1 ? '<ImageUploadProvider endpoint="/api/upload">' : 'Output appears as the code is written'}
        </p>
        {completed >= 2 && (
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
            <span className="inline-flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-accent">
              <ClipboardPaste className="h-3 w-3" /> Paste (Ctrl+V)
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 text-muted">
              <Camera className="h-3 w-3" /> capture=&quot;environment&quot;
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 text-muted">
              <XCircle className="h-3 w-3" /> Cancel / Retry
            </span>
          </div>
        )}
      </div>

      {completed >= 2 && (
        <motion.div {...reveal}>
          <SingleImageUpload
            name="coverImage"
            formValue="url"
            enablePaste
            capture="environment"
            value={activeValue}
            preset={preset as StandardPresetName}
            label="Cover image"
            helperText="Drop a file, click to browse, or press Ctrl+V to paste from clipboard"
            showQualitySelector={false}
            onChange={handleFieldChange}
          />
        </motion.div>
      )}

      {completed >= 3 && (
        <motion.div {...reveal} className="space-y-2.5 rounded-xl border border-line bg-surface-2/60 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] font-semibold text-fg-2">
              Product / Carousel Gallery Order (<code>reorderable</code> + <code>Cover</code> badge)
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400">
              <FileCode2 className="h-3 w-3" /> move(from, to) · setCover(index)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5" role="list" aria-label="Reorderable product gallery">
            {gallery.map((item, idx) => {
              const isCover = idx === 0;
              return (
                <div
                  key={item.id}
                  role="listitem"
                  className={`relative overflow-hidden rounded-lg border transition ${
                    isCover ? 'border-accent ring-1 ring-accent/40' : 'border-line'
                  }`}
                  style={{ backgroundColor: item.data.blurColor }}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <img src={item.data.url} alt={item.label} className="h-full w-full object-cover" />
                    <span
                      data-slot={isCover ? 'cover-badge' : undefined}
                      className={`absolute start-1.5 top-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold backdrop-blur ${
                        isCover ? 'bg-sky-500 text-slate-950 shadow-sm' : 'bg-black/65 text-white/90'
                      }`}
                    >
                      {isCover ? (
                        <>
                          <Star className="h-2.5 w-2.5 fill-current" /> Cover
                        </>
                      ) : (
                        `#${idx + 1}`
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1 bg-[#0b0f19]/90 px-1.5 py-1 font-mono text-[10px] text-slate-300">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        aria-label={`Move ${item.label} earlier`}
                        onClick={() => setGallery((g) => moveItem(g, idx, idx - 1))}
                        className="rounded p-0.5 hover:bg-white/15 disabled:opacity-30"
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === gallery.length - 1}
                        aria-label={`Move ${item.label} later`}
                        onClick={() => setGallery((g) => moveItem(g, idx, idx + 1))}
                        className="rounded p-0.5 hover:bg-white/15 disabled:opacity-30"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                    {!isCover ? (
                      <button
                        type="button"
                        onClick={() => setGallery((g) => promoteToCover(g, idx))}
                        className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9.5px] font-medium text-sky-300 transition hover:bg-sky-500/30"
                      >
                        Set Cover
                      </button>
                    ) : (
                      <span className="truncate text-[9.5px] text-emerald-300">Primary</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg bg-[#0b0f19] px-2.5 py-1.5 font-mono text-[10.5px] text-slate-300">
            <span className="text-slate-500">onReorder: </span>
            <span className="text-sky-300">[</span>
            {gallery.map((g, i) => (
              <span key={g.id}>
                <span className={i === 0 ? 'font-semibold text-emerald-300' : 'text-amber-200'}>
                  &quot;{g.label}
                  {i === 0 ? ' (Cover)' : ''}&quot;
                </span>
                {i < gallery.length - 1 ? ', ' : ''}
              </span>
            ))}
            <span className="text-sky-300">]</span>
          </div>
        </motion.div>
      )}

      {completed >= 4 && !clearedForDrop && (
        <motion.div
          {...reveal}
          className="relative aspect-[16/9] overflow-hidden rounded-lg border border-line"
          style={{ backgroundColor: image.blurColor }}
        >
          <AnimatedImage
            key={`${image.url}-${image.blurColor}`}
            image={image}
            objectFit={objectFit}
            className={
              objectFit === 'contain' && image.width >= image.height * 0.95
                ? '!h-[68%] my-auto !object-cover shadow-2xl'
                : undefined
            }
            priority
            showShimmer
            fill
          />
        </motion.div>
      )}
    </div>
  );
}
