import { useState } from 'react';
import type { UploadedImageData } from 'img-upload-kit';
import { ArrowRight, Check, Copy, Terminal } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { INSTALL_COMMANDS, PKG, type PackageManager } from '../brand';
import { savingsPercent } from '../data/codeScenarios';

interface HeroProps {
  activeImage: UploadedImageData;
}

const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

export function Hero({ activeImage }: HeroProps) {
  const [pm, setPm] = useState<PackageManager>('npm');
  const [copied, setCopied] = useState(false);
  const lqipBytes = activeImage.blurDataUrl ? new TextEncoder().encode(activeImage.blurDataUrl).length : 0;
  const savings = savingsPercent(activeImage);

  const copyInstall = async () => {
    await navigator.clipboard.writeText(INSTALL_COMMANDS[pm]);
    setCopied(true);
    toast.success('Install command copied');
    window.setTimeout(() => setCopied(false), 1600);
  };

  const stats = [
    {
      label: savings > 0 ? 'Smaller file' : 'Size-guard',
      value: savings > 0 ? `−${savings}%` : '0% bloat',
      hint: `${kb(activeImage.originalSize ?? activeImage.size)} → ${kb(activeImage.size)}`,
    },
    {
      label: 'Output format',
      value: activeImage.format.toUpperCase(),
      hint: `${activeImage.width}×${activeImage.height}`,
    },
    {
      label: 'Blur preview',
      value: lqipBytes > 0 ? `${lqipBytes} B` : 'SVG',
      hint: lqipBytes > 0 ? 'inline WebP LQIP' : 'vector fallback',
    },
    {
      label: 'Ambient color',
      value: activeImage.blurColor,
      hint: 'from the 4 edges',
      swatch: activeImage.blurColor,
    },
  ];

  return (
    <section className="relative pt-14 pb-12 sm:pt-20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-3xl text-center"
      >
        <a
          href={PKG.npm}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 font-mono text-xs text-muted transition hover:border-line-strong hover:text-fg"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400" />
          {PKG.name} v{PKG.version} on npm
        </a>

        <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-fg sm:text-6xl">
          Image uploads that
          <br />
          <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
            look fast and load fast
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          Sharp AVIF/WebP optimization, presigned direct-to-storage uploads, instant blur-up placeholders, and ready-made
          upload UI for React, Vue, Angular, and React Native — in one package. Pick a landscape or upload your own photo
          below and watch every layer respond live.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#studio"
            className="inline-flex items-center gap-2 rounded-xl bg-accent-2 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-2/25 transition hover:brightness-110"
          >
            Watch it build
            <ArrowRight className="h-4 w-4" />
          </a>

          <div className="flex items-center rounded-xl border border-line bg-surface p-1 shadow-sm">
            <div className="flex" role="tablist" aria-label="Package manager">
              {(Object.keys(INSTALL_COMMANDS) as PackageManager[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={pm === key}
                  onClick={() => setPm(key)}
                  className={`rounded-lg px-2.5 py-1.5 font-mono text-xs transition ${
                    pm === key ? 'bg-surface-3 text-fg' : 'text-muted hover:text-fg'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={copyInstall}
              className="ms-1 flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-xs text-fg-2 transition hover:bg-surface-2"
              aria-label={`Copy: ${INSTALL_COMMANDS[pm]}`}
            >
              <Terminal className="h-3.5 w-3.5 text-accent" />
              <span className="hidden max-w-[17rem] truncate sm:inline">{INSTALL_COMMANDS[pm]}</span>
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-muted" />}
            </button>
          </div>
        </div>
      </motion.div>

      <motion.dl
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4"
        aria-label="Live results for the selected image"
      >
        {stats.map((stat) => (
          <div key={stat.label} data-glow-card className="rounded-2xl border border-line bg-surface/80 px-4 py-3.5 text-start">
            <dt className="text-xs font-medium text-muted">{stat.label}</dt>
            <dd className="mt-1 flex items-center gap-2 font-mono text-xl font-semibold text-fg">
              {stat.swatch && (
                <span className="h-4 w-4 rounded-full ring-1 ring-line-strong" style={{ backgroundColor: stat.swatch }} />
              )}
              {stat.value}
            </dd>
            <dd className="mt-0.5 font-mono text-[11px] text-muted">{stat.hint}</dd>
          </div>
        ))}
      </motion.dl>
    </section>
  );
}
