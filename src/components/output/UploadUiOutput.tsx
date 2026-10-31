import { useEffect, useState } from 'react';
import type { StandardPresetName, UploadedImageData } from 'img-upload-kit';
import { AnimatedImage, SingleImageUpload } from 'img-upload-kit/react';
import confetti from 'canvas-confetti';
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

  return (
    <div
      className={`space-y-3 rounded-xl border-2 border-dashed p-3 transition ${
        completed >= 1 ? 'border-accent/40' : 'border-line'
      }`}
    >
      <p className="font-mono text-[11px] text-muted">
        {completed >= 1 ? '<ImageUploadProvider endpoint="/api/upload">' : 'Output appears as the code is written'}
      </p>

      {completed >= 2 && (
        <motion.div {...reveal}>
          <SingleImageUpload
            value={clearedForDrop ? null : image}
            preset={preset}
            label="Cover image"
            showQualitySelector={false}
            onChange={handleFieldChange}
          />
        </motion.div>
      )}

      {completed >= 3 && (
        <motion.div {...reveal} className="rounded-lg bg-[#0b0f19] p-3 font-mono text-[11px] leading-5">
          <span className="text-slate-500">// onChange(photo)</span>
          <br />
          <span className="text-sky-300">{'{'} </span>
          <span className="text-slate-300">
            format: <span className="text-amber-300">"{image.format}"</span>, size:{' '}
            <span className="text-amber-300">{image.size}</span>, blurColor:{' '}
            <span className="text-amber-300">"{image.blurColor}"</span>
            {image.altText ? (
              <>
                , altText: <span className="text-amber-300">"{image.altText.slice(0, 24)}"</span>
              </>
            ) : null}
          </span>
          <span className="text-sky-300"> {'}'}</span>
        </motion.div>
      )}

      {completed >= 4 && !clearedForDrop && (
        <motion.div
          {...reveal}
          className="relative aspect-[16/9] overflow-hidden rounded-lg border border-line"
          style={{ backgroundColor: image.blurColor }}
        >
          <AnimatedImage
            key={`${image.url}-${image.blurColor}-${objectFit}`}
            image={image}
            objectFit={objectFit}
            showShimmer
            fill
            loading="eager"
          />
        </motion.div>
      )}
    </div>
  );
}
