import { useEffect, useMemo, useState } from 'react';
import { Check, Code2, Copy, FastForward, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import { codeToHtml } from 'shiki';
import { toast } from 'sonner';
import type { CodeScenario } from '../data/codeScenarios';

export interface AnimatedCodeEditorProps {
  scenarios: CodeScenario[];
  activeScenarioId: CodeScenario['id'];
  onSelectScenario: (id: CodeScenario['id']) => void;
  activeStep: 1 | 2 | 3 | 4;
  onStepChange: (step: 1 | 2 | 3 | 4) => void;
  activeBlurColor: string;
  replayTrigger: number;
}

export function AnimatedCodeEditor({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  activeStep,
  onStepChange,
  activeBlurColor,
  replayTrigger,
}: AnimatedCodeEditorProps) {
  const scenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0],
    [scenarios, activeScenarioId],
  );

  const [typedLength, setTypedLength] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<1 | 2 | 99>(1);
  const [highlightedHtml, setHighlightedHtml] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (speed === 99) {
      setTypedLength(scenario.code.length);
      setIsPlaying(false);
      onStepChange(4);
      return;
    }
    setTypedLength(18);
    setIsPlaying(true);
    onStepChange(1);
  }, [scenario.id, replayTrigger, speed, scenario.code.length, onStepChange]);

  useEffect(() => {
    if (!isPlaying) return;
    const total = scenario.code.length;
    if (typedLength >= total) {
      setIsPlaying(false);
      onStepChange(4);
      return;
    }

    const charsPerTick = speed === 2 ? 7 : 4;
    const timer = window.setTimeout(() => {
      const nextLen = Math.min(total, typedLength + charsPerTick);
      setTypedLength(nextLen);
      const [m1, m2, m3] = scenario.milestones;
      if (nextLen >= m3.charIndex) onStepChange(4);
      else if (nextLen >= m2.charIndex) onStepChange(3);
      else if (nextLen >= m1.charIndex) onStepChange(2);
      else onStepChange(1);
    }, 24);

    return () => window.clearTimeout(timer);
  }, [isPlaying, typedLength, speed, scenario, onStepChange]);

  const visibleCode = useMemo(
    () => scenario.code.slice(0, typedLength),
    [scenario.code, typedLength],
  );

  useEffect(() => {
    let cancelled = false;
    const snippet = `${visibleCode}${isPlaying ? '▋' : ''}`;
    codeToHtml(snippet, { lang: 'tsx', theme: 'vitesse-dark' })
      .then((html) => {
        if (!cancelled) setHighlightedHtml(html);
      })
      .catch(() => {
        if (!cancelled) setHighlightedHtml('');
      });
    return () => {
      cancelled = true;
    };
  }, [visibleCode, isPlaying]);

  const handleJumpToStep = (step: 1 | 2 | 3 | 4) => {
    const milestone = scenario.milestones[step - 1];
    setIsPlaying(false);
    setTypedLength(milestone.charIndex);
    onStepChange(step);
  };

  const handleReplay = () => {
    if (speed === 99) setSpeed(1);
    setTypedLength(12);
    onStepChange(1);
    setIsPlaying(true);
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(scenario.code);
    setCopied(true);
    toast.success(`Copied ${scenario.filename} to clipboard!`);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const activeMilestone = scenario.milestones[activeStep - 1];
  const progressPct = Math.round((typedLength / Math.max(1, scenario.code.length)) * 100);

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-slate-900/80 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 pr-2">
            <span className="h-3 w-3 rounded-full bg-rose-500/80" />
            <span className="h-3 w-3 rounded-full bg-amber-400/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {scenarios.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectScenario(tab.id)}
                className={`rounded-lg px-2.5 py-1 font-mono text-xs font-medium transition ${
                  tab.id === scenario.id
                    ? 'border border-indigo-400/40 bg-indigo-500/20 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              isPlaying
                ? setIsPlaying(false)
                : typedLength >= scenario.code.length
                  ? handleReplay()
                  : setIsPlaying(true)
            }
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:bg-white/10"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 text-amber-300" />
                <span>Pause</span>
              </>
            ) : typedLength >= scenario.code.length ? (
              <>
                <RotateCcw className="h-3.5 w-3.5 text-emerald-300" />
                <span>Replay</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 text-indigo-300" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSpeed((s) => (s === 1 ? 2 : s === 2 ? 99 : 1))}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1 font-mono text-[11px] text-slate-300 transition hover:border-white/20"
            title="Cycle typing speed (1x / 2x / Instant)"
          >
            <FastForward className="h-3 w-3 text-indigo-400" />
            <span>{speed === 99 ? 'Instant' : `${speed}x`}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-950/70 px-2.5 py-1 text-xs text-slate-300 transition hover:border-white/20 hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
            <span>Copy</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 border-b border-white/10 bg-slate-900/40 p-2.5 sm:grid-cols-4">
        {scenario.milestones.map((m) => {
          const isCurrent = activeStep === m.step;
          const isDone = activeStep > m.step;
          return (
            <button
              key={m.step}
              type="button"
              onClick={() => handleJumpToStep(m.step)}
              className={`group flex flex-col items-start rounded-xl border p-2 text-left transition ${
                isCurrent
                  ? 'border-indigo-400/50 bg-indigo-500/15 shadow-sm'
                  : isDone
                    ? 'border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10'
                    : 'border-white/5 bg-slate-900/40 hover:border-white/15'
              }`}
            >
              <div className="flex w-full items-center justify-between gap-1">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
                  Step {m.step}
                </span>
                <span className="truncate rounded bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                  {m.badge}
                </span>
              </div>
              <span className="mt-1 line-clamp-1 text-xs font-medium text-white">
                {m.title.replace(/^Step \d:\s*/, '')}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative min-h-[310px] flex-1 overflow-x-auto p-4 font-mono text-xs">
        <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 font-mono">
            <Code2 className="h-3.5 w-3.5 text-indigo-400" />
            {scenario.filename} — {scenario.subtitle}
          </span>
          <span className="font-mono text-indigo-300">{progressPct}% streamed</span>
        </div>

        {highlightedHtml ? (
          <div className="shiki-code-container" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        ) : (
          <pre className="font-mono text-xs leading-relaxed text-slate-200">
            <code>{visibleCode}{isPlaying ? '▋' : ''}</code>
          </pre>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-900/90 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2 text-slate-200">
          <Sparkles className="h-4 w-4 shrink-0 text-indigo-400" />
          <span className="font-semibold text-white">{activeMilestone.title}:</span>
          <span className="text-slate-300">{activeMilestone.description}</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <span className="inline-block h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: activeBlurColor }} />
          <span>{activeBlurColor}</span>
        </div>
      </div>
    </section>
  );
}
