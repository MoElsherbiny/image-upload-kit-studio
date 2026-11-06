import type { UploadedImageData } from 'img-upload-kit';
import { PKG } from '../brand';

export type PlaceholderMode = 'auto' | 'lqip' | 'blurhash' | 'color';
export type ColorPlaceholderMode = 'flat' | 'gradient';
export type RevealScaleMode = 1.02 | 1;
export type ImageFitMode = 'cover' | 'contain';
export type Step = 1 | 2 | 3 | 4;
export type ScenarioId = 'animated-image' | 'upload-route' | 'upload-ui';

export interface StepMeta {
  title: string;
  /** What the user sees change in the live output when this step is written. */
  reflects: string;
}

export interface CodeScenario {
  id: ScenarioId;
  label: string;
  filename: string;
  summary: string;
  /** Full source, the concatenation of the 4 step segments. */
  code: string;
  /** Character offset where each step's segment ends (index 3 === code.length). */
  stepEnds: [number, number, number, number];
  /** 1-based inclusive line range for each step. */
  stepLines: [[number, number], [number, number], [number, number], [number, number]];
  steps: [StepMeta, StepMeta, StepMeta, StepMeta];
}

export interface ScenarioOptions {
  preset: string;
  duration: number;
  showShimmer: boolean;
  placeholderMode: PlaceholderMode;
  objectFit: ImageFitMode;
  revealScale: RevealScaleMode;
  colorPlaceholder: ColorPlaceholderMode;
  priority: boolean;
  simulateError: boolean;
}

type Segments = [string, string, string, string];

function assemble(
  base: Omit<CodeScenario, 'code' | 'stepEnds' | 'stepLines'>,
  segments: Segments,
): CodeScenario {
  let offset = 0;
  let line = 1;
  const stepEnds = [] as number[];
  const stepLines = [] as [number, number][];
  segments.forEach((segment, i) => {
    const isLast = i === segments.length - 1;
    const lineCount = segment.split('\n').length - (isLast ? 0 : 1);
    offset += segment.length;
    stepEnds.push(offset);
    stepLines.push([line, line + lineCount - 1]);
    line += lineCount;
  });
  return {
    ...base,
    code: segments.join(''),
    stepEnds: stepEnds as CodeScenario['stepEnds'],
    stepLines: stepLines as CodeScenario['stepLines'],
  };
}

/** Which step a given number of typed characters falls in. */
export function stepForLength(scenario: CodeScenario, typed: number): Step {
  const index = scenario.stepEnds.findIndex((end) => typed < end);
  return (index === -1 ? 4 : index + 1) as Step;
}

const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

export function savingsPercent(image: UploadedImageData): number {
  if (!image.originalSize || image.originalSize <= image.size) return 0;
  return Math.round((1 - image.size / image.originalSize) * 100);
}

