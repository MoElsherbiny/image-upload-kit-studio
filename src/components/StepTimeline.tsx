import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import type { CodeScenario, Step } from '../data/codeScenarios';

interface StepTimelineProps {
  scenario: CodeScenario;
  focusStep: Step;
  completed: number;
  onJump: (step: Step) => void;
}

/** Four clickable steps shared by the editor and the live output. */
export function StepTimeline({ scenario, focusStep, completed, onJump }: StepTimelineProps) {
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Build steps">
      {scenario.steps.map((meta, i) => {
        const n = (i + 1) as Step;
        const isDone = completed >= n;
        const isFocus = focusStep === n;
        const isWriting = isFocus && !isDone;
        return (
          <li key={meta.title}>
            <button
              type="button"
              onClick={() => onJump(n)}
              aria-current={isFocus ? 'step' : undefined}
              className={`relative flex w-full items-center gap-3 overflow-hidden rounded-xl border px-3 py-2.5 text-start transition ${
                isFocus
                  ? 'border-accent/60 bg-accent/10'
                  : 'border-line bg-surface hover:border-line-strong'
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold transition ${
                  isDone ? 'bg-accent text-canvas' : isWriting ? 'border-2 border-accent text-accent' : 'border border-line-strong text-muted'
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : n}
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-muted">
                  {isWriting ? 'writing…' : `Step ${n}`}
                </span>
                <span className={`block truncate text-sm font-semibold ${isFocus ? 'text-fg' : 'text-fg-2'}`}>
                  {meta.title}
                </span>
              </span>
              {isWriting && (
                <motion.span
                  layoutId="step-writing-bar"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-accent"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
