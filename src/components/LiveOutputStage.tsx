import { useEffect, useMemo, useState } from 'react';
import {
  AnimatedImage,
  createFallbackBlurSvg,
  resolvePlaceholderUrl,
} from '@mo-elsherbiny/image-upload-kit/react';
import {
  decodeBlurHashToDataURL,
  type UploadedImageData,
} from '@mo-elsherbiny/image-upload-kit';
import { Eye, Gauge, Layers, RefreshCw, Sparkles, Wifi } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { PlaceholderMode } from '../data/codeScenarios';

export interface LiveOutputStageProps {
  activeImage: UploadedImageData;
  activeStep: 1 | 2 | 3 | 4;
  duration: number;
  onChangeDuration: (ms: number) => void;
  showShimmer: boolean;
  onToggleShimmer: () => void;
  placeholderMode: PlaceholderMode;
  onChangePlaceholderMode: (mode: PlaceholderMode) => void;
}

const NETWORK_OPTIONS = [
  { label: '0ms Instant', value: 0 },
  { label: '600ms Fast 3G', value: 600 },
  { label: '1.5s Slow 3G', value: 1500 },
  { label: 'Freeze Blur', value: -1 },
] as const;

const PLACEHOLDER_MODES: Array<{ id: PlaceholderMode; label: string }> = [
  { id: 'auto', label: 'Auto Hierarchy' },
  { id: 'lqip', label: 'LQIP Only' },
  { id: 'blurhash', label: 'BlurHash Only' },
  { id: 'color', label: '4-Edge Color' },
];