export function buildCodeScenarios(image: UploadedImageData, opts: ScenarioOptions): CodeScenario[] {
  const hash = image.blurHash?.trim() || null;
  const lqipBytes = image.blurDataUrl ? new TextEncoder().encode(image.blurDataUrl).length : 0;
  const alt = (image.altText?.trim() || 'Landscape photo').replace(/"/g, "'").slice(0, 52);
  const useLqip = Boolean(image.blurDataUrl) && (opts.placeholderMode === 'auto' || opts.placeholderMode === 'lqip');
  const useHash = Boolean(hash) && (opts.placeholderMode === 'auto' || opts.placeholderMode === 'blurhash');
  const fitLine = opts.objectFit === 'contain' ? '      objectFit="contain"\n' : '';
  const scaleLine = opts.revealScale !== 1.02 ? `      revealScale={${opts.revealScale}}\n` : '      revealScale={1.02} // subtle settle zoom\n';
  const colorPhLine =
    opts.colorPlaceholder === 'gradient' ? '      colorPlaceholder="gradient"\n' : '';
  const priorityLine = opts.priority ? '      priority\n' : '';
  const errorLines = opts.simulateError
    ? '      fallbackSrc="/samples/landscapes/preset-cover/glacial-mountain-peaks.avif"\n      renderError={({ retry }) => <RetryOverlay onClick={retry} />}\n'
    : '';
  const variantCount = image.variants?.length ?? 0;

  const placeholderLines = [
    useLqip ? `      blurDataUrl={photo.blurDataUrl} // ${lqipBytes} B WebP LQIP\n` : '',
    useHash ? `      blurHash="${hash}"\n` : '',
    !useLqip && !useHash
      ? `      // color-only mode (${opts.colorPlaceholder === 'flat' ? 'flat wrapper bg, 0 extra DOM nodes' : 'SVG gradient layer'})\n`
      : '',
  ].join('');

  const animated = assemble(
    {
      id: 'animated-image',
      label: 'AnimatedImage',
      filename: 'Hero.tsx',
      summary: 'Imagine-Global settle reveal with zero layout shift',
      steps: [
        {
          title: 'Ambient color',
          reflects: `The wrapper paints instantly in ${image.blurColor} (${opts.colorPlaceholder === 'flat' ? 'flat fill, accepts CSS var()' : 'SVG gradient'}) — zero layout shift.`,
        },
        {
          title: 'Placeholder',
          reflects: 'A 20px-blurred scale(1.1) preview mounts: WebP LQIP first, BlurHash fallback, or flat color.',
        },
        {
          title: 'Priority & Shimmer',
          reflects: opts.priority
            ? 'priority sets loading="eager" + fetchPriority="high" (or forwards priority to Next.js Image).'
            : 'A soft 2s shimmer sweeps across while the full-res asset downloads.',
        },
        {
          title: 'Settle reveal',
          reflects: opts.simulateError
            ? 'When loading fails, the blur placeholder stays visible with data-state="error" and renderError({ retry }).'
            : `The ${image.format.toUpperCase()} (${image.width}×${image.height}${variantCount ? ` + ${variantCount} srcSet variants` : ''}) decodes off-thread, then settles scale(${opts.revealScale}→1) over ${opts.duration}ms.`,
        },
      ],
    },
    [
      `import { AnimatedImage } from '${PKG.name}/react';\n\nexport function Hero({ photo }) {\n  return (\n    <AnimatedImage\n      image={photo}\n      alt="${alt}"\n      blurColor="${image.blurColor}"\n${colorPhLine}`,
      placeholderLines,
      `${priorityLine}      showShimmer={${opts.showShimmer}}\n`,
      `      animationDuration={${opts.duration}}\n${scaleLine}${fitLine}${errorLines}      fill\n    />\n  );\n}`,
    ],
  );

  const route = assemble(
    {
      id: 'upload-route',
      label: 'Upload route',
      filename: 'app/api/upload/route.ts',
      summary: 'Hardened Sharp pipeline + responsive variants',
      steps: [
        { title: 'Storage', reflects: 'Pick where files live — LocalFS, S3, R2, or Supabase share the same adapter contract.' },
        { title: 'Presets & Variants', reflects: `Runs Sharp with "${opts.preset}" limits and encodes responsive variantWidths in parallel.` },
        { title: 'Sniff & Optimize', reflects: `Magic-byte format sniff → ${kb(image.originalSize ?? image.size)} in → ${kb(image.size)} ${image.format.toUpperCase()} + single-decode LQIP/BlurHash.` },
        { title: 'Secure Handler', reflects: 'Context-aware authorize({ action, request }) + explicit allowClientOverrides protect your bucket.' },
      ],
    },
    [
      `import { defineUploadPresets, STANDARD_PRESETS } from '${PKG.name}';\nimport { createImageUploader, createUploadHttpHandler } from '${PKG.name}/server';\nimport { createLocalFsStorageAdapter } from '${PKG.name}/storage';\n\nconst storage = createLocalFsStorageAdapter({\n  rootDir: './public/uploads',\n  baseUrl: '/uploads',\n});\n`,
      `\nconst uploader = createImageUploader({\n  storage,\n  defaultBucket: 'media',\n  presets: defineUploadPresets({\n    ...STANDARD_PRESETS,\n    hero: { ...STANDARD_PRESETS.hero, variantWidths: [640, 1024, 1920] },\n  }),\n});\n`,
      `\n// Magic-byte sniff → EXIF rotate → AVIF/WebP size-guard → LQIP + BlurHash + srcSet variants\n`,
      `export const { POST, DELETE } = createUploadHttpHandler({\n  uploader,\n  authorize: ({ action, request }) => Boolean(request.headers.get('cookie')),\n  allowClientOverrides: { folder: true, quality: true, format: true, dimensions: true },\n});`,
    ],
  );

  const ui = assemble(
    {
      id: 'upload-ui',
      label: 'SingleImageUpload',
      filename: 'CoverField.tsx',
      summary: 'Drop-in upload field with paste, cancel & forms',
      steps: [
        { title: 'Provider', reflects: 'One shared provider configures the endpoint, locale (EN/AR RTL) and theme.' },
        { title: 'Paste & Form', reflects: `Renders with "${opts.preset}", clipboard paste (Ctrl+V), mobile camera capture, and hidden form input.` },
        { title: 'Cancel & Retry', reflects: 'Per-upload AbortController supports instant cancel/retry and emits the full image + variants payload.' },
        { title: 'Display', reflects: 'Pass the uploaded object directly to <AnimatedImage image={photo} priority /> for auto srcSet & settle reveal.' },
      ],
    },
    [
      `import { ImageUploadProvider, SingleImageUpload, AnimatedImage } from '${PKG.name}/react';\nimport '${PKG.name}/styles.css';\n\nexport function CoverField() {\n  const [photo, setPhoto] = useState(initialPhoto);\n  return (\n    <ImageUploadProvider endpoint="/api/upload" locale="en">\n`,
      `      <SingleImageUpload\n        name="coverImage"\n        preset="${opts.preset}"\n        enablePaste\n        capture="environment"\n        value={photo}\n`,
      `        onChange={setPhoto} // { url, variants, srcSet, blurDataUrl, blurColor, … }\n      />\n`,
      `      {photo && <AnimatedImage image={photo} priority showShimmer />}\n    </ImageUploadProvider>\n  );\n}`,
    ],
  );

  return [animated, route, ui];
}
