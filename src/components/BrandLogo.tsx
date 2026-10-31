import { BRAND } from '../brand';

interface BrandLogoProps {
  size?: number;
  showWordmark?: boolean;
}

/** The glowing "ME" mark from buildwithsherbo, with an optional wordmark. */
export function BrandLogo({ size = 34, showWordmark = true }: BrandLogoProps) {
  return (
    <a
      href={BRAND.site}
      target="_blank"
      rel="noreferrer"
      className="brand-link group inline-flex items-center gap-2.5"
      aria-label={`${BRAND.name} — visit website`}
    >
      <img
        src={BRAND.logo}
        alt=""
        width={size}
        height={Math.round(size * 0.56)}
        className="brand-mark h-auto object-contain"
        style={{ width: size }}
      />
      {showWordmark && (
        <span className="text-[15px] font-bold tracking-tight text-fg">
          build<span className="text-accent">with</span>sherbo
        </span>
      )}
    </a>
  );
}