export function LiveOutputStage({
  activeImage,
  activeStep,
  duration,
  onChangeDuration,
  showShimmer,
  onToggleShimmer,
  placeholderMode,
  onChangePlaceholderMode,
}: LiveOutputStageProps) {
  const [networkDelayMs, setNetworkDelayMs] = useState<0 | 600 | 1500 | -1>(0);
  const [delayCleared, setDelayCleared] = useState(true);
  const [remountKey, setRemountKey] = useState(0);

  useEffect(() => {
    if (networkDelayMs === -1) {
      setDelayCleared(false);
      return;
    }
    if (networkDelayMs === 0) {
      setDelayCleared(true);
      return;
    }
    setDelayCleared(false);
    const t = window.setTimeout(() => setDelayCleared(true), networkDelayMs);
    return () => window.clearTimeout(t);
  }, [activeImage.url, remountKey, networkDelayMs]);

  const effectiveSources = useMemo(() => {
    const lqip = placeholderMode === 'auto' || placeholderMode === 'lqip' ? activeImage.blurDataUrl : null;
    const hash = placeholderMode === 'auto' || placeholderMode === 'blurhash' ? activeImage.blurHash : null;
    return { blurDataUrl: lqip, blurHash: hash, blurColor: activeImage.blurColor };
  }, [activeImage, placeholderMode]);

  const resolvedPlaceholder = useMemo(() => {
    if (placeholderMode === 'blurhash' && activeImage.blurHash) {
      return decodeBlurHashToDataURL(activeImage.blurHash, 32, 32) ?? createFallbackBlurSvg(activeImage.blurColor);
    }
    if (placeholderMode === 'color') return createFallbackBlurSvg(activeImage.blurColor);
    return resolvePlaceholderUrl(effectiveSources);
  }, [activeImage, placeholderMode, effectiveSources]);

  const shouldMountSharpImage = activeStep === 4 && delayCleared && networkDelayMs !== -1;
  const savingsPct = activeImage.originalSize
    ? Math.max(1, Math.round((1 - activeImage.size / activeImage.originalSize) * 100))
    : 86;

  return (
    <section className="flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-slate-900/80 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-semibold text-white">Synchronized Live Render Stage</span>
          <span className="rounded-md border border-indigo-400/30 bg-indigo-500/15 px-2 py-0.5 font-mono text-[11px] text-indigo-200">
            data-state=&quot;{shouldMountSharpImage ? 'loaded' : 'loading'}&quot;
          </span>
        </div>

        <button
          type="button"
          onClick={() => setRemountKey((k) => k + 1)}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/25"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Replay Crossfade</span>
        </button>
      </div>

      <div className="relative m-4 flex min-h-[300px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-white/15 shadow-inner">
        <div className="absolute inset-0 transition-colors duration-500" style={{ backgroundColor: activeImage.blurColor }} />

        {!shouldMountSharpImage && (
          <div className="relative h-full min-h-[300px] w-full overflow-hidden">
            {activeStep >= 2 && (
              <img
                src={resolvedPlaceholder}
                alt=""
                aria-hidden="true"
                className="h-full min-h-[300px] w-full scale-105 object-cover blur-lg transition-opacity duration-500"
              />
            )}
            {(activeStep === 3 || (showShimmer && activeStep >= 2)) && (
              <div className="animate-studio-shimmer pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            )}
          </div>
        )}

        {shouldMountSharpImage && (
          <div key={`${activeImage.url}-${remountKey}-${placeholderMode}`} className="relative h-[320px] w-full">
            <AnimatedImage
              src={activeImage.url}
              alt={activeImage.altText ?? 'Optimized showcase image'}
              blurDataUrl={effectiveSources.blurDataUrl}
              blurHash={effectiveSources.blurHash}
              blurColor={effectiveSources.blurColor}
              animationDuration={duration}
              showShimmer={showShimmer}
              fill
              objectFit="cover"
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeStep}-${shouldMountSharpImage}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/15 bg-slate-950/80 px-3.5 py-2 backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-white/30" style={{ backgroundColor: activeImage.blurColor }} />
              <span className="font-mono text-xs font-medium text-white">
                {activeStep === 1 && 'Step 1: 4-Edge Ambient Container Painted'}
                {activeStep === 2 && `Step 2: ${placeholderMode.toUpperCase()} Placeholder Layer Mounted`}
                {activeStep === 3 && 'Step 3: Specular Shimmer Wave Active'}
                {activeStep === 4 &&
                  (shouldMountSharpImage
                    ? `Step 4: Decoded & ${duration}ms GPU Crossfade Complete`
                    : 'Step 4: Waiting for Simulated Network Stream...')}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-300">
              <span>{activeImage.format.toUpperCase()}</span>
              <span>•</span>
              <span>{(activeImage.size / 1024).toFixed(1)} KB</span>
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px]">-{savingsPct}%</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-white/10 bg-slate-900/75 p-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
            <Wifi className="h-3.5 w-3.5 text-indigo-400" />
            <span>Simulated Network Throttling</span>
          </label>
          <div className="flex flex-wrap gap-1">
            {NETWORK_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setNetworkDelayMs(opt.value)}
                className={`rounded-lg border px-2 py-1 font-mono text-[11px] transition ${
                  networkDelayMs === opt.value
                    ? 'border-indigo-400/50 bg-indigo-500/20 text-white'
                    : 'border-white/10 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            <span>Active Placeholder Source</span>
          </label>
          <div className="flex flex-wrap gap-1">
            {PLACEHOLDER_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onChangePlaceholderMode(m.id)}
                className={`rounded-lg border px-2 py-1 font-mono text-[11px] transition ${
                  placeholderMode === m.id
                    ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                    : 'border-white/10 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-full flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-1 items-center gap-3">
            <Gauge className="h-4 w-4 text-indigo-400" />
            <span className="font-mono text-xs text-slate-300">
              Crossfade: <strong className="text-white">{duration}ms</strong>
            </span>
            <input
              type="range"
              min={250}
              max={2000}
              step={50}
              value={duration}
              onChange={(e) => onChangeDuration(Number(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer accent-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={onToggleShimmer}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium transition ${
              showShimmer
                ? 'border-amber-400/40 bg-amber-500/15 text-amber-200'
                : 'border-white/10 bg-slate-950/60 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Shimmer: {showShimmer ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
