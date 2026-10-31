import type { StandardPresetName, UploadedImageData } from '@mo-elsherbiny/image-upload-kit';
import { AnimatedImage, SingleImageUpload } from '@mo-elsherbiny/image-upload-kit/react';
import { motion } from 'motion/react';

interface UploadUiOutputProps {
  image: UploadedImageData;
  completed: number;
  preset: StandardPresetName;
  onUploaded: (image: UploadedImageData) => void;
}

const reveal = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

/**
 * Live output for the <SingleImageUpload /> example. The field rendered at
 * step 2 is the real component — uploads here feed the whole page.
 * (The surrounding <ImageUploadProvider> lives in App.)
 */
export function UploadUiOutput({ image, completed, preset, onUploaded }: UploadUiOutputProps) {
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
            preset={preset}
            label="Cover image"
            showQualitySelector={false}
            onChange={(data) => data && onUploaded(data)}
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
            <span className="text-amber-300">"{image.blurColor}"</span>, …
          </span>
          <span className="text-sky-300"> {'}'}</span>
        </motion.div>
      )}

      {completed >= 4 && (
        <motion.div {...reveal} className="relative aspect-[16/9] overflow-hidden rounded-lg">
          <AnimatedImage key={image.url} image={image} showShimmer fill loading="eager" />
        </motion.div>
      )}
    </div>
  );
}
