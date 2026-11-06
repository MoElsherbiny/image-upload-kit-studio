import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StandardPresetName, UploadedImageData } from 'img-upload-kit';
import { ImageUploadProvider } from 'img-upload-kit/react';
import { Toaster } from 'sonner';
import { AnimatedCodeEditor, type JumpRequest } from './components/AnimatedCodeEditor';
import { Footer, GetStarted } from './components/Footer';
import { Hero } from './components/Hero';
import { LiveOutputStage, type PlaygroundSettings } from './components/LiveOutputStage';
import { Navbar } from './components/Navbar';
import { PlaceholderLab } from './components/PlaceholderLab';
import { SourcePicker } from './components/SourcePicker';
import { StepTimeline } from './components/StepTimeline';
import { buildCodeScenarios, type ImageFitMode, type ScenarioId, type Step } from './data/codeScenarios';
import {
  DEFAULT_LANDSCAPE_ENTRY,
  LANDSCAPE_SAMPLES,
  type StudioImageEntry,
} from './data/landscapeSamples';
import { usePointerGlow } from './hooks/usePointerGlow';
import { demoUploader, getUploadedFileLabel, humanizeFilename } from './lib/demoUploader';

function recommendedFitFor(data: UploadedImageData, preset?: StandardPresetName): ImageFitMode {
  if (preset === 'logo') return 'contain';
  if (data.width > 0 && data.height > data.width * 0.95) return 'contain';
  return 'cover';
}

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [entries, setEntries] = useState<StudioImageEntry[]>(LANDSCAPE_SAMPLES);
  const [activeId, setActiveId] = useState<string>(DEFAULT_LANDSCAPE_ENTRY.id);
  const [scenarioId, setScenarioId] = useState<ScenarioId>('animated-image');
  const [restartKey, setRestartKey] = useState(0);
  const [settings, setSettings] = useState<PlaygroundSettings>({
    duration: 600,
    showShimmer: true,
    placeholderMode: 'auto',
    objectFit: 'cover',
    revealScale: 1.02,
    colorPlaceholder: 'flat',
    priority: true,
    simulateError: false,
    preset: 'hero',
  });

  usePointerGlow();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const activeEntry = useMemo(
    () => entries.find((e) => e.id === activeId) ?? entries[0] ?? DEFAULT_LANDSCAPE_ENTRY,
    [entries, activeId],
  );
  const image = activeEntry.data;

  const scenarios = useMemo(() => buildCodeScenarios(image, settings), [image, settings]);
  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0];
  const [progress, setProgress] = useState<{ step: Step; completed: number }>({ step: 1, completed: 0 });
  const [jumpRequest, setJumpRequest] = useState<JumpRequest | null>(null);

  const handleProgress = useCallback((step: Step, completed: number) => {
    setProgress((p) => (p.step === step && p.completed === completed ? p : { step, completed }));
  }, []);

  const handleSelectScenario = useCallback((id: ScenarioId) => {
    setScenarioId(id);
    setRestartKey((k) => k + 1);
  }, []);

  const handleJump = useCallback((step: Step) => setJumpRequest({ step, nonce: Date.now() }), []);

  // Selecting an existing landscape or uploaded photo reflects immediately at Step 4 (no blank wipe!).
  const handleSelectEntry = useCallback(
    (id: string) => {
      setActiveId(id);
      const target = entries.find((e) => e.id === id);
      if (target) {
        setSettings((s) => ({
          ...s,
          objectFit: recommendedFitFor(target.data, target.preset),
        }));
      }
      setJumpRequest({ step: 4, nonce: Date.now() });
    },
    [entries],
  );

  // Handles both fresh uploads AND metadata updates (altText / blurColor) from <SingleImageUpload />.
  const handleUploaded = useCallback(
    (next: UploadedImageData, meta?: { label?: string; preset?: StandardPresetName }) => {
      const usedPreset = meta?.preset ?? settings.preset;
      setEntries((prev) => {
        const existingIdx = prev.findIndex((e) => e.data.url === next.url);
        if (existingIdx !== -1) {
          const copy = [...prev];
          const prevItem = copy[existingIdx];
          copy[existingIdx] = {
            ...prevItem,
            label: meta?.label?.trim() || next.altText?.trim() || prevItem.label,
            data: next,
          };
          return copy;
        }

        const derivedLabel =
          meta?.label?.trim() ||
          getUploadedFileLabel(next.url) ||
          next.altText?.trim() ||
          (next.storagePath ? humanizeFilename(next.storagePath.split('/').pop() || '') : 'Your upload');

        const enrichedData: UploadedImageData = {
          ...next,
          altText: next.altText?.trim() || derivedLabel,
        };

        const newEntry: StudioImageEntry = {
          id: next.url,
          label: derivedLabel,
          preset: usedPreset,
          isUserUpload: true,
          data: enrichedData,
        };
        return [newEntry, ...prev];
      });

      setActiveId(next.url);
      setSettings((s) => ({
        ...s,
        objectFit: recommendedFitFor(next, usedPreset),
      }));
      setJumpRequest({ step: 4, nonce: Date.now() });
    },
    [settings.preset],
  );

  return (
    <ImageUploadProvider endpoint="/api/upload" uploader={demoUploader} locale={locale} requireAltText={false}>
      <div className="glow-backdrop" aria-hidden>
        <div className="glow-grid" />
        <div className="glow-grid-lit" />
        <div className="glow-spot" />
      </div>
      {/* Ambient wash that follows the selected image's 4-edge color */}
      <div
        className="pointer-events-none fixed inset-x-0 -top-48 -z-10 mx-auto h-[480px] max-w-5xl rounded-full opacity-25 blur-[120px] transition-colors duration-1000"
        style={{ background: `radial-gradient(circle, ${image.blurColor}, transparent 70%)` }}
        aria-hidden
      />
      <Toaster theme={theme} position="bottom-right" richColors />

      <Navbar
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        locale={locale}
        onToggleLocale={() => setLocale((l) => (l === 'en' ? 'ar' : 'en'))}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        <Hero activeImage={image} />

        <section id="studio" className="scroll-mt-20 space-y-5 pt-6">
          <SectionHeading
            eyebrow="Code studio"
            title="Watch the code write itself"
            text="Each step lights up the lines that matter and shows what they change on the right. Click any step to jump to it — or upload your own photo to test it live."
          />
          <div className="rounded-2xl border border-line bg-surface/60 p-4 backdrop-blur">
            <SourcePicker
              entries={entries}
              activeId={activeEntry.id}
              onSelect={handleSelectEntry}
              onUploaded={handleUploaded}
              preset={settings.preset}
              onChangePreset={(preset) => setSettings((s) => ({ ...s, preset }))}
            />
          </div>
          <StepTimeline scenario={scenario} focusStep={progress.step} completed={progress.completed} onJump={handleJump} />
          <div className="grid gap-5 lg:grid-cols-2">
            <AnimatedCodeEditor
              scenarios={scenarios}
              scenario={scenario}
              onSelectScenario={handleSelectScenario}
              restartKey={restartKey}
              jumpRequest={jumpRequest}
              onProgress={handleProgress}
            />
            <LiveOutputStage
              scenario={scenario}
              completed={progress.completed}
              image={image}
              settings={settings}
              onChangeSettings={(patch) => {
                setSettings((s) => ({ ...s, ...patch }));
                setJumpRequest({ step: 4, nonce: Date.now() });
              }}
              onEnsureStep4={() => setJumpRequest({ step: 4, nonce: Date.now() })}
              onUploaded={handleUploaded}
            />
          </div>
        </section>

        <section id="lab" className="scroll-mt-20 space-y-6 pt-24">
          <SectionHeading
            eyebrow="Placeholder lab"
            title="Four layers, one upload"
            text="The server returns every layer below from a single upload. The browser paints the smallest one first and swaps up smoothly until the sharp asset is decoded."
          />
          <PlaceholderLab image={image} />
        </section>

        <section id="get-started" className="scroll-mt-20 space-y-6 pt-24">
          <SectionHeading
            eyebrow="Get started"
            title="Three steps to ship it"
            text="Works with Next.js, Remix, Hono, SvelteKit — anything that speaks the Web Request API."
          />
          <GetStarted />
        </section>
      </main>

      <Footer />
    </ImageUploadProvider>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-fg sm:text-3xl">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{text}</p>
    </div>
  );
}

export default App;
