import type { UploadedImageData } from 'img-upload-kit';
import { PKG } from '../brand';

export type PlaceholderMode = 'auto' | 'lqip' | 'blurhash' | 'color';
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

  const placeholderLines = [
    useLqip ? `      blurDataUrl={photo.blurDataUrl} // ${lqipBytes} B WebP LQIP\n` : '',
    useHash ? `      blurHash="${hash}"\n` : '',
    !useLqip && !useHash ? '      // no LQIP / BlurHash → falls back to the 4-edge color\n' : '',
  ].join('');

  const animated = assemble(
    {
      id: 'animated-image',
      label: 'AnimatedImage',
      filename: 'Hero.tsx',
      summary: 'Blur-up display with zero layout shift',
      steps: [
        { title: 'Ambient color', reflects: `The frame paints instantly in the 4-edge color ${image.blurColor} — no empty box, no layout shift.` },
        { title: 'Placeholder', reflects: 'A tiny blurred preview appears: WebP LQIP first, BlurHash as fallback.' },
        { title: 'Shimmer', reflects: 'A soft shimmer signals the full image is still loading.' },
        { title: 'Crossfade', reflects: `The sharp ${image.format.toUpperCase()} (${image.width}×${image.height}) decodes off-thread, then crossfades in over ${opts.duration}ms.` },
      ],
    },
    [
      `import { AnimatedImage } from '${PKG.name}/react';\n\nexport function Hero({ photo }) {\n  return (\n    <AnimatedImage\n      src={photo.url}\n      alt="${alt}"\n      blurColor="${image.blurColor}"\n`,
      placeholderLines,
      `      showShimmer={${opts.showShimmer}}\n`,
      `      animationDuration={${opts.duration}}\n${fitLine}      fill\n    />\n  );\n}`,
    ],
  );

  const route = assemble(
    {
      id: 'upload-route',
      label: 'Upload route',
      filename: 'app/api/upload/route.ts',
      summary: 'Sharp optimization on the server',
      steps: [
        { title: 'Storage', reflects: 'Pick where files live — local disk here; S3, R2 or Supabase use the same contract.' },
        { title: 'Uploader', reflects: `Each upload runs through Sharp with the "${opts.preset}" preset limits.` },
        { title: 'Optimize', reflects: `${kb(image.originalSize ?? image.size)} in → ${kb(image.size)} ${image.format.toUpperCase()} out, plus LQIP, BlurHash & color.` },
        { title: 'Response', reflects: 'The client receives one JSON payload, ready to store in your database.' },
      ],
    },
    [
      `import { createImageUploader, createUploadHttpHandler } from '${PKG.name}/server';\nimport { createLocalFsStorageAdapter } from '${PKG.name}/storage';\n\nconst storage = createLocalFsStorageAdapter({\n  rootDir: './public/uploads',\n  baseUrl: '/uploads',\n});\n`,
      `\nconst uploader = createImageUploader({\n  storage,\n  defaultBucket: 'media',\n});\n`,
      `\n// POST: validate → resize → AVIF/WebP size-guard → LQIP + BlurHash + color\n`,
      `export const { POST, DELETE } = createUploadHttpHandler({ uploader });`,
    ],
  );

  const ui = assemble(
    {
      id: 'upload-ui',
      label: 'SingleImageUpload',
      filename: 'CoverField.tsx',
      summary: 'Drop-in upload field for React',
      steps: [
        { title: 'Provider', reflects: 'One provider sets the endpoint, language and theme for every field.' },
        { title: 'Field', reflects: `A fully working upload field renders with the "${opts.preset}" preset — try replacing or inspecting it.` },
        { title: 'onChange', reflects: 'Uploads and blur/alt-text edits emit the updated image payload immediately.' },
        { title: 'Display', reflects: 'Pass the result straight to <AnimatedImage /> for an instant blur-up.' },
      ],
    },
    [
      `import { ImageUploadProvider, SingleImageUpload, AnimatedImage } from '${PKG.name}/react';\nimport '${PKG.name}/styles.css';\n\nexport function CoverField() {\n  const [photo, setPhoto] = useState(initialPhoto);\n  return (\n    <ImageUploadProvider endpoint="/api/upload" locale="en">\n`,
      `      <SingleImageUpload\n        preset="${opts.preset}"\n        value={photo}\n`,
      `        onChange={setPhoto} // { url, blurDataUrl, blurHash, blurColor, … }\n      />\n`,
      `      {photo && <AnimatedImage image={photo} showShimmer />}\n    </ImageUploadProvider>\n  );\n}`,
    ],
  );

  return [animated, route, ui];
}
