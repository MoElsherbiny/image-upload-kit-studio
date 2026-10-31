import { Github, Languages, Moon, Package, Sun } from 'lucide-react';
import { PKG } from '../brand';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  locale: 'en' | 'ar';
  onToggleLocale: () => void;
}

const NAV_LINKS = [
  { href: '#studio', label: 'Code studio' },
  { href: '#lab', label: 'Placeholder lab' },
  { href: '#get-started', label: 'Get started' },
];

const iconBtn =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition hover:border-line-strong hover:text-fg';

export function Navbar({ theme, onToggleTheme, locale, onToggleLocale }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <BrandLogo />
          <span className="hidden h-5 w-px bg-line-strong sm:block" aria-hidden />
          <span className="hidden font-mono text-xs text-muted sm:block">image-upload-kit</span>
        </div>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-fg"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleLocale}
            className={`${iconBtn} w-auto gap-1.5 px-2.5 font-mono text-xs`}
            aria-label="Switch upload UI language"
            title="Switch upload UI language (English / العربية)"
          >
            <Languages className="h-4 w-4" />
            {locale === 'en' ? 'EN' : 'AR'}
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            className={iconBtn}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <a href={PKG.npm} target="_blank" rel="noreferrer" className={iconBtn} aria-label="npm package">
            <Package className="h-4 w-4" />
          </a>
          <a href={PKG.repo} target="_blank" rel="noreferrer" className={iconBtn} aria-label="GitHub repository">
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
