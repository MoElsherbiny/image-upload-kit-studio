import { useMemo } from 'react';
import { decodeBlurHashToDataURL, type UploadedImageData } from '@mo-elsherbiny/image-upload-kit';
import { createFallbackBlurSvg } from '@mo-elsherbiny/image-upload-kit/react';
import { Copy } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface PlaceholderLabProps {
  image: UploadedImageData;
}

const bytesLabel = (n: number) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`);

/** Side-by-side view of every layer the server generates, smallest to largest. */
export function PlaceholderLab({ image }: PlaceholderLabProps) {
  const layers = useMemo(() => {
    const hash = image.blurHash ?? '';
    const lqipBytes = new TextEncoder().encode(image.blurDataUrl).length;
    return [
      {
        name: 'Ambient color',
        size: '7 B',
        src: createFallbackBlurSvg(image.blurColor),
        imgClass: '',
        note: 'Dominant color of the 4 edges. Paints the frame before anything downloads.',
        copy: image.blurColor,
        tag: image.blurColor,
      },
      {
        name: 'BlurHash',
        size: `${hash.length} chars`,
        src: hash ? decodeBlurHashToDataURL(hash, 32, 32) ?? '' : createFallbackBlurSvg(image.blurColor),
        imgClass: '',
        note: 'A short string decoded to a soft gradient in the browser. Great for JSON APIs.',
        copy: hash,
        tag: hash ? `${hash.slice(0, 14)}…` : '—',
      },
      {
        name: 'WebP LQIP',
        size: bytesLabel(lqipBytes),
        src: image.blurDataUrl,
        imgClass: 'blur-md scale-110',
        note: 'Tiny inline data URL. Renders in the first HTML response — even with SSR.',
        copy: image.blurDataUrl,
        tag: 'data:image/webp…',
      },
      {
        name: `Final ${image.format.toUpperCase()}`,
        size: bytesLabel(image.size),
        src: image.url,
        imgClass: '',
        note: `The optimized full image, ${image.width}×${image.height}. Crossfades in once decoded.`,
        copy: image.url,
        tag: `${image.width}×${image.height}`,
      },
    ];
  }, [image]);

  const copy = async (label: string, value: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {layers.map((layer, i) => (
        <motion.article
          key={layer.name}
          data-glow-card
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface"
        >
          <div className="relative aspect-[4/3] overflow-hidden" style={{ backgroundColor: image.blurColor }}>
            <img key={layer.src.slice(0, 64)} src={layer.src} alt={`${layer.name} preview`} className={`h-full w-full object-cover ${layer.imgClass}`} />
            <span className="absolute start-3 top-3 rounded-md bg-black/55 px-2 py-0.5 font-mono text-[11px] font-semibold text-white backdrop-blur">
              {i + 1}
            </span>
            <span className="absolute end-3 top-3 rounded-md bg-black/55 px-2 py-0.5 font-mono text-[11px] text-white backdrop-blur">
              {layer.size}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-2 p-4">
            <h3 className="text-sm font-semibold text-fg">{layer.name}</h3>
            <p className="flex-1 text-xs leading-relaxed text-muted">{layer.note}</p>
            <button
              type="button"
              onClick={() => copy(layer.name, layer.copy)}
              className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 font-mono text-[11px] text-fg-2 transition hover:border-accent hover:text-accent"
              aria-label={`Copy ${layer.name} value`}
            >
              <span className="truncate">{layer.tag}</span>
              <Copy className="h-3 w-3 shrink-0" />
            </button>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
