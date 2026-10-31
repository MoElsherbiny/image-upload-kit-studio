import { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  Moon,
  Package,
  Sparkles,
  Sun,
  Terminal,
} from 'lucide-react';
import { toast } from 'sonner';

type PkgManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

const INSTALL_COMMANDS: Record<PkgManager, string> = {
  npm: 'npm i @mo-elsherbiny/image-upload-kit',
  pnpm: 'pnpm add @mo-elsherbiny/image-upload-kit',
  yarn: 'yarn add @mo-elsherbiny/image-upload-kit',
  bun: 'bun add @mo-elsherbiny/image-upload-kit',
};

export interface NavbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  locale: 'en' | 'ar';
  onToggleLocale: () => void;
  activeBlurColor: string;
}

export function Navbar({
  theme,
  onToggleTheme,
  locale,
  onToggleLocale,
  activeBlurColor,
}: NavbarProps) {
  const [pkgManager, setPkgManager] = useState<PkgManager>('npm');
  const [copied, setCopied] = useState(false);

  const handleCopyInstall = async () => {
    const cmd = INSTALL_COMMANDS[pkgManager];
    await navigator.clipboard.writeText(cmd);
    setCopied(true);
    toast.success('Install command copied to clipboard!', {
      description: cmd,
    });
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 shadow-lg transition-colors duration-500"
            style={{
              background: `linear-gradient(135deg, ${activeBlurColor}, #0f172a)`,
            }}
          >
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold tracking-tight text-white">
                @mo-elsherbiny/image-upload-kit
              </span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-300">
                v1.1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sharp AVIF/WebP • WebP LQIP & BlurHash • 4-Edge Ambient Color • React & Headless
            </p>
          </div>
        </div>

        {/* Interactive Package Manager Copy Pill */}
        <div className="hidden items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/90 p-1 lg:flex">
          <div className="flex items-center gap-0.5 rounded-lg bg-slate-950/80 p-0.5">
            {(['npm', 'pnpm', 'yarn', 'bun'] as const).map((pm) => (
              <button
                key={pm}
                type="button"
                onClick={() => setPkgManager(pm)}
                className={`rounded-md px-2 py-1 font-mono text-[11px] font-medium transition ${
                  pkgManager === pm
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {pm}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCopyInstall}
            className="group flex items-center gap-2 rounded-lg px-2.5 py-1 font-mono text-xs text-slate-200 transition hover:bg-white/5"
            title="Click to copy install command"
          >
            <Terminal className="h-3.5 w-3.5 text-indigo-400" />
            <span>{INSTALL_COMMANDS[pkgManager]}</span>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-slate-400 transition group-hover:text-white" />
            )}
          </button>
        </div>

        {/* Right Controls: Locale, Theme, npm, GitHub */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleLocale}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-white/20 hover:bg-slate-800"
            title="Toggle English / Arabic RTL"
          >
            <Globe className="h-3.5 w-3.5 text-indigo-400" />
            <span>{locale === 'en' ? 'EN' : 'AR (RTL)'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 p-1.5 text-slate-200 transition hover:border-white/20 hover:bg-slate-800"
            title="Toggle Dark / Light Mode"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-300" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-300" />
            )}
          </button>

          <a
            href="https://www.npmjs.com/package/@mo-elsherbiny/image-upload-kit"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 font-mono text-xs font-medium text-rose-300 transition hover:bg-rose-500/20"
          >
            <Package className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">npm</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>

          <a
            href="https://github.com/MoElsherbiny/image-upload-kit"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
          >
            <span>GitHub</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>
        </div>
      </div>
    </header>
  );
}
