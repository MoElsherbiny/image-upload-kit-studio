import { useEffect, useMemo, useState } from 'react';
import type { StandardPresetName, UploadedImageData } from '@mo-elsherbiny/image-upload-kit';
import { Layers, Sparkles, Zap } from 'lucide-react';
import { Toaster } from 'sonner';
import { AnimatedCodeEditor } from './components/AnimatedCodeEditor';
import { BlurLabInspector } from './components/BlurLabInspector';
import { LiveOutputStage } from './components/LiveOutputStage';
import { Navbar } from './components/Navbar';
import {
  buildCodeScenarios,
  type CodeScenario,
  FALLBACK_SAMPLES,
  type PlaceholderMode,
} from './data/codeScenarios';

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [samples, setSamples] = useState<UploadedImageData[]>(FALLBACK_SAMPLES);
  const [activeImage, setActiveImage] = useState<UploadedImageData>(FALLBACK_SAMPLES[0]);
  const [preset, setPreset] = useState<StandardPresetName>('hero');
  const [duration, setDuration] = useState<number>(700);
  const [showShimmer, setShowShimmer] = useState<boolean>(true);
  const [placeholderMode, setPlaceholderMode] = useState<PlaceholderMode>('auto');
  const [activeScenarioId, setActiveScenarioId] =
    useState<CodeScenario['id']>('animated-image');
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [replayTrigger, setReplayTrigger] = useState<number>(0);

  // Sync dark/light class & RTL dir on <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
    root.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [theme, locale]);

  // Fetch real Sharp-processed samples from Vite backend middleware (/api/samples)
  useEffect(() => {
    let ignore = false;
    fetch('/api/samples')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { samples?: UploadedImageData[] } | UploadedImageData[] | null) => {
        if (ignore || !payload) return;
        const list = Array.isArray(payload) ? payload : payload.samples;
        if (Array.isArray(list) && list.length > 0) {
          setSamples(list);
          setActiveImage(list[0]);
          setReplayTrigger((n) => n + 1);
        }
      })
      .catch(() => {
        // Fallback samples remain active if /api/samples is unavailable
      });
    return () => {
      ignore = true;
    };
  }, []);

  const scenarios = useMemo(
    () =>
      buildCodeScenarios(activeImage, {
        preset,
        duration,
        showShimmer,
        placeholderMode,
      }),
    [activeImage, preset, duration, showShimmer, placeholderMode],
  );

  const handleSelectImage = (img: UploadedImageData) => {
    setActiveImage(img);
    setSamples((prev) =>
      prev.some((s) => s.url === img.url) ? prev : [img, ...prev.slice(0, 5)],
    );
    setReplayTrigger((n) => n + 1);
  };

  return (
    <div className="studio-grid-bg relative min-h-screen pb-20">
      {/* Ambient Radial Spotlight Synced to Active Image 4-Edge BlurColor */}
      <div
        className="pointer-events-none fixed inset-x-0 -top-40 -z-10 mx-auto h-[520px] max-w-5xl rounded-full opacity-35 blur-[130px] transition-colors duration-700"
        style={{
          background: `radial-gradient(circle, ${activeImage.blurColor} 0%, rgba(15, 23, 42, 0) 72%)`,
        }}
      />

      <Toaster theme={theme} position="bottom-right" richColors />

      <Navbar
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        locale={locale}
        onToggleLocale={() => setLocale((l) => (l === 'en' ? 'ar' : 'en'))}
        activeBlurColor={activeImage.blurColor}
      />

      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        {/* Hero Studio Banner */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 font-mono text-xs text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Interactive Code-to-UI Studio & Sharp Optimization Lab</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Watch Code Stream into{' '}
              <span
                className="bg-clip-text text-transparent transition-colors duration-500"
                style={{
                  backgroundImage: `linear-gradient(90deg, #fff, ${activeImage.blurColor}, #818cf8)`,
                }}
              >
                Zero-Hitch Blur-Up Images
              </span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Step through the 4-stage lifecycle of{' '}
              <code className="text-indigo-300">&lt;AnimatedImage /&gt;</code> and{' '}
              <code className="text-emerald-300">&lt;SingleImageUpload /&gt;</code>, or upload your
              own image below to inspect real-time Sharp AVIF/WebP size-guarding, WebP LQIP,
              BlurHash, and 4-edge ambient color extraction.
            </p>
          </div>

          {/* Live Telemetry Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 font-mono text-xs text-slate-200">
              <Zap className="h-3.5 w-3.5 text-amber-300" />
              <span>Sharp Pipeline:</span>
              <strong className="text-emerald-300">AVIF / WebP</strong>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 font-mono text-xs text-slate-200">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>Active 4-Edge:</span>
              <span
                className="inline-block h-3 w-3 rounded-full border border-white/30"
                style={{ backgroundColor: activeImage.blurColor }}
              />
              <strong>{activeImage.blurColor}</strong>
            </div>
          </div>
        </div>

        {/* Synchronized Split-Screen Studio: Animated Code Editor + Live Output Stage */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <AnimatedCodeEditor
              scenarios={scenarios}
              activeScenarioId={activeScenarioId}
              onSelectScenario={setActiveScenarioId}
              activeStep={activeStep}
              onStepChange={setActiveStep}
              activeBlurColor={activeImage.blurColor}
              replayTrigger={replayTrigger}
            />
          </div>
          <div className="lg:col-span-6">
            <LiveOutputStage
              activeImage={activeImage}
              activeStep={activeStep}
              duration={duration}
              onChangeDuration={setDuration}
              showShimmer={showShimmer}
              onToggleShimmer={() => setShowShimmer((s) => !s)}
              placeholderMode={placeholderMode}
              onChangePlaceholderMode={setPlaceholderMode}
            />
          </div>
        </div>

        {/* 3-Way Placeholder Comparison Lab + Live Sharp Uploader */}
        <BlurLabInspector
          samples={samples}
          activeImage={activeImage}
          onSelectImage={handleSelectImage}
          preset={preset}
          onSelectPreset={(p) => {
            setPreset(p);
            setReplayTrigger((n) => n + 1);
          }}
          locale={locale}
        />
      </main>
    </div>
  );
}

export default App;
