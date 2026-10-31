import type { UploadedImageData } from '@mo-elsherbiny/image-upload-kit';

export type PlaceholderMode = 'auto' | 'lqip' | 'blurhash' | 'color';

export interface CodeMilestone {
  step: 1 | 2 | 3 | 4;
  title: string;
  badge: string;
  description: string;
  charIndex: number;
}

export interface CodeScenario {
  id: 'animated-image' | 'single-upload' | 'placeholder-hierarchy' | 'headless-hook';
  label: string;
  subtitle: string;
  filename: string;
  code: string;
  milestones: [CodeMilestone, CodeMilestone, CodeMilestone, CodeMilestone];
}

export const FALLBACK_SAMPLES: UploadedImageData[] = [
  {
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=85',
    blurDataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 20"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231E1B4B"/><stop offset="50%" stop-color="%233B0764"/><stop offset="100%" stop-color="%230F172A"/></linearGradient></defs><rect width="32" height="20" fill="url(%23g)"/></svg>',
    blurColor: '#312E81',
    blurHash: 'L5550^9F00~q_3IU4n%M00Rj~qof',
    altText: 'Cyberpunk neon aurora reflections over obsidian geometric glass',
    width: 1200,
    height: 750,
    format: 'avif',
    size: 46280,
    originalSize: 384200,
    contentHash: '9f86d081884c7d65',
    preset: 'hero',
    uploadedAt: new Date().toISOString(),
  },
  {
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=85',
    blurDataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 20"><defs><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%237C2D12"/><stop offset="55%" stop-color="%23C2410C"/><stop offset="100%" stop-color="%23431407"/></linearGradient></defs><rect width="32" height="20" fill="url(%23g2)"/></svg>',
    blurColor: '#9A3412',
    blurHash: 'L9B:x]00~V9F009F?b%M00IU_2Rj',
    altText: 'Golden hour Namib desert dunes with warm terracotta ridge shadows',
    width: 1200,
    height: 750,
    format: 'avif',
    size: 38910,
    originalSize: 312400,
    contentHash: '4b227777d4dd1fc6',
    preset: 'cover',
    uploadedAt: new Date().toISOString(),
  },
  {
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
    blurDataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 20"><defs><linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23064E3B"/><stop offset="50%" stop-color="%230F766E"/><stop offset="100%" stop-color="%23022C22"/></linearGradient></defs><rect width="32" height="20" fill="url(%23g3)"/></svg>',
    blurColor: '#0F766E',
    blurHash: 'L66*cM00~q9F00%M_3IU4nRj~qof',
    altText: 'Emerald bioluminescent coastal cove at twilight',
    width: 1200,
    height: 750,
    format: 'webp',
    size: 51400,
    originalSize: 419000,
    contentHash: 'e3b0c44298fc1c14',
    preset: 'card',
    uploadedAt: new Date().toISOString(),
  },
];

type MilestoneMeta = Omit<CodeMilestone, 'step' | 'charIndex'>;

function computeMilestones(
  code: string,
  markers: [string, string, string],
  meta: [MilestoneMeta, MilestoneMeta, MilestoneMeta, MilestoneMeta],
): [CodeMilestone, CodeMilestone, CodeMilestone, CodeMilestone] {
  const idx1 = Math.max(40, code.indexOf(markers[0]));
  const idx2 = Math.max(idx1 + 30, code.indexOf(markers[1]));
  const idx3 = Math.max(idx2 + 30, code.indexOf(markers[2]));
  return [
    { step: 1, ...meta[0], charIndex: idx1 },
    { step: 2, ...meta[1], charIndex: idx2 },
    { step: 3, ...meta[2], charIndex: idx3 },
    { step: 4, ...meta[3], charIndex: code.length },
  ];
}

