/** Brand identity & links used across the demo. */
export const BRAND = {
  name: 'buildwithsherbo',
  author: 'Mohamed Elsherbiny',
  site: 'https://www.buildwithsherbo.com/',
  github: 'https://github.com/MoElsherbiny',
  logo: '/brand/logo-mark.png',
} as const;

/** The published npm package (import paths match the live unscoped npm package). */
export const PKG = {
  name: 'img-upload-kit',
  version: '1.1.1',
  npm: 'https://www.npmjs.com/package/img-upload-kit',
  repo: 'https://github.com/MoElsherbiny/image-upload-kit',
  docs: 'https://github.com/MoElsherbiny/image-upload-kit#readme',
} as const;

export const INSTALL_COMMANDS = {
  npm: `npm i ${PKG.name}`,
  pnpm: `pnpm add ${PKG.name}`,
  yarn: `yarn add ${PKG.name}`,
  bun: `bun add ${PKG.name}`,
} as const;

export type PackageManager = keyof typeof INSTALL_COMMANDS;
