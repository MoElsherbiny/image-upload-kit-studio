import { useEffect, useState } from 'react';
import type { StandardPresetName, UploadedImageData } from 'img-upload-kit';
import { AnimatedImage, SingleImageUpload } from 'img-upload-kit/react';
import confetti from 'canvas-confetti';
import { Camera, ClipboardPaste, FileCode2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import type { ImageFitMode } from '../../data/codeScenarios';
import { savingsPercent } from '../../data/codeScenarios';
import { getUploadedFileLabel } from '../../lib/demoUploader';

interface UploadUiOutputProps {
  image: UploadedImageData;
  completed: number;
  preset: StandardPresetName;
  objectFit: ImageFitMode;
  onUploaded: (image: UploadedImageData, meta?: { label?: string; preset?: StandardPresetName }) => void;
}

const reveal = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

/**
 * Live output for the <SingleImageUpload /> example.
 * Controlled via `value` so selecting a landscape OR uploading/editing blur color & alt text
 * stays synchronized across the entire studio.
 */
export function UploadUiOutput({ image, completed, preset, objectFit, onUploaded }: UploadUiOutputProps) {
  const [clearedForDrop, setClearedForDrop] = useState(false);

  // Sync back whenever the user selects another image from SourcePicker.
  useEffect(() => {
    setClearedForDrop(false);
  }, [image.url]);

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
            preset={preset}
            label="Cover image"
            helperText="Drop a file, click to browse, or press Ctrl+V to paste from clipboard"
            showQualitySelector={false}
            onChange={handleFieldChange}
          />
        </motion.div>
      )}

      {completed >= 3 && (
        <motion.div {...reveal} className="space-y-1.5 rounded-lg bg-[#0b0f19] p-3 font-mono text-[11px] leading-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>// onChange(photo) + form hidden input</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
              <FileCode2 className="h-3 w-3" /> &lt;input type=&quot;hidden&quot; name=&quot;coverImage&quot;&gt;
            </span>
          </div>
          <div>
            <span className="text-sky-300">{'{'} </span>
            <span className="text-slate-300">
              format: <span className="text-amber-300">&quot;{image.format}&quot;</span>, size:{' '}
              <span className="text-amber-300">{image.size}</span>, blurColor:{' '}
              <span className="text-amber-300">&quot;{image.blurColor}&quot;</span>
              {image.variants?.length ? (
                <>
                  , variants: <span className="text-emerald-300">[{image.variants.map((v) => `${v.width}w`).join(', ')}]</span>
                </>
              ) : null}
              {image.altText ? (
                <>
                  , altText: <span className="text-amber-300">&quot;{image.altText.slice(0, 22)}&quot;</span>
                </>
              ) : null}
            </span>
            <span className="text-sky-300"> {'}'}</span>
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
