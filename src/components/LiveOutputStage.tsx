import { useEffect, useRef, useState } from 'react';
import type { UploadedImageData } from 'img-upload-kit';
import { AlertTriangle, Eye, RefreshCw, SlidersHorizontal, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type {
  CodeScenario,
  ColorPlaceholderMode,
  DemoFramework,
  ImageFitMode,
  PlaceholderMode,
  RevealScaleMode,
  StudioAspectRatio,
  StudioPresetName,
} from '../data/codeScenarios';
import { ImageStageOutput, type NetworkDelay } from './output/ImageStageOutput';
import { PipelineOutput } from './output/PipelineOutput';
import { UploadUiOutput } from './output/UploadUiOutput';

export interface PlaygroundSettings {
  duration: number;
  showShimmer: boolean;
  placeholderMode: PlaceholderMode;
  objectFit: ImageFitMode;
  revealScale: RevealScaleMode;
  colorPlaceholder: ColorPlaceholderMode;
  priority: boolean;
  simulateError: boolean;
  preset: StudioPresetName;
  framework: DemoFramework;
  aspectRatio: StudioAspectRatio;
}

interface LiveOutputStageProps {
  scenario: CodeScenario;
  completed: number;
  image: UploadedImageData;
  settings: PlaygroundSettings;
  onChangeSettings: (patch: Partial<PlaygroundSettings>) => void;
  onEnsureStep4?: () => void;
  onUploaded: (image: UploadedImageData, meta?: { label?: string; preset?: StudioPresetName }) => void;
}

const DELAYS: Array<{ value: NetworkDelay; label: string }> = [
  { value: 0, label: 'Fast' },
  { value: 800, label: '4G' },
  { value: 2000, label: 'Slow 3G' },
  { value: 'hold', label: 'Hold' },
];

const MODES: Array<{ value: PlaceholderMode; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'lqip', label: 'LQIP' },
  { value: 'blurhash', label: 'BlurHash' },
  { value: 'color', label: 'Color' },
];

const FITS: Array<{ value: ImageFitMode; label: string }> = [
  { value: 'cover', label: 'Cover' },
  { value: 'contain', label: 'Contain' },
];

const SCALES: Array<{ value: RevealScaleMode; label: string }> = [
  { value: 1.02, label: '1.02× settle' },
  { value: 1, label: '1.0× fade' },
];

const COLOR_PH_MODES: Array<{ value: ColorPlaceholderMode; label: string }> = [
  { value: 'flat', label: 'Flat' },
  { value: 'gradient', label: 'SVG' },
];

const ASPECT_RATIOS: Array<{ value: StudioAspectRatio; label: string }> = [
  { value: '16:10', label: '16:10' },
  { value: '1:1', label: '1:1' },
  { value: '4:5', label: '4:5' },
  { value: '9:16', label: '9:16' },
];

const PRESETS: StudioPresetName[] = [
  'hero', 'cover', 'card', 'square', 'portrait', 'story', 'avatar', 'thumbnail', 'logo', 'original',
];

