import { useMemo } from 'react';
import {
  createFallbackBlurSvg,
  ImageUploadProvider,
  SingleImageUpload,
} from '@mo-elsherbiny/image-upload-kit/react';
import {
  decodeBlurHashToDataURL,
  formatFileSize,
  STANDARD_PRESETS,
  type StandardPresetName,
  type UploadedImageData,
} from '@mo-elsherbiny/image-upload-kit';
import confetti from 'canvas-confetti';
import { Copy, Cpu, Image as ImageIcon, Palette, Sparkles, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

export interface BlurLabInspectorProps {
  samples: UploadedImageData[];
  activeImage: UploadedImageData;
  onSelectImage: (img: UploadedImageData) => void;
  preset: StandardPresetName;
  onSelectPreset: (preset: StandardPresetName) => void;
  locale: 'en' | 'ar';
}

const PRESET_LIST: StandardPresetName[] = ['hero', 'cover', 'card', 'avatar', 'thumbnail', 'logo'];

export function BlurLabInspector({
  samples,
  activeImage,
  onSelectImage,
  preset,
  onSelectPreset,
  locale,
}: BlurLabInspectorProps) {
  const decodedBlurHashUrl = useMemo(
    () => (activeImage.blurHash ? decodeBlurHashToDataURL(activeImage.blurHash, 32, 32) : null),
    [activeImage.blurHash],
  );
  const ambientSvgUrl = useMemo(() => createFallbackBlurSvg(activeImage.blurColor), [activeImage.blurColor]);
  const lqipByteLength = useMemo(() => new Blob([activeImage.blurDataUrl]).size, [activeImage.blurDataUrl]);

  const handleCopyValue = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleUploadComplete = (uploaded: UploadedImageData | null) => {
    if (!uploaded) return;
    const savedPct = uploaded.originalSize
      ? Math.max(1, Math.round((1 - uploaded.size / uploaded.originalSize) * 100))
      : 78;
    void confetti({ particleCount: 70, spread: 65, origin: { y: 0.7 } });
    toast.success(`Sharp optimized to ${uploaded.format.toUpperCase()} (-${savedPct}% bytes)!`, {
      description: `4-Edge Color: ${uploaded.blurColor} • ${formatFileSize(uploaded.size)}`,
    });
    onSelectImage(uploaded);
  };

  const comparisonCards = [
    {
      title: '1. WebP LQIP',
      badge: `${lqipByteLength} B`,
      badgeClass: 'bg-emerald-500/15 text-emerald-300',
      imgSrc: activeImage.blurDataUrl,
      imgClass: 'scale-105 object-cover blur-sm',
      caption: `${activeImage.blurDataUrl.slice(0, 56)}...`,
      btnLabel: 'Copy Data URL',
      copyLabel: 'WebP LQIP Data URL',
      copyValue: activeImage.blurDataUrl,
      icon: Copy,
    },
    {
      title: '2. BlurHash',
      badge: `${activeImage.blurHash?.length ?? 28} chars`,
      badgeClass: 'bg-indigo-500/15 text-indigo-300',
      imgSrc: decodedBlurHashUrl ?? ambientSvgUrl,
      imgClass: 'object-cover',
      caption: activeImage.blurHash ?? 'L5550^9F00~q_3IU4n%M00Rj~qof',
      btnLabel: 'Copy BlurHash',
      copyLabel: 'BlurHash',
      copyValue: activeImage.blurHash ?? 'L5550^9F00~q_3IU4n%M00Rj~qof',
      icon: Copy,
    },
    {
      title: '3. 4-Edge Color',
      badge: '0 B Runtime',
      badgeClass: 'bg-amber-500/15 text-amber-200',
      imgSrc: ambientSvgUrl,
      imgClass: 'object-cover',
      caption: `Perimeter dominant hex: ${activeImage.blurColor}`,
      btnLabel: `Copy ${activeImage.blurColor}`,
      copyLabel: '4-Edge Ambient HEX',
      copyValue: activeImage.blurColor,
      icon: Palette,
    },
  ];

  return (
    <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-950/85 p-5 shadow-xl backdrop-blur-xl lg:col-span-7">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                <Cpu className="h-4 w-4 text-indigo-400" />
                <span>3-Way Placeholder Comparison Lab</span>
              </h2>
              <p className="text-xs text-slate-400">
                Inspect every fallback layer extracted by Sharp for the active image
              </p>
            </div>
            <span className="rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1 font-mono text-xs text-slate-300">
              {activeImage.width}×{activeImage.height} • {activeImage.format.toUpperCase()}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            {comparisonCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="flex flex-col justify-between rounded-xl border border-white/10 bg-slate-900/70 p-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-semibold text-white">{card.title}</span>
                      <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${card.badgeClass}`}>{card.badge}</span>
                    </div>
                    <div className="relative mt-2 flex h-28 w-full items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-slate-950">
                      <img src={card.imgSrc} alt={card.title} className={`h-full w-full ${card.imgClass}`} />
                    </div>
                    <p className="mt-2 truncate font-mono text-[10px] text-slate-400">{card.caption}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyValue(card.copyLabel, card.copyValue)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    <Icon className="h-3 w-3" />
                    <span>{card.btnLabel}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 border-t border-white/10 pt-4">
          <span className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-slate-300">
            <ImageIcon className="h-3.5 w-3.5 text-indigo-400" />
            <span>Real Sharp-Processed Sample Assets (Click to Load & Stream Code)</span>
          </span>
          <div className="grid grid-cols-3 gap-2.5">
            {samples.map((sample, idx) => (
              <button
                key={sample.url}
                type="button"
                onClick={() => onSelectImage(sample)}
                className={`flex items-center gap-2.5 overflow-hidden rounded-xl border p-2 text-left transition ${
                  sample.url === activeImage.url
                    ? 'border-indigo-400 bg-indigo-500/15 shadow-md'
                    : 'border-white/10 bg-slate-900/60 hover:border-white/25'
                }`}
              >
                <img src={sample.url} alt={sample.altText ?? `Sample ${idx + 1}`} className="h-11 w-14 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-white">
                    Sample #{idx + 1} ({sample.format.toUpperCase()})
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                    <span className="inline-block h-2.5 w-2.5 rounded-full border border-white/20" style={{ backgroundColor: sample.blurColor }} />
                    <span>{formatFileSize(sample.size)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-950/85 p-5 shadow-xl backdrop-blur-xl lg:col-span-5">
        <div>
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                <UploadCloud className="h-4 w-4 text-emerald-400" />
                <span>Live Sharp Upload Sandbox</span>
              </h2>
              <p className="text-xs text-slate-400">
                Drop any image — real Node.js Sharp optimizes & streams into the studio
              </p>
            </div>
            <Sparkles className="h-4 w-4 text-amber-300" />
          </div>

          <div className="mt-3.5">
            <label className="text-[11px] font-medium text-slate-300">
              Active Visual Preset (Max Dimensions & Target Quality)
            </label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {PRESET_LIST.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onSelectPreset(p)}
                  className={`rounded-lg border px-2.5 py-1 font-mono text-xs transition ${
                    preset === p
                      ? 'border-indigo-400/50 bg-indigo-500/20 text-white'
                      : 'border-white/10 bg-slate-900/70 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p} ({STANDARD_PRESETS[p].maxDimensions?.width ?? 1600}px)
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <ImageUploadProvider endpoint="/api/upload" locale={locale} requireAltText={false}>
              <SingleImageUpload
                preset={preset}
                label="Drop an image to test Sharp AVIF/WebP + LQIP"
                showProgress
                showQualitySelector
                onChange={handleUploadComplete}
              />
            </ImageUploadProvider>
          </div>
        </div>
      </div>
    </section>
  );
}
