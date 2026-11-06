import { useEffect, useMemo, useState } from 'react';
import { decodeBlurHashToDataURL, type UploadedImageData } from 'img-upload-kit';
import { AnimatedImage, createFallbackBlurSvg } from 'img-upload-kit/react';
import { AlertTriangle, CheckCircle2, Code2, Layers, Loader2, RotateCcw, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type {
  ColorPlaceholderMode,
  ImageFitMode,
  PlaceholderMode,
  RevealScaleMode,
  StudioAspectRatio,
} from '../../data/codeScenarios';

export type NetworkDelay = 0 | 800 | 2000 | 'hold';

interface ImageStageOutputProps {
  image: UploadedImageData;
  completed: number;
  duration: number;
  showShimmer: boolean;
  placeholderMode: PlaceholderMode;
  objectFit: ImageFitMode;
  revealScale: RevealScaleMode;
  colorPlaceholder: ColorPlaceholderMode;
  priority: boolean;
  simulateError: boolean;
  aspectRatio?: StudioAspectRatio;
  onClearErrorSimulation: () => void;
  networkDelay: NetworkDelay;
  replayKey: number;
}

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.4 } };

const ASPECT_FRAME_CLASSES: Record<StudioAspectRatio, string> = {
  '16:10': 'h-full w-full',
  '1:1': 'aspect-square h-full max-w-full rounded-xl border border-white/15 shadow-2xl',
  '4:5': 'aspect-[4/5] h-full max-w-full rounded-xl border border-white/15 shadow-2xl',
  '9:16': 'aspect-[9/16] h-full max-w-full rounded-xl border border-white/15 shadow-2xl',
};

const ASPECT_LABELS: Record<StudioAspectRatio, string> = {
  '16:10': '16:10',
  '1:1': '1:1 Square',
  '4:5': '4:5 Portrait',
  '9:16': '9:16 Story',
};

