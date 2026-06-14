import seedrandom from "seedrandom";

export type StyleType = "gradient" | "dots" | "geo" | "lines" | "topographic" | "blob" | "noise" | "plain";
export type PaletteType = "warm" | "cool" | "earth" | "mono" | "neon" | "pastel" | "dark";

export const PALETTES: Record<PaletteType, string[]> = {
  warm: ["#FF5733", "#FF8D1A", "#FFC300", "#FF4500", "#C70039"],
  cool: ["#00B4D8", "#0077B6", "#03045E", "#90E0EF", "#48CAE4"],
  earth: ["#606C38", "#283618", "#FEFAE0", "#DDA15E", "#BC6C25"],
  mono: ["#1B1B1B", "#4A4A4A", "#858585", "#CCCCCC", "#E5E5E5"],
  neon: ["#FF00FF", "#00FFFF", "#39FF14", "#FFFF00", "#FF0099"],
  pastel: ["#FFB3BA", "#FFDFBA", "#FFFFBA", "#BAFFC9", "#BAE1FF"],
  dark: ["#0B0C10", "#1F2833", "#2C3531", "#116466", "#D9B08C"],
};

type Point = { x: number; y: number };

const format = (value: number) => Number(value.toFixed(2));

const hexToRgb = (hex: string) => {
  const clean = hex.replace("#", "");
  const value = parseInt(clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const luminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export function generateSVG(
  style: StyleType,
  seed: string | number,
  paletteTheme: PaletteType,
  width: number = 800,
  height: number = 600
): string {
  const prng = seedrandom(seed.toString());
  const colors = PALETTES[paletteTheme];
  const getRandomColor = () => colors[Math.floor(prng() * colors.length)];
  const rRange = (min: number, max: number) => prng() * (max - min) + min;
  const bg = colors[0];
  const minSide = Math.min(width, height);
  const maxSide = Math.max(width, height);
  const sortedByLight = [...colors].sort((a, b) => luminance(a) - luminance(b));

  let content = "";

  switch (style) {
    case "plain": {
      content = `
        <defs>
          <radialGradient id="vignette" cx="50%" cy="48%" r="72%">
            <stop offset="0%" stop-color="#000000" stop-opacity="0" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.25" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="${bg}" />
        <rect width="100%" height="100%" fill="url(#vignette)" />
      `;
      break;
    }

    case "gradient": {
      const [color1, color2, color3] = [getRandomColor(), getRandomColor(), getRandomColor()];
      const isRadial = prng() > 0.5;
      const noiseOpacity = rRange(0.05, 0.1).toFixed(2);
      const gradientDef = isRadial
        ? `<radialGradient id="grad1" cx="${format(rRange(25, 75))}%" cy="${format(rRange(25, 75))}%" r="${format(rRange(65, 95))}%" fx="${format(rRange(15, 85))}%" fy="${format(rRange(15, 85))}%">`
        : `<linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${format(rRange(0, 360))} ${format(width / 2)} ${format(height / 2)})">`;

      content = `
        <defs>
          ${gradientDef}
            <stop offset="0%" stop-color="${color1}" />
            <stop offset="52%" stop-color="${color2}" />
            <stop offset="100%" stop-color="${color3}" />
          ${isRadial ? "</radialGradient>" : "</linearGradient>"}
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="${rRange(0.7, 1.1).toFixed(2)}" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad1)" />
        <rect width="100%" height="100%" filter="url(#grain)" opacity="${noiseOpacity}" />
      `;
      break;
    }

    case "dots": {
      const clusterCount = Math.floor(rRange(4, 8));
      const dotCount = Math.floor(rRange(80, 140));

      content = `
        <defs>
          <filter id="softBokeh"><feGaussianBlur stdDeviation="8" /></filter>
          <filter id="dotGrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="${bg}" />
      `;

      for (let i = 0; i < clusterCount; i++) {
        const cx = rRange(0, width);
        const cy = rRange(0, height);
        const radius = rRange(minSide * 0.08, minSide * 0.22);
        const fill = getRandomColor();
        content += `<circle cx="${format(cx)}" cy="${format(cy)}" r="${format(radius)}" fill="${fill}" opacity="${rRange(0.16, 0.32).toFixed(2)}" filter="url(#softBokeh)" />`;
      }

      for (let i = 0; i < dotCount; i++) {
        const clusterX = rRange(0, width);
        const clusterY = rRange(0, height);
        const jitter = rRange(minSide * 0.02, minSide * 0.18);
        const cx = clusterX + rRange(-jitter, jitter);
        const cy = clusterY + rRange(-jitter, jitter);
        const r = prng() > 0.82 ? rRange(minSide * 0.025, minSide * 0.07) : rRange(2, Math.max(4, minSide * 0.014));
        const filter = prng() > 0.82 ? ' filter="url(#softBokeh)"' : "";
        content += `<circle cx="${format(cx)}" cy="${format(cy)}" r="${format(r)}" fill="${getRandomColor()}" opacity="${rRange(0.35, 0.82).toFixed(2)}"${filter} />`;
      }

      content += `<rect width="100%" height="100%" filter="url(#dotGrain)" opacity="0.06" />`;
      break;
    }

    case "geo": {
      const shapeCount = Math.floor(rRange(24, 46));
      const polygonPoints = (cx: number, cy: number, radius: number, sides: number, rotation: number) =>
        Array.from({ length: sides }, (_, index) => {
          const angle = rotation + (Math.PI * 2 * index) / sides;
          return `${format(cx + Math.cos(angle) * radius)},${format(cy + Math.sin(angle) * radius)}`;
        }).join(" ");

      content = `
        <defs>
          <linearGradient id="geoOverlay" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12" />
            <stop offset="50%" stop-color="#000000" stop-opacity="0" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.24" />
          </linearGradient>
          <filter id="geoBlur"><feGaussianBlur stdDeviation="${format(rRange(3, 7))}" /></filter>
        </defs>
        <rect width="100%" height="100%" fill="${bg}" />
      `;

      for (let i = 0; i < shapeCount; i++) {
        const cx = rRange(-width * 0.08, width * 1.08);
        const cy = rRange(-height * 0.08, height * 1.08);
        const size = rRange(minSide * 0.06, minSide * 0.28);
        const color = getRandomColor();
        const opacity = rRange(0.24, 0.74).toFixed(2);
        const rotation = rRange(0, 360);
        const blur = prng() > 0.76 ? ' filter="url(#geoBlur)"' : "";
        const kind = Math.floor(rRange(0, 4));

        if (kind === 0) {
          const w = size * rRange(0.7, 1.8);
          const h = size * rRange(0.45, 1.3);
          content += `<rect x="${format(cx - w / 2)}" y="${format(cy - h / 2)}" width="${format(w)}" height="${format(h)}" rx="${format(size * 0.06)}" fill="${color}" opacity="${opacity}" transform="rotate(${format(rotation)} ${format(cx)} ${format(cy)})"${blur} />`;
        } else if (kind === 1) {
          content += `<polygon points="${polygonPoints(cx, cy, size, 3, rRange(0, Math.PI * 2))}" fill="${color}" opacity="${opacity}" transform="rotate(${format(rotation)} ${format(cx)} ${format(cy)})"${blur} />`;
        } else if (kind === 2) {
          content += `<polygon points="${polygonPoints(cx, cy, size, 6, rRange(0, Math.PI * 2))}" fill="${color}" opacity="${opacity}" transform="rotate(${format(rotation)} ${format(cx)} ${format(cy)})"${blur} />`;
        } else {
          const points = `${format(cx)},${format(cy - size)} ${format(cx + size * 0.75)},${format(cy)} ${format(cx)},${format(cy + size)} ${format(cx - size * 0.75)},${format(cy)}`;
          content += `<polygon points="${points}" fill="${color}" opacity="${opacity}" transform="rotate(${format(rotation)} ${format(cx)} ${format(cy)})"${blur} />`;
        }
      }

      content += `<rect width="100%" height="100%" fill="url(#geoOverlay)" />`;
      break;
    }

    case "lines": {
      const thin = format(rRange(1, 2));
      const thick = format(rRange(8, 20));
      const tile = format(rRange(46, 82));

      content = `
        <defs>
          <pattern id="stripeA" width="${tile}" height="${tile}" patternUnits="userSpaceOnUse" patternTransform="rotate(${format(rRange(28, 42))})">
            <rect width="${tile}" height="${tile}" fill="transparent" />
            <line x1="0" y1="${format(tile * 0.22)}" x2="${tile}" y2="${format(tile * 0.22)}" stroke="${getRandomColor()}" stroke-width="${thin}" opacity="0.72" />
            <line x1="0" y1="${format(tile * 0.72)}" x2="${tile}" y2="${format(tile * 0.72)}" stroke="${getRandomColor()}" stroke-width="${thick}" opacity="0.42" />
          </pattern>
          <pattern id="stripeB" width="${format(tile * 1.4)}" height="${format(tile * 1.4)}" patternUnits="userSpaceOnUse" patternTransform="rotate(${format(rRange(118, 132))})">
            <line x1="0" y1="${format(tile * 0.3)}" x2="${format(tile * 1.4)}" y2="${format(tile * 0.3)}" stroke="${getRandomColor()}" stroke-width="${format(rRange(1, 2))}" opacity="0.28" />
            <line x1="0" y1="${format(tile)}" x2="${format(tile * 1.4)}" y2="${format(tile)}" stroke="${getRandomColor()}" stroke-width="${format(rRange(8, 20))}" opacity="0.18" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="${bg}" />
        <rect width="100%" height="100%" fill="url(#stripeA)" />
        <rect width="100%" height="100%" fill="url(#stripeB)" />
      `;
      break;
    }

    case "topographic": {
      const focalX = rRange(width * 0.18, width * 0.82);
      const focalY = rRange(height * 0.18, height * 0.82);
      const rings = Math.floor(rRange(6, 13));
      const dark = sortedByLight[0];
      const light = sortedByLight[sortedByLight.length - 1];

      const closedPath = (points: Point[]) => {
        let d = `M ${format(points[0].x)} ${format(points[0].y)}`;
        for (let i = 0; i < points.length; i++) {
          const current = points[i];
          const next = points[(i + 1) % points.length];
          const angle = Math.atan2(next.y - current.y, next.x - current.x);
          const distance = Math.hypot(next.x - current.x, next.y - current.y);
          const controlDistance = distance * rRange(0.28, 0.48);
          const c1 = {
            x: current.x + Math.cos(angle) * controlDistance + rRange(-minSide * 0.025, minSide * 0.025),
            y: current.y + Math.sin(angle) * controlDistance + rRange(-minSide * 0.025, minSide * 0.025),
          };
          const c2 = {
            x: next.x - Math.cos(angle) * controlDistance + rRange(-minSide * 0.025, minSide * 0.025),
            y: next.y - Math.sin(angle) * controlDistance + rRange(-minSide * 0.025, minSide * 0.025),
          };
          d += ` C ${format(c1.x)} ${format(c1.y)}, ${format(c2.x)} ${format(c2.y)}, ${format(next.x)} ${format(next.y)}`;
        }
        return `${d} Z`;
      };

      content = `<rect width="100%" height="100%" fill="${bg}" />`;
      for (let ring = 1; ring <= rings; ring++) {
        const progress = ring / rings;
        const rx = minSide * (0.08 + progress * 0.72) * rRange(0.88, 1.16);
        const ry = minSide * (0.06 + progress * 0.48) * rRange(0.86, 1.22);
        const rotation = rRange(0, Math.PI);
        const points = Array.from({ length: 8 }, (_, index) => {
          const angle = (Math.PI * 2 * index) / 8;
          const distortedRx = rx * rRange(0.86, 1.14);
          const distortedRy = ry * rRange(0.86, 1.14);
          const x = Math.cos(angle) * distortedRx;
          const y = Math.sin(angle) * distortedRy;
          return {
            x: focalX + x * Math.cos(rotation) - y * Math.sin(rotation),
            y: focalY + x * Math.sin(rotation) + y * Math.cos(rotation),
          };
        });
        const stroke = progress > 0.5 ? light : dark;
        content += `<path d="${closedPath(points)}" fill="${getRandomColor()}" fill-opacity="0.05" stroke="${stroke}" stroke-width="${format(rRange(1.2, 2.8))}" opacity="${rRange(0.44, 0.82).toFixed(2)}" />`;
      }
      break;
    }

    case "blob": {
      const blobCount = Math.floor(rRange(3, 6));
      const organicPath = (cx: number, cy: number, radius: number) => {
        const pointCount = Math.floor(rRange(5, 9));
        const points = Array.from({ length: pointCount }, (_, index) => {
          const angle = (Math.PI * 2 * index) / pointCount + rRange(-0.18, 0.18);
          const r = radius * rRange(0.62, 1.18);
          return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, angle };
        });
        let d = `M ${format(points[0].x)} ${format(points[0].y)}`;
        for (let i = 0; i < points.length; i++) {
          const current = points[i];
          const next = points[(i + 1) % points.length];
          const currentHandle = radius * rRange(0.3, 0.9);
          const nextHandle = radius * rRange(0.3, 0.9);
          const c1 = {
            x: current.x + Math.cos(current.angle + Math.PI / 2) * currentHandle,
            y: current.y + Math.sin(current.angle + Math.PI / 2) * currentHandle,
          };
          const c2 = {
            x: next.x - Math.cos(next.angle + Math.PI / 2) * nextHandle,
            y: next.y - Math.sin(next.angle + Math.PI / 2) * nextHandle,
          };
          d += ` C ${format(c1.x)} ${format(c1.y)}, ${format(c2.x)} ${format(c2.y)}, ${format(next.x)} ${format(next.y)}`;
        }
        return `${d} Z`;
      };

      content = `
        <defs>
          <filter id="blobBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="30" />
          </filter>
          <radialGradient id="blobShade" cx="50%" cy="45%" r="75%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.22" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="${bg}" />
      `;

      for (let i = 0; i < blobCount; i++) {
        const radius = rRange(minSide * 0.18, maxSide * 0.36);
        const cx = rRange(-width * 0.08, width * 1.08);
        const cy = rRange(-height * 0.08, height * 1.08);
        content += `<path d="${organicPath(cx, cy, radius)}" fill="${getRandomColor()}" opacity="${rRange(0.48, 0.78).toFixed(2)}" filter="url(#blobBlur)" />`;
      }

      content += `<rect width="100%" height="100%" fill="url(#blobShade)" />`;
      break;
    }

    case "noise": {
      const primary = hexToRgb(colors[0]);
      const redShift = (primary.r / 255 * 0.34).toFixed(3);
      const greenShift = (primary.g / 255 * 0.34).toFixed(3);
      const blueShift = (primary.b / 255 * 0.34).toFixed(3);

      content = `
        <defs>
          <filter id="noiseFilter">
            <feTurbulence type="turbulence" baseFrequency="${rRange(0.015, 0.04).toFixed(3)}" numOctaves="4" seed="${Math.floor(rRange(1, 9999))}" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0.55 0.18 0.08 0 ${redShift} 0.10 0.56 0.12 0 ${greenShift} 0.08 0.14 0.58 0 ${blueShift} 0 0 0 1 0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="${sortedByLight[0]}" />
        <rect width="100%" height="100%" filter="url(#noiseFilter)" opacity="0.92" />
        <rect width="100%" height="100%" fill="${colors[0]}" opacity="0.4" />
      `;
      break;
    }

    default: {
      content = `<rect width="100%" height="100%" fill="${bg}" />`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${content}</svg>`;
}
