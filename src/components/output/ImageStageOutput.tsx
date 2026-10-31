import { useEffect, useMemo, useState } from 'react';
import { decodeBlurHashToDataURL, type UploadedImageData } from 'img-upload-kit';
import { AnimatedImage, createFallbackBlurSvg } from 'img-upload-kit/react';
import { Code2, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ImageFitMode, PlaceholderMode } from '../../data/codeScenarios';

export type NetworkDelay = 0 | 800 | 2000 | 'hold';

interface ImageStageOutputProps {
  image: UploadedImageData;
  completed: number;
  duration: number;
  showShimmer: boolean;
  placeholderMode: PlaceholderMode;
  objectFit: ImageFitMode;
  networkDelay: NetworkDelay;
  replayKey: number;
}

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.4 } };

/** Live output for the <AnimatedImage /> example — one visual layer per written step. */
export function ImageStageOutput(props: ImageStageOutputProps) {
  const { image, completed, duration, showShimmer, placeholderMode, objectFit, networkDelay, replayKey } = props;
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
    const lqip =
      image.blurDataUrl && (placeholderMode === 'auto' || placeholderMode === 'lqip') ? image.blurDataUrl : null;
    const hash =
      image.blurHash && (placeholderMode === 'auto' || placeholderMode === 'blurhash') ? image.blurHash : null;
    const preview =
      lqip ?? (hash ? decodeBlurHashToDataURL(hash, 32, 32) : null) ?? createFallbackBlurSvg(image.blurColor);
    return { lqip, hash, preview };
  }, [image, placeholderMode]);

  const placeholderFitCls = objectFit === 'contain' ? 'object-contain blur-xl' : 'scale-110 object-cover blur-xl';

  return (
    <div
      className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-line transition-colors duration-500"
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
          <motion.img
            key={`ph-${image.url}-${placeholderMode}-${image.blurColor}`}
            {...fade}
            src={sources.preview}
            alt=""
            aria-hidden
            className={`absolute inset-0 h-full w-full ${placeholderFitCls}`}
          />
        )}
        {completed >= 3 && showShimmer && !(completed === 4 && arrived) && (
          <motion.div key="sh" {...fade} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="animate-sweep absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {completed === 4 && arrived && (
        <div key={`${image.url}-${replayKey}-${placeholderMode}-${objectFit}`} className="absolute inset-0">
          <AnimatedImage
            src={image.url}
            alt={image.altText?.trim() || 'Optimized landscape'}
            blurDataUrl={sources.lqip}
            blurHash={sources.hash}
            blurColor={image.blurColor}
            animationDuration={duration}
            showShimmer={showShimmer}
            objectFit={objectFit}
            fill
            loading="eager"
          />
          <span className="pointer-events-none absolute bottom-2.5 end-2.5 rounded-md bg-black/55 px-2 py-0.5 font-mono text-[10px] text-white/90 backdrop-blur">
            {image.width}×{image.height} · {image.format.toUpperCase()}
          </span>
        </div>
      )}

      {completed === 4 && !arrived && (
        <div className="absolute bottom-3 start-3 flex items-center gap-2 rounded-lg bg-black/60 px-2.5 py-1.5 font-mono text-[11px] text-white backdrop-blur">
          <Loader2 className="h-3 w-3 animate-spin" />
          {networkDelay === 'hold' ? 'Holding on placeholder layer' : 'Simulating network download…'}
        </div>
      )}
    </div>
  );
}
