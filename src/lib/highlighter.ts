import { createHighlighterCore, type HighlighterCore, type ThemedToken } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

let highlighterPromise: Promise<HighlighterCore> | null = null;

/**
 * Lazily creates a single fine-grained Shiki highlighter (TSX + one theme,
 * JS regex engine — no WASM, no extra grammars in the bundle) and reuses it.
 */
export function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    themes: [import('shiki/themes/github-dark-default.mjs')],
    langs: [import('shiki/langs/tsx.mjs')],
    engine: createJavaScriptRegexEngine(),
  });
  return highlighterPromise;
}

export interface CodeLine {
  tokens: ThemedToken[];
  /** Character offset of the line start within the full source. */
  start: number;
  length: number;
}

/**
 * Tokenizes the FULL source once. While typing we only slice these tokens,
 * so highlighting cost is paid per code change, not per animation frame.
 */
export function tokenizeCode(highlighter: HighlighterCore | null, code: string): CodeLine[] {
  const rawLines = code.split('\n');
  const tokenLines = highlighter
    ? highlighter.codeToTokens(code, { lang: 'tsx', theme: 'github-dark-default' }).tokens
    : rawLines.map((content) => [{ content, offset: 0, color: '#c9d1d9' } as ThemedToken]);

  let start = 0;
  return rawLines.map((content, i) => {
    const line = { tokens: tokenLines[i] ?? [], start, length: content.length };
    start += content.length + 1;
    return line;
  });
}
