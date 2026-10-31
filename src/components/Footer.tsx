import { BookOpen, Github, Package } from 'lucide-react';
import { BRAND, PKG } from '../brand';
import { BrandLogo } from './BrandLogo';

const STEPS = [
  { title: 'Install', code: `npm i ${PKG.name}` },
  { title: 'Add the route', code: `export const { POST, DELETE } =\n  createUploadHttpHandler({ uploader });` },
  { title: 'Drop in the UI', code: `<ImageUploadProvider endpoint="/api/upload">\n  <SingleImageUpload preset="cover" onChange={save} />\n</ImageUploadProvider>` },
];

export function GetStarted() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {STEPS.map((step, i) => (
        <div key={step.title} data-glow-card className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 font-mono text-xs font-semibold text-accent">{i + 1}</span>
            <h3 className="text-sm font-semibold text-fg">{step.title}</h3>
          </div>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-[#0b0f19] p-3 font-mono text-[11.5px] leading-5 text-sky-100">{step.code}</pre>
        </div>
      ))}
    </div>
  );
}

const linkCls = 'inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-fg';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <BrandLogo size={40} />
          <p className="text-xs text-muted">
            Designed & built by{' '}
            <a href={BRAND.site} target="_blank" rel="noreferrer" className="font-medium text-fg-2 hover:text-accent">
              {BRAND.name}
            </a>{' '}
            · MIT licensed
          </p>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-5" aria-label="Project links">
          <a href={PKG.docs} target="_blank" rel="noreferrer" className={linkCls}><BookOpen className="h-4 w-4" /> Docs</a>
          <a href={PKG.npm} target="_blank" rel="noreferrer" className={linkCls}><Package className="h-4 w-4" /> npm</a>
          <a href={PKG.repo} target="_blank" rel="noreferrer" className={linkCls}><Github className="h-4 w-4" /> GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