/** Live output for the <AnimatedImage /> example — one visual layer per written step. */
export function ImageStageOutput(props: ImageStageOutputProps) {
  const {
    image,
    completed,
    duration,
    showShimmer,
    placeholderMode,
    objectFit,
    revealScale,
    colorPlaceholder,
    priority,
    simulateError,
    aspectRatio = '16:10',
    onClearErrorSimulation,
    networkDelay,
    replayKey,
  } = props;
  const [arrived, setArrived] = useState(networkDelay === 0);

  // Simulate the full-size image arriving over the network once step 4 is written.
  useEffect(() => {
    if (completed < 4) return setArrived(false);
    if (simulateError) return setArrived(true);
    if (networkDelay === 'hold') return setArrived(false);
    if (networkDelay === 0) return setArrived(true);
    setArrived(false);
    const timer = window.setTimeout(() => setArrived(true), networkDelay);
    return () => window.clearTimeout(timer);
  }, [completed, networkDelay, replayKey, image.url, simulateError]);

  const sources = useMemo(() => {
    const lqip =
      image.blurDataUrl && (placeholderMode === 'auto' || placeholderMode === 'lqip') ? image.blurDataUrl : null;
    const hash =
      image.blurHash && (placeholderMode === 'auto' || placeholderMode === 'blurhash') ? image.blurHash : null;
    const colorOnlySvg = colorPlaceholder === 'gradient' ? createFallbackBlurSvg(image.blurColor) : null;
    const preview = lqip ?? (hash ? decodeBlurHashToDataURL(hash, 32, 32) : null) ?? colorOnlySvg;
    return { lqip, hash, preview };
  }, [image, placeholderMode, colorPlaceholder]);

  const isContain = objectFit === 'contain';
  const isLandscape = image.width >= image.height * 0.95;
  // For landscape images inside a 16:10 stage, constrain the sharp image height in contain mode
  // so the top and bottom letterbox bars clearly expose <AnimatedImage />'s generated blur backdrop.
  const containImgCls =
    isContain && isLandscape && aspectRatio === '16:10'
      ? '!h-[68%] my-auto !object-cover shadow-2xl'
      : undefined;

  const variantWidthsLabel = useMemo(() => {
    if (!image.variants?.length) return null;
    const widths = [...image.variants.map((v) => `${v.width}w`), `${image.width}w`];
    return widths.join(' · ');
  }, [image.variants, image.width]);

  const placeholderTag =
    placeholderMode === 'color'
      ? `color (${colorPlaceholder})`
      : placeholderMode === 'auto'
        ? sources.lqip
          ? 'auto → LQIP'
          : sources.hash
            ? 'auto → BlurHash'
            : `auto → color (${colorPlaceholder})`
        : placeholderMode;

  const isSocialFrame = aspectRatio !== '16:10';

  return (
    <div
      className={`relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-line transition-colors duration-300 ${
        isSocialFrame ? 'flex items-center justify-center bg-[#070a12]/90 p-2.5' : ''
      }`}
      style={!isSocialFrame ? { backgroundColor: completed >= 1 ? image.blurColor : undefined } : undefined}
    >
      <div
        className={`relative overflow-hidden transition-all duration-300 ${ASPECT_FRAME_CLASSES[aspectRatio]}`}
        style={{ backgroundColor: completed >= 1 ? image.blurColor : undefined }}
      >
        {completed === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-line-strong bg-surface-2 text-muted">
            <Code2 className="h-6 w-6" />
            <span className="text-sm">Output appears as the code is written</span>
          </div>
        )}

        <AnimatePresence>
          {completed >= 2 && !(completed === 4 && arrived) && sources.preview && (
            <motion.img
              key={`ph-${image.url}-${placeholderMode}-${colorPlaceholder}-${image.blurColor}`}
              {...fade}
              src={sources.preview}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
            />
          )}
          {completed >= 3 && showShimmer && !(completed === 4 && arrived) && (
            <motion.div key="sh" {...fade} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
              <div className="animate-sweep absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </motion.div>
          )}
        </AnimatePresence>

        {completed === 4 && arrived && (
          <div
            key={`${image.url}-${replayKey}-${placeholderMode}-${colorPlaceholder}-${revealScale}-${simulateError}-${aspectRatio}`}
            className="absolute inset-0"
          >
            <AnimatedImage
              image={simulateError ? undefined : image}
              src={simulateError ? '/__broken__/missing-landscape.avif' : image.url}
              alt={image.altText?.trim() || 'Optimized landscape'}
              blurDataUrl={sources.lqip}
              blurHash={sources.hash}
              blurColor={image.blurColor}
              colorPlaceholder={colorPlaceholder}
              animationDuration={duration}
              revealScale={revealScale}
              priority={priority}
              showShimmer={showShimmer}
              objectFit={objectFit}
              className={containImgCls}
              fill
              renderError={({ retry }) => (
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
                  <div className="max-w-xs space-y-2.5 rounded-xl border border-amber-400/40 bg-[#0b0f19]/90 p-3.5 text-xs text-white shadow-xl">
                    <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-amber-300">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      data-state=&quot;error&quot; · Placeholder retained
                    </div>
                    <p className="leading-relaxed text-slate-300">
                      Instead of a broken browser icon, the blurred placeholder stays mounted while{' '}
                      <code className="text-sky-300">renderError</code> offers recovery:
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={retry}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-[11px] text-white transition hover:bg-white/20"
                      >
                        <RotateCcw className="h-3 w-3" /> retry()
                      </button>
                      <button
                        type="button"
                        onClick={onClearErrorSimulation}
                        className="inline-flex items-center gap-1 rounded-lg bg-sky-500 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-950 transition hover:bg-sky-400"
                      >
                        <CheckCircle2 className="h-3 w-3" /> Restore valid src
                      </button>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        )}
      </div>

      {completed >= 2 && (
        <div className="pointer-events-none absolute inset-x-2.5 top-2.5 z-10 flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {completed >= 3 && priority && (
              <span className="inline-flex items-center gap-1 rounded-md bg-black/65 px-2 py-0.5 font-mono text-[10px] text-emerald-300 backdrop-blur">
                <Zap className="h-2.5 w-2.5" /> priority · eager
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-md bg-black/65 px-2 py-0.5 font-mono text-[10px] text-white/90 backdrop-blur">
              {ASPECT_LABELS[aspectRatio]} · fit: {objectFit} · {placeholderTag}
            </span>
          </div>
          {completed === 4 && variantWidthsLabel && !simulateError && (
            <span className="ms-auto inline-flex items-center gap-1 rounded-md bg-black/65 px-2 py-0.5 font-mono text-[10px] text-sky-200 backdrop-blur">
              <Layers className="h-2.5 w-2.5" /> srcSet: {variantWidthsLabel}
            </span>
          )}
        </div>
      )}

      {completed === 4 && arrived && (
        <span className="pointer-events-none absolute bottom-2.5 end-2.5 z-10 rounded-md bg-black/65 px-2 py-0.5 font-mono text-[10px] text-white/90 backdrop-blur">
          {image.width}×{image.height} · {image.format.toUpperCase()} · scale({revealScale}→1) · {duration}ms
        </span>
      )}

      {completed === 4 && !arrived && (
        <div className="absolute bottom-3 start-3 z-10 flex items-center gap-2 rounded-lg bg-black/60 px-2.5 py-1.5 font-mono text-[11px] text-white backdrop-blur">
          <Loader2 className="h-3 w-3 animate-spin" />
          {networkDelay === 'hold' ? 'Holding on placeholder layer' : 'Simulating network download…'}
        </div>
      )}
    </div>
  );
}
