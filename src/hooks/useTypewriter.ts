import { useCallback, useEffect, useRef, useState } from 'react';
import { type CodeScenario, type Step, stepForLength } from '../data/codeScenarios';

export type TypingSpeed = 1 | 2 | 'instant';

const CHARS_PER_TICK: Record<1 | 2, number> = { 1: 3, 2: 7 };
const TICK_MS = 22;
const STEP_PAUSE_MS = 650;

/**
 * Types a scenario's code character by character, pausing briefly at each
 * step boundary so the live output has time to visibly react.
 */
export function useTypewriter(scenario: CodeScenario, restartKey: number) {
  const [typed, setTyped] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<TypingSpeed>(1);
  const [pinnedStep, setPinnedStep] = useState<Step | null>(null);
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const total = scenario.code.length;
  const done = typed >= total;

  // Restart when the scenario tab changes or the user asks for a replay.
  useEffect(() => {
    setPinnedStep(null);
    if (speed === 'instant' || reducedMotion.current) {
      setTyped(Number.MAX_SAFE_INTEGER);
      setIsPlaying(false);
    } else {
      setTyped(0);
      setIsPlaying(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario.id, restartKey]);

  useEffect(() => {
    if (!isPlaying || speed === 'instant') return;
    if (done) {
      setIsPlaying(false);
      return;
    }
    // Never skip past a step boundary in one tick, then linger on it briefly.
    const raw = Math.min(total, typed + CHARS_PER_TICK[speed]);
    const boundary = scenario.stepEnds.find((end) => end > typed && end <= raw);
    const next = boundary ?? raw;
    const atBoundary = typed > 0 && scenario.stepEnds.includes(typed);
    const timer = window.setTimeout(() => setTyped(next), atBoundary ? STEP_PAUSE_MS : TICK_MS);
    return () => window.clearTimeout(timer);
  }, [isPlaying, typed, total, done, speed, scenario.stepEnds]);

  const clamped = Math.min(typed, total);
  const typingStep = stepForLength(scenario, clamped);
  /** Step whose code lines are emphasised in the editor. */
  const step: Step = pinnedStep ?? (done ? 4 : typingStep);
  /** How many steps are fully written (0–4) — this is what the live output reflects. */
  const completed = pinnedStep ?? scenario.stepEnds.filter((end) => clamped >= end).length;

  const play = useCallback(() => {
    setPinnedStep(null);
    if (done) setTyped(0);
    setIsPlaying(true);
  }, [done]);

  const pause = useCallback(() => setIsPlaying(false), []);

  const replay = useCallback(() => {
    setPinnedStep(null);
    setTyped(0);
    setIsPlaying(true);
    if (speed === 'instant') setSpeed(1);
  }, [speed]);

  const jumpTo = useCallback(
    (target: Step) => {
      setIsPlaying(false);
      setPinnedStep(target);
      setTyped(target === 4 ? Number.MAX_SAFE_INTEGER : scenario.stepEnds[target - 1]);
    },
    [scenario.stepEnds],
  );

  const changeSpeed = useCallback((next: TypingSpeed) => {
    setSpeed(next);
    if (next === 'instant') {
      setTyped(Number.MAX_SAFE_INTEGER);
      setIsPlaying(false);
      setPinnedStep(null);
    }
  }, []);

  return {
    typed: clamped,
    visibleCode: done ? scenario.code : scenario.code.slice(0, typed),
    progress: Math.min(1, typed / Math.max(1, total)),
    isPlaying,
    done,
    step,
    completed,
    speed,
    play,
    pause,
    replay,
    jumpTo,
    setSpeed: changeSpeed,
  };
}

export type TypewriterState = ReturnType<typeof useTypewriter>;