export function LiveOutputStage({
  scenario,
  completed,
  image,
  settings,
  onChangeSettings,
  onEnsureStep4,
  onUploaded,
}: LiveOutputStageProps) {
  const [activeDelay, setActiveDelay] = useState<NetworkDelay>(800);
  const [replayKey, setReplayKey] = useState(0);
  const prevUrlRef = useRef(image.url);

  useEffect(() => {
    if (prevUrlRef.current !== image.url) {
      prevUrlRef.current = image.url;
      setActiveDelay((cur) => (cur === 'hold' ? 800 : cur));
      setReplayKey((k) => k + 1);
    }
  }, [image.url]);

  const triggerReplay = () => {
    onEnsureStep4?.();
    setActiveDelay((cur) => (cur === 'hold' ? 800 : cur));
    setReplayKey((k) => k + 1);
  };

  const reflects = completed > 0 ? scenario.steps[completed - 1] : null;
  const isImage = scenario.id === 'animated-image';

  return (
    <section
      data-glow-card
      className="flex h-full flex-col rounded-2xl border border-line bg-surface shadow-xl shadow-black/10"
      aria-label="Live output"
    >
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Eye className="h-4 w-4 text-accent" /> Live output
        </h3>
        {isImage && (
          <button
            type="button"
            onClick={triggerReplay}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-fg-2 transition hover:border-accent hover:text-accent"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Replay blur-up
          </button>
        )}
      </header>

      <div className="flex-1 p-4">
        {isImage && (
          <ImageStageOutput
            image={image}
            completed={completed}
            duration={settings.duration}
            showShimmer={settings.showShimmer}
            placeholderMode={settings.placeholderMode}
            objectFit={settings.objectFit}
            revealScale={settings.revealScale}
            colorPlaceholder={settings.colorPlaceholder}
            priority={settings.priority}
            simulateError={settings.simulateError}
            aspectRatio={settings.aspectRatio}
            onClearErrorSimulation={() => onChangeSettings({ simulateError: false })}
            networkDelay={activeDelay}
            replayKey={replayKey}
          />
        )}
        {scenario.id === 'upload-route' && <PipelineOutput image={image} completed={completed} preset={settings.preset} />}
        {scenario.id === 'upload-ui' && (
          <UploadUiOutput
            image={image}
            completed={completed}
            preset={settings.preset}
            objectFit={settings.objectFit}
            onUploaded={onUploaded}
          />
        )}

        <div className="mt-4 min-h-[3.5rem] rounded-xl bg-surface-2 px-4 py-3" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.p
              key={`${scenario.id}-${completed}-${image.url}-${settings.simulateError}-${settings.aspectRatio}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="text-sm leading-relaxed text-fg-2"
            >
              {reflects ? (
                <>
                  <span className="me-2 font-mono text-xs font-semibold text-accent">STEP {completed}</span>
                  {reflects.reflects}
                </>
              ) : (
                <span className="text-muted">{scenario.summary} — the result builds up as each step is written.</span>
              )}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <footer className="space-y-3 border-t border-line px-4 py-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-muted">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Tweak it — the code updates live
        </p>
        {isImage ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Segmented label="Placeholder" value={settings.placeholderMode} options={MODES} onChange={(v) => { onChangeSettings({ placeholderMode: v, simulateError: false }); if (activeDelay === 0) setActiveDelay(800); setReplayKey((k) => k + 1); }} />
            <Segmented label="Network" value={activeDelay} options={DELAYS} onChange={(v) => { onEnsureStep4?.(); if (settings.simulateError) onChangeSettings({ simulateError: false }); setActiveDelay(v); setReplayKey((k) => k + 1); }} />
            <Segmented label="Aspect" value={settings.aspectRatio} options={ASPECT_RATIOS} onChange={(v) => { onChangeSettings({ aspectRatio: v, simulateError: false }); if (activeDelay === 'hold') setActiveDelay(800); }} />
            <Segmented label="Fit" value={settings.objectFit} options={FITS} onChange={(v) => { onChangeSettings({ objectFit: v }); if (activeDelay === 'hold') setActiveDelay(800); }} />
            <Segmented label="Reveal" value={settings.revealScale} options={SCALES} onChange={(v) => { onChangeSettings({ revealScale: v, simulateError: false }); if (activeDelay === 'hold') setActiveDelay(800); setReplayKey((k) => k + 1); }} />
            <Segmented label="Color fill" value={settings.colorPlaceholder} options={COLOR_PH_MODES} onChange={(v) => { onChangeSettings({ colorPlaceholder: v, placeholderMode: 'color', simulateError: false }); if (activeDelay === 0) setActiveDelay(800); setReplayKey((k) => k + 1); }} />
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={settings.showShimmer}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    onChangeSettings({ showShimmer: checked });
                    if (checked) {
                      if (activeDelay === 0) setActiveDelay(800);
                      setReplayKey((k) => k + 1);
                    }
                  }}
                  className="h-3.5 w-3.5 cursor-pointer accent-[var(--bws-accent)]"
                />
                <span className="font-mono text-fg-2">Shimmer</span>
              </label>
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={settings.priority}
                  onChange={(e) => onChangeSettings({ priority: e.target.checked })}
                  className="h-3.5 w-3.5 cursor-pointer accent-[var(--bws-accent)]"
                />
                <span className="inline-flex items-center gap-1 font-mono text-fg-2">
                  <Zap className="h-3 w-3 text-emerald-400" /> priority
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={settings.simulateError}
                  onChange={(e) => {
                    onChangeSettings({ simulateError: e.target.checked });
                    if (activeDelay === 'hold') setActiveDelay(800);
                  }}
                  className="h-3.5 w-3.5 cursor-pointer accent-amber-400"
                />
                <span className="inline-flex items-center gap-1 font-mono text-amber-300">
                  <AlertTriangle className="h-3 w-3" /> Broken src
                </span>
              </label>
            </div>
            <label className="flex items-center gap-3 text-xs text-muted sm:col-span-2">
              <span className="w-16 shrink-0">Duration</span>
              <input
                type="range"
                min={200}
                max={2000}
                step={100}
                value={settings.duration}
                onChange={(e) => onChangeSettings({ duration: Number(e.target.value) })}
                onMouseUp={triggerReplay}
                onTouchEnd={triggerReplay}
                onKeyUp={triggerReplay}
                className="h-1.5 flex-1 cursor-pointer accent-[var(--bws-accent)]"
                aria-label="Crossfade duration"
              />
              <span className="w-14 text-end font-mono text-fg-2">{settings.duration}ms</span>
            </label>
          </div>
        ) : (
          <Segmented label="Preset" value={settings.preset} options={PRESETS.map((p) => ({ value: p, label: p }))} onChange={(v) => onChangeSettings({ preset: v })} />
        )}
      </footer>
    </section>
  );
}

function Segmented<T extends string | number>(props: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted">
      <span className="w-16 shrink-0">{props.label}</span>
      <div className="no-scrollbar flex flex-1 overflow-x-auto rounded-lg bg-surface-2 p-0.5" role="radiogroup" aria-label={props.label}>
        {props.options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={props.value === o.value}
            onClick={() => props.onChange(o.value)}
            className={`flex-1 whitespace-nowrap rounded-md px-2 py-1 font-mono text-[11px] transition ${
              props.value === o.value ? 'bg-surface text-fg shadow-sm ring-1 ring-line' : 'text-muted hover:text-fg'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