export function buildCodeScenarios(
  activeImage: UploadedImageData,
  options: {
    preset: string;
    duration: number;
    showShimmer: boolean;
    placeholderMode: PlaceholderMode;
  },
): CodeScenario[] {
  const shortLqip = `${activeImage.blurDataUrl.slice(0, 38)}...`;
  const hashVal = activeImage.blurHash ?? 'L5550^9F00~q_3IU4n%M00Rj~qof';
  const savings = activeImage.originalSize
    ? Math.round((1 - activeImage.size / activeImage.originalSize) * 100)
    : 86;

  const s1Code = `import { AnimatedImage } from '@mo-elsherbiny/image-upload-kit/react';

export function HeroShowcase() {
  return (
    <AnimatedImage
      // Step 1: Mount 4-Edge Ambient Container
      src="${activeImage.url}"
      alt="${activeImage.altText ?? 'Optimized Hero Asset'}"
      blurColor="${activeImage.blurColor}"
      // Step 2: Inject WebP LQIP & BlurHash (${options.placeholderMode.toUpperCase()})
      blurDataUrl="${options.placeholderMode === 'blurhash' || options.placeholderMode === 'color' ? '' : shortLqip}"
      blurHash="${options.placeholderMode === 'lqip' || options.placeholderMode === 'color' ? '' : hashVal}"
      // Step 3: Activate Shimmer Wave
      showShimmer={${options.showShimmer}}
      // Step 4: Pre-Decode & ${options.duration}ms GPU Crossfade
      animationDuration={${options.duration}}
      fill
      objectFit="cover"
    />
  );
}`;

  const s2Code = `import { ImageUploadProvider, SingleImageUpload } from '@mo-elsherbiny/image-upload-kit/react';

export function ProductCoverUploader() {
  return (
    // Step 1: Configure Global Upload Context
    <ImageUploadProvider endpoint="/api/upload" locale="en">
      <SingleImageUpload
        // Step 2: Apply "${options.preset}" Visual Preset
        preset="${options.preset}"
        label="Upload Hero Asset"
        showQualitySelector
        // Step 3: Sharp AVIF/WebP Size-Guard (${savings}% Saved)
        onChange={(image) => {
          console.log('Optimized:', image?.format, image?.size);
          // Step 4: Emit Full UploadedImageData Payload
          // { blurColor: "${activeImage.blurColor}", hash: "${activeImage.contentHash.slice(0, 10)}" }
        }}
      />
    </ImageUploadProvider>
  );
}`;

  const s3Code = `import { decodeBlurHashToDataURL } from '@mo-elsherbiny/image-upload-kit';
import {
  resolvePlaceholderUrl,
  createFallbackBlurSvg,
} from '@mo-elsherbiny/image-upload-kit/react';

// Step 1: Priority 1 — 24px WebP LQIP Data URL
const lqipUrl = "${shortLqip}";

// Step 2: Priority 2 — Client BlurHash Canvas Decode
const blurHashCanvas = decodeBlurHashToDataURL("${hashVal}", 32, 32);

// Step 3: Priority 3 — 4-Edge Ambient Color SVG
const ambientSvg = createFallbackBlurSvg("${activeImage.blurColor}");

// Step 4: Automatic Zero-Config Resolution
export const bestPlaceholder = resolvePlaceholderUrl({
  blurDataUrl: lqipUrl,
  blurHash: "${hashVal}",
  blurColor: "${activeImage.blurColor}",
});`;

  const s4Code = `import { useSingleUpload } from '@mo-elsherbiny/image-upload-kit/react';

export function GlassDropzone({ onChange }) {
  // Step 1: Initialize Zero-Opinion Headless Controller
  const upload = useSingleUpload({
    preset: "${options.preset}",
    endpoint: "/api/upload",
    onChange,
  });

  return (
    // Step 2: Spread Accessible ARIA + Drag-and-Drop Props
    <div {...upload.getDropzoneProps()} className="glass-dropzone">
      <input {...upload.getInputProps()} />
      {/* Step 3: Reactive data-state="ready" & Progress */}
      <span>State: {upload.state} ({upload.progress}%)</span>
      {/* Step 4: Live 4-Edge Swatch (${activeImage.blurColor}) */}
      <output style={{ background: upload.blurColor }} />
    </div>
  );
}`;

  return [
    {
      id: 'animated-image',
      label: '<AnimatedImage />',
      subtitle: 'Blur-Up & Shimmer Crossfade',
      filename: 'HeroShowcase.tsx',
      code: s1Code,
      milestones: computeMilestones(s1Code, ['// Step 2:', '// Step 3:', '// Step 4:'], [
        { title: 'Step 1: Mount 4-Edge Ambient Container', badge: `blurColor="${activeImage.blurColor}"`, description: 'Paints the zero-byte 4-edge dominant color container immediately to prevent layout shift.' },
        { title: 'Step 2: Inject WebP LQIP & BlurHash', badge: 'LQIP > BlurHash', description: 'Layers the ultra-compact WebP LQIP data URL or decoded BlurHash canvas.' },
        { title: 'Step 3: Activate Shimmer Wave', badge: `showShimmer={${options.showShimmer}}`, description: 'Sweeps a GPU-accelerated specular shimmer across the blurred placeholder.' },
        { title: `Step 4: Pre-Decode & ${options.duration}ms GPU Crossfade`, badge: 'data-state="loaded"', description: 'Waits for img.decode() off-main-thread, crossfades smoothly, and unmounts the placeholder.' },
      ]),
    },
    {
      id: 'single-upload',
      label: '<SingleImageUpload />',
      subtitle: 'Sharp AVIF/WebP Size-Guard',
      filename: 'ProductCoverUploader.tsx',
      code: s2Code,
      milestones: computeMilestones(s2Code, ['// Step 2:', '// Step 3:', '// Step 4:'], [
        { title: 'Step 1: Mount ImageUploadProvider', badge: 'Context & i18n', description: 'Provides endpoint, locale (EN/AR RTL), and theme tokens to nested uploaders.' },
        { title: `Step 2: Apply "${options.preset}" Preset`, badge: `preset="${options.preset}"`, description: 'Enforces bounding-box dimensions, file size limits, and target compression.' },
        { title: 'Step 3: Sharp AVIF/WebP Size-Guard', badge: `-${savings}% Bytes`, description: 'Compares encoded AVIF/WebP against original bytes and extracts 4-edge color + LQIP.' },
        { title: 'Step 4: Emit UploadedImageData', badge: 'Ready for DB', description: 'Returns URL, dimensions, contentHash, blurDataUrl, blurHash, and blurColor.' },
      ]),
    },
    {
      id: 'placeholder-hierarchy',
      label: '3-Way Hierarchy',
      subtitle: 'LQIP > BlurHash > 4-Edge SVG',
      filename: 'placeholderHierarchy.ts',
      code: s3Code,
      milestones: computeMilestones(s3Code, ['// Step 2:', '// Step 3:', '// Step 4:'], [
        { title: 'Step 1: WebP LQIP Data URL', badge: 'Priority 1 (SSR Ready)', description: 'Tiny 24px Sharp-generated WebP base64 data URL rendered immediately in SSR HTML.' },
        { title: 'Step 2: Client BlurHash Decode', badge: 'Priority 2 (~28 Chars)', description: 'Decodes compact BlurHash strings into a 32x32 canvas data URL on the client.' },
        { title: 'Step 3: 4-Edge Ambient SVG', badge: 'Priority 3 (Zero-Dep)', description: 'Generates an inline SVG linear gradient from the 4-edge perimeter histogram color.' },
        { title: 'Step 4: Automatic Resolution', badge: 'resolvePlaceholderUrl()', description: 'Automatically picks the highest-fidelity placeholder available with graceful fallback.' },
      ]),
    },
    {
      id: 'headless-hook',
      label: 'useSingleUpload()',
      subtitle: 'Tier 4 Headless Primitive',
      filename: 'GlassDropzone.tsx',
      code: s4Code,
      milestones: computeMilestones(s4Code, ['// Step 2:', 'Step 3:', 'Step 4:'], [
        { title: 'Step 1: Initialize Headless Controller', badge: 'Zero CSS Lock-In', description: 'Exposes full state machine, XHR upload progress, and color extraction.' },
        { title: 'Step 2: Prop Getters & Hidden Input', badge: 'Keyboard & ARIA', description: 'Wires drag-and-drop handlers, Enter/Space keyboard triggers, and ARIA attributes.' },
        { title: 'Step 3: Reactive State Machine', badge: 'idle | uploading | ready', description: 'Tracks live upload progress and exposes data-state attributes for Tailwind.' },
        { title: 'Step 4: Live Ambient Color Hook', badge: activeImage.blurColor, description: 'Exposes detected 4-edge blurColor and custom color overrides before final save.' },
      ]),
    },
  ];
}
