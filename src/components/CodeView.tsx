import { Fragment, memo } from 'react';
import type { ThemedToken } from 'shiki/core';
import type { CodeLine } from '../lib/highlighter';

interface CodeViewProps {
  lines: CodeLine[];
  /** Number of characters currently typed. */
  typed: number;
  showCaret: boolean;
  activeLines: [number, number];
}

const tokenStyle = (t: ThemedToken) => ({
  color: t.color,
  fontStyle: t.fontStyle && t.fontStyle & 1 ? 'italic' : undefined,
  fontWeight: t.fontStyle && t.fontStyle & 2 ? 600 : undefined,
});

/** A fully typed line never changes while typing continues, so it is memoized. */
const FullLine = memo(function FullLine({ tokens }: { tokens: ThemedToken[] }) {
  return (
    <>
      {tokens.map((t, i) => (
        <span key={i} style={tokenStyle(t)}>
          {t.content}
        </span>
      ))}
    </>
  );
});

function PartialLine({ tokens, chars }: { tokens: ThemedToken[]; chars: number }) {
  const out = [];
  let remaining = chars;
  for (let i = 0; i < tokens.length && remaining > 0; i++) {
    const t = tokens[i];
    const content = t.content.length <= remaining ? t.content : t.content.slice(0, remaining);
    remaining -= content.length;
    out.push(
      <span key={i} style={tokenStyle(t)}>
        {content}
      </span>,
    );
  }
  return <>{out}</>;
}

/** Renders pre-tokenized code up to `typed` characters with step emphasis. */
export function CodeView({ lines, typed, showCaret, activeLines }: CodeViewProps) {
  const visible = lines.filter((line) => line.start <= typed);
  return (
    <pre className="shiki">
      <code>
        {visible.map((line, i) => {
          const n = i + 1;
          const isLastVisible = i === visible.length - 1;
          const chars = Math.max(0, typed - line.start);
          const complete = chars >= line.length;
          const state = n >= activeLines[0] && n <= activeLines[1] ? 'is-active' : 'is-dim';
          return (
            <Fragment key={i}>
              <span className={`line ${state}`}>
                {complete ? <FullLine tokens={line.tokens} /> : <PartialLine tokens={line.tokens} chars={chars} />}
                {showCaret && isLastVisible && <span className="typing-caret" />}
              </span>
              {isLastVisible ? null : '\n'}
            </Fragment>
          );
        })}
      </code>
    </pre>
  );
}
