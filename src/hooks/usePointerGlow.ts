import { useEffect } from 'react';

const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/**
 * Drives two cursor effects (ported from the buildwithsherbo portfolio):
 * 1. `[data-glow-card]` elements get local `--mx` / `--my` for a border glow.
 * 2. The `.glow-backdrop` layer gets eased viewport `--mx` / `--my` / `--glow`.
 * Touch devices and reduced-motion users get the static design with no listeners.
 */
export function usePointerGlow(): void {
  useEffect(() => {
    if (!window.matchMedia(FINE_POINTER).matches) return;
    const reduced = window.matchMedia(REDUCED_MOTION).matches;
    const backdrop = document.querySelector<HTMLElement>('.glow-backdrop');

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0, glow: 0 };
    let glowTarget = 0;
    let frame = 0;
    let started = false;

    const tick = () => {
      const ease = reduced ? 1 : 0.14;
      current.x += (target.x - current.x) * ease;
      current.y += (target.y - current.y) * ease;
      current.glow += (glowTarget - current.glow) * 0.08;
      if (backdrop) {
        backdrop.style.setProperty('--mx', `${current.x.toFixed(1)}px`);
        backdrop.style.setProperty('--my', `${current.y.toFixed(1)}px`);
        backdrop.style.setProperty('--glow', current.glow.toFixed(3));
      }
      frame = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      glowTarget = 1;
      if (!started) {
        started = true;
        current.x = target.x;
        current.y = target.y;
        frame = requestAnimationFrame(tick);
      }
      const card = (event.target as Element | null)?.closest<HTMLElement>('[data-glow-card]');
      if (card) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        card.style.setProperty('--my', `${event.clientY - rect.top}px`);
      }
    };

    const onLeave = () => {
      glowTarget = 0;
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);
}
