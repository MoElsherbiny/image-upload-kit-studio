import type { StandardPresetName, UploadedImageData } from '@mo-elsherbiny/image-upload-kit';
import { Eye, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import type { CodeScenario, PlaceholderMode } from '../data/codeScenarios';
import { ImageStageOutput, type NetworkDelay } from './output/ImageStageOutput';
import { PipelineOutput } from './output/PipelineOutput';
import { UploadUiOutput } from './output/UploadUiOutput';

export interface PlaygroundSettings {
  duration: number;
  showShimmer: boolean;
  placeholderMode: PlaceholderMode;
  preset: StandardPresetName;
}

interface LiveOutputStageProps {
  scenario: CodeScenario;
  completed: number;
  image: UploadedImageData;
  settings: PlaygroundSettings;
  onChangeSettings: (patch: Partial<PlaygroundSettings>) => void;
  onUploaded: (image: UploadedImageData) => void;
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

const PRESETS: StandardPresetName[] = ['hero', 'cover', 'card', 'avatar', 'thumbnail', 'logo'];

export function LiveOutputStage({ scenario, completed, image, settings, onChangeSettings, onUploaded }: LiveOutputStageProps) {
  const [networkDelay, setNetworkDelay] = useState<NetworkDelay>(800);
  const [replayKey, setReplayKey] = useState(0);
  const reflects = completed > 0 ? scenario.steps[completed - 1] : null;
  const isImage = scenario.id === 'animated-image';

  return (
    <section data-glow-card className="flex h-full flex-col rounded-2xl border border-line bg-surface shadow-xl shadow-black/10" aria-label="Live output">
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Eye className="h-4 w-4 text-accent" /> Live output
        </h3>
        {isImage && completed === 4 && (
          <button
            type="button"
            onClick={() => setReplayKey((k) => k + 1)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-fg-2 transition hover:border-accent hover:text-accent"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Replay blur-up
          </button>
        )}
      </header>

      <div className="flex-1 p-4">
        {isImage && (
          <ImageStageOutput image={image} completed={completed} duration={settings.duration} showShimmer={settings.showShimmer} placeholderMode={settings.placeholderMode} networkDelay={networkDelay} replayKey={replayKey} />
        )}
        {scenario.id === 'upload-route' && <PipelineOutput image={image} completed={completed} preset={settings.preset} />}
        {scenario.id === 'upload-ui' && <UploadUiOutput image={image} completed={completed} preset={settings.preset} onUploaded={onUploaded} />}

        {/* What the current step reflects */}
        <div className="mt-4 min-h-[3.5rem] rounded-xl bg-surface-2 px-4 py-3" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.p
              key={`${scenario.id}-${completed}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
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

      {/* Playground controls — they rewrite the code on the left, too */}
      <footer className="space-y-3 border-t border-line px-4 py-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-muted">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Tweak it — the code updates live
        </p>
        {isImage ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Segmented label="Placeholder" value={settings.placeholderMode} options={MODES} onChange={(v) => onChangeSettings({ placeholderMode: v })} />
            <Segmented label="Network" value={networkDelay} options={DELAYS} onChange={(v) => { setNetworkDelay(v); setReplayKey((k) => k + 1); }} />
            <label className="flex items-center gap-3 text-xs text-muted">
              <span className="w-16 shrink-0">Fade</span>
              <input type="range" min={200} max={2000} step={100} value={settings.duration} onChange={(e) => onChangeSettings({ duration: Number(e.target.value) })} className="h-1.5 flex-1 cursor-pointer accent-[var(--bws-accent)]" aria-label="Crossfade duration" />
              <span className="w-14 text-end font-mono text-fg-2">{settings.duration}ms</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-xs text-muted">
              <span className="w-16 shrink-0">Shimmer</span>
              <input type="checkbox" checked={settings.showShimmer} onChange={(e) => onChangeSettings({ showShimmer: e.target.checked })} className="h-4 w-4 cursor-pointer accent-[var(--bws-accent)]" />
              <span className="font-mono text-fg-2">{settings.showShimmer ? 'on' : 'off'}</span>
            </label>
          </div>
        ) : (
          <Segmented label="Preset" value={settings.preset} options={PRESETS.map((p) => ({ value: p, label: p }))} onChange={(v) => onChangeSettings({ preset: v })} />
        )}
      </footer>
    </section>
  );
}

function Segmented<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted">
      <span className="w-16 shrink-0">{label}</span>
      <div className="no-scrollbar flex flex-1 overflow-x-auto rounded-lg bg-surface-2 p-0.5" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={String(o.value)} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)} className={`flex-1 whitespace-nowrap rounded-md px-2 py-1 font-mono text-[11px] transition ${value === o.value ? 'bg-surface text-fg shadow-sm ring-1 ring-line' : 'text-muted hover:text-fg'}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
