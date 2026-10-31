import { useEffect, useMemo, useState } from 'react';
import type { UploadedImageData } from '@mo-elsherbiny/image-upload-kit';
import { decodeBlurHashToDataURL } from '@mo-elsherbiny/image-upload-kit';
import { AnimatedImage, createFallbackBlurSvg } from '@mo-elsherbiny/image-upload-kit/react';
import { Code2, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { PlaceholderMode } from '../../data/codeScenarios';

export type NetworkDelay = 0 | 800 | 2000 | 'hold';

interface ImageStageOutputProps {
  image: UploadedImageData;
  completed: number;
  duration: number;
  showShimmer: boolean;
  placeholderMode: PlaceholderMode;
  networkDelay: NetworkDelay;
  replayKey: number;
}

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.45 } };

/** Live output for the <AnimatedImage /> example — one visual layer per written step. */
export function ImageStageOutput(props: ImageStageOutputProps) {
  const { image, completed, duration, showShimmer, placeholderMode, networkDelay, replayKey } = props;
  const [arrived, setArrived] = useState(networkDelay === 0);

  // Simulate the full-size image arriving over the network once step 4 is written.
  useEffect(() => {
    if (completed < 4) return setArrived(false);
    if (networkDelay === 'hold') return setArrived(false);
    if (networkDelay === 0) return setArrived(true);
    setArrived(false);
    const timer = window.setTimeout(() => setArrived(true), networkDelay);
    return () => window.clearTimeout(timer);
  }, [completed, networkDelay, replayKey, image.url]);

  const sources = useMemo(() => {
    const lqip = placeholderMode === 'auto' || placeholderMode === 'lqip' ? image.blurDataUrl : null;
    const hash = placeholderMode === 'auto' || placeholderMode === 'blurhash' ? image.blurHash ?? null : null;
    const preview =
      lqip ?? (hash ? decodeBlurHashToDataURL(hash, 32, 32) : null) ?? createFallbackBlurSvg(image.blurColor);
    return { lqip, hash, preview };
  }, [image, placeholderMode]);

  return (
    <div
      className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-line"
      style={{ backgroundColor: completed >= 1 ? image.blurColor : undefined }}
    >
      {completed === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-line-strong bg-surface-2 text-muted">
          <Code2 className="h-6 w-6" />
          <span className="text-sm">Output appears as the code is written</span>
        </div>
      )}

      <AnimatePresence>
        {completed >= 2 && !(completed === 4 && arrived) && (
          <motion.img key="ph" {...fade} src={sources.preview} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl" />
        )}
        {completed >= 3 && showShimmer && !(completed === 4 && arrived) && (
          <motion.div key="sh" {...fade} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="animate-sweep absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {completed === 4 && arrived && (
        <div key={`${image.url}-${replayKey}-${placeholderMode}`} className="absolute inset-0">
          <AnimatedImage
            src={image.url}
            alt={image.altText ?? 'Optimized image'}
            blurDataUrl={sources.lqip}
            blurHash={sources.hash}
            blurColor={image.blurColor}
            animationDuration={duration}
            showShimmer={showShimmer}
            fill
            loading="eager"
          />
        </div>
      )}

      {completed === 4 && !arrived && (
        <div className="absolute bottom-3 start-3 flex items-center gap-2 rounded-lg bg-black/55 px-2.5 py-1.5 font-mono text-[11px] text-white backdrop-blur">
          <Loader2 className="h-3 w-3 animate-spin" />
          {networkDelay === 'hold' ? 'Holding on the placeholder' : 'Downloading full image…'}
        </div>
      )}
    </div>
  );
}
