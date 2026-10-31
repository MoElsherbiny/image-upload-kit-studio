import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { HighlighterCore } from 'shiki/core';
import { Check, Copy, Pause, Play, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { CodeScenario, ScenarioId, Step } from '../data/codeScenarios';
import { type TypingSpeed, useTypewriter } from '../hooks/useTypewriter';
import { getHighlighter, tokenizeCode } from '../lib/highlighter';
import { CodeView } from './CodeView';

export interface JumpRequest {
  step: Step;
  nonce: number;
}

interface AnimatedCodeEditorProps {
  scenarios: CodeScenario[];
  scenario: CodeScenario;
  onSelectScenario: (id: ScenarioId) => void;
  restartKey: number;
  jumpRequest: JumpRequest | null;
  /** Fired only when the focused step or completed count changes — not per keystroke. */
  onProgress: (step: Step, completed: number) => void;
}

const SPEEDS: Array<{ value: TypingSpeed; label: string }> = [
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
  { value: 'instant', label: 'Skip' },
];

const ctrlBtn =
  'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white';

/**
 * The typing animation's high-frequency state lives entirely inside this
 * component, so each frame re-renders only the editor — never the page.
 */
export const AnimatedCodeEditor = memo(function AnimatedCodeEditor({
  scenarios,
  scenario,
  onSelectScenario,
  restartKey,
  jumpRequest,
  onProgress,
}: AnimatedCodeEditorProps) {
  const [highlighter, setHighlighter] = useState<HighlighterCore | null>(null);
  const [copied, setCopied] = useState(false);
  const tw = useTypewriter(scenario, restartKey);

  useEffect(() => {
    let alive = true;
    void getHighlighter().then((h) => alive && setHighlighter(h));
    return () => {
      alive = false;
    };
  }, []);

  // Tokenize once per code change (option tweaks), not on every typed character.
  const lines = useMemo(() => tokenizeCode(highlighter, scenario.code), [highlighter, scenario.code]);

  const { jumpTo, step, completed } = tw;
  const handledJump = useRef<number | null>(null);
  useEffect(() => {
    if (!jumpRequest || handledJump.current === jumpRequest.nonce) return;
    handledJump.current = jumpRequest.nonce;
    jumpTo(jumpRequest.step);
  }, [jumpRequest, jumpTo]);

  useEffect(() => {
    onProgress(step, completed);
  }, [step, completed, onProgress]);

  const copy = async () => {
    await navigator.clipboard.writeText(scenario.code);
    setCopied(true);
    toast.success(`Copied ${scenario.filename}`);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f19] shadow-2xl shadow-black/30"
      aria-label="Animated code editor"
    >
      <div className="flex items-center gap-3 border-b border-white/10 bg-[#0e1321] ps-4">
        <div className="flex shrink-0 gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="no-scrollbar flex min-w-0 flex-1 overflow-x-auto" role="tablist" aria-label="Examples">
          {scenarios.map((s) => {
            const active = s.id === scenario.id;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectScenario(s.id)}
                className={`relative shrink-0 border-e border-white/5 px-4 py-3 font-mono text-xs transition ${
                  active ? 'bg-[#0b0f19] text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {s.filename.split('/').pop()}
                {active && <span className="absolute inset-x-0 top-0 h-0.5 bg-sky-400" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-white/5 px-2 py-1.5">
        <div className="flex items-center gap-1">
          {tw.isPlaying ? (
            <button type="button" onClick={tw.pause} className={ctrlBtn}>
              <Pause className="h-3.5 w-3.5" /> Pause
            </button>
          ) : tw.done ? (
            <button type="button" onClick={tw.replay} className={ctrlBtn}>
              <RotateCcw className="h-3.5 w-3.5" /> Replay
            </button>
          ) : (
            <button type="button" onClick={tw.play} className={ctrlBtn}>
              <Play className="h-3.5 w-3.5" /> Resume
            </button>
          )}
          <div className="ms-1 flex rounded-lg bg-white/5 p-0.5" role="group" aria-label="Typing speed">
            {SPEEDS.map((s) => (
              <button
                key={String(s.value)}
                type="button"
                aria-pressed={tw.speed === s.value}
                onClick={() => tw.setSpeed(s.value)}
                className={`rounded-md px-2 py-1 font-mono text-[11px] transition ${
                  tw.speed === s.value ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={copy} className={ctrlBtn} aria-label="Copy code">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="code-view relative min-h-[360px] flex-1 overflow-auto py-4 font-mono">
        <CodeView
          lines={lines}
          typed={tw.typed}
          showCaret={!tw.done}
          activeLines={scenario.stepLines[tw.step - 1]}
        />
      </div>

      <div className="flex items-center gap-3 border-t border-white/5 px-4 py-2 font-mono text-[11px] text-slate-500">
        <span className="truncate">{scenario.filename}</span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full origin-left rounded-full bg-sky-400 will-change-transform"
            style={{ transform: `scaleX(${tw.progress})` }}
          />
        </div>
        <span className="w-8 text-end">{tw.done ? 'done' : `${Math.round(tw.progress * 100)}%`}</span>
      </div>
    </section>
  );
});
