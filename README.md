# image-upload-kit-studio

> Interactive code-to-UI studio & Sharp optimization playground for [`@mo-elsherbiny/image-upload-kit`](https://www.npmjs.com/package/@mo-elsherbiny/image-upload-kit) — built by [buildwithsherbo](https://www.buildwithsherbo.com/).

[![Live Demo](https://img.shields.io/badge/Live%20Demo-upload--kit.buildwithsherbo.com-0284c7?style=for-the-badge)](https://upload-kit.buildwithsherbo.com)
[![npm version](https://img.shields.io/npm/v/@mo-elsherbiny/image-upload-kit?color=38bdf8&style=for-the-badge)](https://www.npmjs.com/package/@mo-elsherbiny/image-upload-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](./LICENSE)

---

## What is this?

**image-upload-kit-studio** is the official interactive developer playground for [`@mo-elsherbiny/image-upload-kit`](https://github.com/MoElsherbiny/image-upload-kit).

Instead of static documentation, it lets developers:
1. **Watch the Code Write Itself**: Synchronized Shiki IDE typing code milestone-by-milestone (`<AnimatedImage />`, server upload route, and React dropzone field) while the live preview mutates in real time at 60 FPS.
2. **Interactive 4-Layer Placeholder Lab**: Side-by-side comparison of **4-Edge Ambient Color**, **Client BlurHash**, **WebP LQIP Data URL**, and the final **Sharp AVIF/WebP asset**.
3. **Live Sharp Upload Sandbox**: Drop any photo to run real server-side Sharp size-guarding and watch the code editor re-type itself with your own image's metrics!

---

## Tech Stack

- **Framework**: Vite 6 + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + custom cursor glow tokens
- **Syntax Highlighting**: Shiki fine-grained core (`github-dark-default`)
- **Animation**: Motion (`motion/react`)
- **Image Optimization**: `@mo-elsherbiny/image-upload-kit/server` + Sharp

---

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/MoElsherbiny/image-upload-kit-studio.git
cd image-upload-kit-studio

# 2. Install dependencies
npm install

# 3. Start interactive studio (http://localhost:5173)
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

---

## Author & Brand

- **Identity**: [buildwithsherbo](https://www.buildwithsherbo.com/)
- **Author**: Mohamed Elsherbiny ([@MoElsherbiny](https://github.com/MoElsherbiny))
- **Core Library**: [`@mo-elsherbiny/image-upload-kit`](https://www.npmjs.com/package/@mo-elsherbiny/image-upload-kit)

Distributed under the [MIT License](./LICENSE).
