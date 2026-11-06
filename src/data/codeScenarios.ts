import {
  STANDARD_PRESETS,
  type StandardPresetName,
  type UploadedImageData,
  type UploadPresetConfig,
} from 'img-upload-kit';
import { PKG } from '../brand';

export type PlaceholderMode = 'auto' | 'lqip' | 'blurhash' | 'color';
export type ColorPlaceholderMode = 'flat' | 'gradient';
export type RevealScaleMode = 1.02 | 1;
export type ImageFitMode = 'cover' | 'contain';
export type DemoFramework = 'react' | 'angular' | 'react-native';
export type StudioAspectRatio = '16:10' | '1:1' | '4:5' | '9:16';
export type StudioPresetName = StandardPresetName | 'square' | 'portrait' | 'story';
export type Step = 1 | 2 | 3 | 4;
export type ScenarioId = 'animated-image' | 'upload-route' | 'upload-ui';

export const STUDIO_PRESETS: Record<StudioPresetName, UploadPresetConfig> = {
  ...STANDARD_PRESETS,
  square: (STANDARD_PRESETS as Record<string, UploadPresetConfig>).square ?? {
    folder: 'squares',
    maxDimensions: { width: 1600, height: 1600 },
    maxSizeMB: 12,
    quality: 88,
  },
  portrait: (STANDARD_PRESETS as Record<string, UploadPresetConfig>).portrait ?? {
    folder: 'portraits',
    maxDimensions: { width: 1080, height: 1350 },
    maxSizeMB: 12,
    quality: 86,
  },
  story: (STANDARD_PRESETS as Record<string, UploadPresetConfig>).story ?? {
    folder: 'stories',
    maxDimensions: { width: 1080, height: 1920 },
    maxSizeMB: 15,
    quality: 86,
  },
};

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
  framework?: DemoFramework;
  aspectRatio?: StudioAspectRatio;
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
  const fw: DemoFramework = opts.framework ?? 'react';
  const aspect: StudioAspectRatio = opts.aspectRatio ?? '16:10';
  const hash = image.blurHash?.trim() || null;
  const lqipBytes = image.blurDataUrl ? new TextEncoder().encode(image.blurDataUrl).length : 0;
  const alt = (image.altText?.trim() || 'Landscape photo').replace(/"/g, "'").slice(0, 52);
  const useLqip = Boolean(image.blurDataUrl) && (opts.placeholderMode === 'auto' || opts.placeholderMode === 'lqip');
  const useHash = Boolean(hash) && (opts.placeholderMode === 'auto' || opts.placeholderMode === 'blurhash');
  const aspectLine = aspect !== '16:10' ? `      aspectRatio="${aspect}"\n` : '';
  const fitLine = opts.objectFit === 'contain' ? '      objectFit="contain"\n' : '';
  const scaleLine =
    opts.revealScale !== 1.02
      ? `      revealScale={${opts.revealScale}}\n`
      : '      revealScale={1.02} // subtle settle zoom\n';
  const colorPhLine = opts.colorPlaceholder === 'gradient' ? '      colorPlaceholder="gradient"\n' : '';
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

  const animatedSteps: [StepMeta, StepMeta, StepMeta, StepMeta] = [
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
        ? 'priority sets loading="eager" + fetchPriority="high" (or forwards priority to Next.js / Expo Image).'
        : 'A soft 2s shimmer sweeps across while the full-res asset downloads.',
    },
    {
      title: 'Settle reveal',
      reflects: opts.simulateError
        ? 'When loading fails, the blur placeholder stays visible with data-state="error" and renderError({ retry }).'
        : `The ${image.format.toUpperCase()} (${image.width}×${image.height}${variantCount ? ` + ${variantCount} srcSet variants` : ''}) decodes, then settles scale(${opts.revealScale}→1) over ${opts.duration}ms.`,
    },
  ];

  const animatedSegments: Record<DemoFramework, { filename: string; segments: Segments }> = {
    react: {
      filename: 'Hero.tsx',
      segments: [
        `import { AnimatedImage } from '${PKG.name}/react';\n\nexport function Hero({ photo }) {\n  return (\n    <AnimatedImage\n      image={photo}\n      alt="${alt}"\n      blurColor="${image.blurColor}"\n${aspectLine}${colorPhLine}`,
        placeholderLines,
        `${priorityLine}      showShimmer={${opts.showShimmer}}\n`,
        `      animationDuration={${opts.duration}}\n${scaleLine}${fitLine}${errorLines}      fill\n    />\n  );\n}`,
      ],
    },
    angular: {
      filename: 'hero.component.ts',
      segments: [
        `import { Component, ElementRef, Input, AfterViewInit, inject } from '@angular/core';\nimport { mountAnimatedImage } from '${PKG.name}/angular';\n\n@Component({ selector: 'app-hero', standalone: true, template: '' })\nexport class HeroComponent implements AfterViewInit {\n  @Input({ required: true }) photo!: UploadedImageData;\n  private el = inject(ElementRef<HTMLElement>);\n\n  ngAfterViewInit() {\n    mountAnimatedImage(this.el.nativeElement, {\n      image: this.photo,\n      alt: '${alt}',\n      blurColor: '${image.blurColor}',\n${aspect !== '16:10' ? `      aspectRatio: '${aspect}',\n` : ''}`,
        useLqip
          ? `      blurDataUrl: this.photo.blurDataUrl, // ${lqipBytes} B WebP LQIP\n`
          : useHash
            ? `      blurHash: '${hash}',\n`
            : `      colorPlaceholder: '${opts.colorPlaceholder}',\n`,
        `      priority: ${opts.priority},\n      showShimmer: ${opts.showShimmer},\n`,
        `      animationDuration: ${opts.duration},\n      revealScale: ${opts.revealScale},\n      objectFit: '${opts.objectFit}',\n      fill: true,\n    });\n  }\n}`,
      ],
    },
    'react-native': {
      filename: 'HeroScreen.tsx',
      segments: [
        `import { Image as ExpoImage } from 'expo-image';\nimport { AnimatedImage } from '${PKG.name}/react-native';\n\nexport function HeroScreen({ photo }) {\n  return (\n    <AnimatedImage\n      image={photo}\n      as={ExpoImage}\n      alt="${alt}"\n      blurColor="${image.blurColor}"\n${aspect !== '16:10' ? `      aspectRatio="${aspect}"\n` : ''}`,
        placeholderLines,
        `      showShimmer={${opts.showShimmer}}\n`,
        `      animationDuration={${opts.duration}}\n      objectFit="${opts.objectFit}"\n    />\n  );\n}`,
      ],
    },
  };

  const animated = assemble(
    {
      id: 'animated-image',
      label: 'AnimatedImage',
      filename: animatedSegments[fw].filename,
      summary: 'Imagine-Global settle reveal with zero layout shift',
      steps: animatedSteps,
    },
    animatedSegments[fw].segments,
  );

  const routeFilename =
    fw === 'angular' ? 'server/upload.route.ts' : fw === 'react-native' ? 'app/api/upload+api.ts' : 'app/api/upload/route.ts';

  const route = assemble(
    {
      id: 'upload-route',
      label: 'Upload route',
      filename: routeFilename,
      summary: 'Hardened Sharp pipeline + smart aspect crop + variants',
      steps: [
        { title: 'Storage', reflects: 'Pick where files live — LocalFS, S3, R2, or Supabase share the same adapter contract.' },
        { title: 'Presets & Crop', reflects: `Runs Sharp with "${opts.preset}" (incl. 1:1 square, 4:5 portrait, 9:16 story attention crop) + variantWidths.` },
        { title: 'Sniff & Optimize', reflects: `Magic-byte format sniff → ${kb(image.originalSize ?? image.size)} in → ${kb(image.size)} ${image.format.toUpperCase()} + single-decode LQIP/BlurHash.` },
        { title: 'Secure Handler', reflects: 'Context-aware authorize({ action, request }) + explicit allowClientOverrides protect your bucket.' },
      ],
    },
    [
      `import { defineUploadPresets, STANDARD_PRESETS } from '${PKG.name}';\nimport { createImageUploader, createUploadHttpHandler } from '${PKG.name}/server';\nimport { createLocalFsStorageAdapter } from '${PKG.name}/storage';\n\nconst storage = createLocalFsStorageAdapter({\n  rootDir: './public/uploads',\n  baseUrl: '/uploads',\n});\n`,
      `\nconst uploader = createImageUploader({\n  storage,\n  defaultBucket: 'media',\n  presets: defineUploadPresets({\n    ...STANDARD_PRESETS, // includes square (1:1), portrait (4:5), story (9:16)\n    hero: { ...STANDARD_PRESETS.hero, variantWidths: [640, 1024, 1920] },\n  }),\n});\n`,
      `\n// Magic-byte sniff → EXIF rotate → smart attention crop → AVIF/WebP size-guard → LQIP + variants\n`,
      `export const { POST, DELETE } = createUploadHttpHandler({\n  uploader,\n  authorize: ({ action, request }) => Boolean(request.headers.get('cookie')),\n  allowClientOverrides: { folder: true, quality: true, format: true, dimensions: true, aspectRatio: true },\n});`,
    ],
  );

  const uiSegments: Record<DemoFramework, { filename: string; segments: Segments }> = {
    react: {
      filename: 'CoverField.tsx',
      segments: [
        `import { ImageUploadProvider, SingleImageUpload, MultiImageUpload, AnimatedImage } from '${PKG.name}/react';\nimport '${PKG.name}/styles.css';\n\nexport function CoverField() {\n  const [photo, setPhoto] = useState(initialPhoto);\n  const [gallery, setGallery] = useState(initialGallery);\n  return (\n    <ImageUploadProvider endpoint="/api/upload" locale="en">\n`,
        `      <SingleImageUpload\n        name="coverImage"\n        preset="${opts.preset}"\n        enablePaste\n        capture="environment"\n        value={photo}\n        onChange={setPhoto}\n      />\n`,
        `      <MultiImageUpload\n        mode="multiple"\n        preset="square"\n        reorderable\n        showCoverBadge\n        value={gallery}\n        onChange={setGallery}\n        onReorder={(ordered) => console.log('Cover:', ordered[0]?.url)}\n      />\n`,
        `      {photo && <AnimatedImage image={photo} priority showShimmer />}\n    </ImageUploadProvider>\n  );\n}`,
      ],
    },
    angular: {
      filename: 'product-gallery.component.ts',
      segments: [
        `import { Component, signal } from '@angular/core';\nimport { createSingleUpload, createMultiUpload, provideImageUploadConfig } from '${PKG.name}/angular';\n\n@Component({\n  selector: 'app-product-gallery',\n  standalone: true,\n  providers: [provideImageUploadConfig({ endpoint: '/api/upload', locale: 'en' })],\n  templateUrl: './product-gallery.component.html',\n})\nexport class ProductGalleryComponent {\n`,
        `  readonly cover = createSingleUpload({\n    preset: '${opts.preset}',\n    onChange: (photo) => this.activePhoto.set(photo),\n  });\n  readonly coverAccessor = this.cover.toControlValueAccessor();\n`,
        `  readonly gallery = createMultiUpload({\n    preset: 'square',\n    reorderable: true,\n    onReorder: (ordered) => console.log('Primary Cover:', ordered[0]?.url),\n  });\n`,
        `  promoteToCover(index: number) {\n    this.gallery.setCover(index); // moves tile to index 0 (Cover)\n  }\n}`,
      ],
    },
    'react-native': {
      filename: 'ProductGallery.tsx',
      segments: [
        `import * as ImagePicker from 'expo-image-picker';\nimport { NativeImageUploadProvider, createExpoImagePickerAdapter, SingleImageUpload, MultiImageUpload, AnimatedImage } from '${PKG.name}/react-native';\n\nconst picker = createExpoImagePickerAdapter(ImagePicker); // auto HEIC -> JPEG\n\nexport function ProductGallery() {\n  const [photo, setPhoto] = useState(initialPhoto);\n  const [gallery, setGallery] = useState(initialGallery);\n  return (\n    <NativeImageUploadProvider endpoint="https://api.example.com/api/upload" picker={picker}>\n`,
        `      <SingleImageUpload\n        preset="${opts.preset}"\n        enableCamera\n        value={photo}\n        onChange={setPhoto}\n      />\n`,
        `      <MultiImageUpload\n        preset="square"\n        reorderable\n        showCoverBadge\n        value={gallery}\n        onChange={setGallery}\n        onReorder={(ordered) => console.log('Cover:', ordered[0]?.url)}\n      />\n`,
        `      {photo && <AnimatedImage image={photo} aspectRatio="${aspect}" showShimmer />}\n    </NativeImageUploadProvider>\n  );\n}`,
      ],
    },
  };

  const ui = assemble(
    {
      id: 'upload-ui',
      label: 'Single & Multi Upload',
      filename: uiSegments[fw].filename,
      summary: 'Drop-in upload field + e-commerce gallery reordering',
      steps: [
        { title: 'Provider', reflects: 'One shared provider configures the endpoint, locale (EN/AR RTL) and platform adapter.' },
        { title: 'Paste, Camera & Forms', reflects: `Renders with "${opts.preset}", clipboard paste / camera capture, and Reactive Form / HTML binding.` },
        { title: 'Gallery Reorder & Cover', reflects: 'reorderable + showCoverBadge let users promote any tile to index 0 (Cover) and emit onReorder.' },
        { title: 'Display', reflects: 'Pass the uploaded object directly to <AnimatedImage image={photo} priority /> for auto srcSet & settle reveal.' },
      ],
    },
    uiSegments[fw].segments,
  );

  return [animated, route, ui];
}
