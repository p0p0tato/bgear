import seedrandom from "seedrandom";

export type StyleType = "gradient" | "dots" | "geo" | "lines" | "topographic" | "blob" | "noise" | "plain";
export type PaletteType = "warm" | "cool" | "earth" | "mono" | "neon" | "pastel" | "dark";
export type GeneratorOptions = {
  spacing?: number;
  size?: number;
  density?: number;
  amplitude?: number;
  lineCount?: number;
  strokeWidth?: number;
};

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

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`;

const mixHex = (hex: string, target: string, amount: number) => {
  const from = hexToRgb(hex);
  const to = hexToRgb(target);
  return rgbToHex(
    from.r + (to.r - from.r) * amount,
    from.g + (to.g - from.g) * amount,
    from.b + (to.b - from.b) * amount
  );
};

const luminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const optionPercent = (value: number | undefined) =>
  value === undefined || !Number.isFinite(value) ? undefined : Math.min(100, Math.max(1, value));

export function generateSVG(
  style: StyleType,
  seed: string | number,
  paletteTheme: PaletteType,
  width: number = 800,
  height: number = 600,
  options: GeneratorOptions = {}
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
      const gradientColors = [...colors]
        .sort((a, b) => luminance(a) - luminance(b))
        .map((color, index) => {
          if (index === 0) return mixHex(color, "#050505", 0.18);
          if (index === colors.length - 1) return mixHex(color, "#ffffff", 0.24);
          return mixHex(color, "#ffffff", 0.1);
        });

      const pickColor = () => gradientColors[Math.floor(prng() * gradientColors.length)];
      const angle = Math.floor(prng() * 360);
      const rad = (angle * Math.PI) / 180;
      const x1pct = (50 - 50 * Math.cos(rad)).toFixed(1);
      const y1pct = (50 - 50 * Math.sin(rad)).toFixed(1);
      const x2pct = (50 + 50 * Math.cos(rad)).toFixed(1);
      const y2pct = (50 + 50 * Math.sin(rad)).toFixed(1);
      const baseA = mixHex(gradientColors[0], "#000000", 0.08);
      const baseB = mixHex(pickColor(), "#ffffff", 0.12);
      const baseC = mixHex(gradientColors[gradientColors.length - 1], "#000000", 0.1);
      const midStop = 48;
      const sizeOption = optionPercent(options.size);
      const effectiveMidStop = sizeOption !== undefined ? Math.round(20 + (sizeOption / 100) * 60) : midStop;
      const blurAmount = format(Math.max(36, minSide * 0.11));
      const grainOpacity = (0.018 + prng() * 0.018).toFixed(3);
      const shadeOpacity = paletteTheme === "dark" || paletteTheme === "mono" ? "0.34" : "0.24";
      const orbs = Array.from({ length: 5 }, (_, index) => {
        const fill = pickColor();
        const orbX = format(rRange(-width * 0.12, width * 1.12));
        const orbY = format(rRange(-height * 0.12, height * 1.12));
        const rx = format(rRange(maxSide * 0.22, maxSide * 0.48));
        const ry = format(rRange(minSide * 0.22, minSide * 0.52));
        const opacity = (0.36 + prng() * 0.2 - index * 0.025).toFixed(3);
        const rotation = format(rRange(0, 360));
        return `<ellipse cx="${orbX}" cy="${orbY}" rx="${rx}" ry="${ry}" fill="${fill}" opacity="${opacity}" transform="rotate(${rotation} ${orbX} ${orbY})" />`;
      }).join("");

      content = `
        <defs>
          <linearGradient id="g1" x1="${x1pct}%" y1="${y1pct}%" x2="${x2pct}%" y2="${y2pct}%">
            <stop offset="0%" stop-color="${baseA}" />
            <stop offset="${effectiveMidStop}%" stop-color="${baseB}" />
            <stop offset="100%" stop-color="${baseC}" />
          </linearGradient>
          <radialGradient id="g2" cx="${format(rRange(28, 72))}%" cy="${format(rRange(22, 78))}%" r="82%">
            <stop offset="0%" stop-color="${mixHex(pickColor(), "#ffffff", 0.18)}" stop-opacity="0.55" />
            <stop offset="52%" stop-color="${pickColor()}" stop-opacity="0.18" />
            <stop offset="100%" stop-color="${baseA}" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="vignette" cx="50%" cy="46%" r="78%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08" />
            <stop offset="62%" stop-color="#000000" stop-opacity="0" />
            <stop offset="100%" stop-color="#000000" stop-opacity="${shadeOpacity}" />
          </radialGradient>
          <filter id="meshBlur" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="${blurAmount}" />
          </filter>
          <filter id="grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="${(0.75 + prng() * 0.25).toFixed(3)}" numOctaves="3" stitchTiles="stitch" result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
          </filter>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#g1)" />
        <g filter="url(#meshBlur)">
          ${orbs}
        </g>
        <rect width="${width}" height="${height}" fill="url(#g2)" />
        <rect width="${width}" height="${height}" fill="url(#vignette)" />
        <rect width="${width}" height="${height}" filter="url(#grain)" opacity="${grainOpacity}" style="mix-blend-mode:soft-light" />
      `;
      break;
    }

    case "dots": {
      const dotColor = colors[Math.floor(1 + prng() * (colors.length - 1))];
      const accentColor = colors[Math.floor(1 + prng() * (colors.length - 1))];

      const cols = 28 + Math.floor(prng() * 20);
      const spacingOption = optionPercent(options.spacing);
      const effectiveCols = spacingOption !== undefined
        ? Math.round(48 - (spacingOption / 100) * 40)
        : cols;
      const cellW = width / effectiveCols;
      const cellH = cellW;
      const rows = Math.ceil(height / cellH) + 1;

      const styleRoll = prng();
      const useHalftoneFade = styleRoll < 0.4;
      const useRowOffset = prng() > 0.4;
      const useAccent = prng() > 0.5;
      const baseDotRatio = 0.18 + prng() * 0.22;
      const dotSizeOption = optionPercent(options.size);
      const effectiveDotRatio = dotSizeOption !== undefined
        ? 0.08 + (dotSizeOption / 100) * 0.4
        : baseDotRatio;
      const maxDotRatio = Math.max(0.42, effectiveDotRatio);

      const focalX = width * (0.2 + prng() * 0.6);
      const focalY = height * (0.2 + prng() * 0.6);
      const maxDist = Math.sqrt(width * width + height * height) / 2;

      let dots = "";

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < effectiveCols + 1; col++) {
          const offsetX = useRowOffset && row % 2 === 1 ? cellW / 2 : 0;
          const cx = col * cellW + offsetX + cellW / 2;
          const cy = row * cellH + cellH / 2;

          let r: number;
          if (useHalftoneFade) {
            const dist = Math.sqrt((cx - focalX) ** 2 + (cy - focalY) ** 2);
            const t = 1 - Math.min(dist / maxDist, 1);
            r = (effectiveDotRatio + t * (maxDotRatio - effectiveDotRatio)) * cellW;
          } else {
            r = (effectiveDotRatio + (prng() * 0.04 - 0.02)) * cellW;
          }

          if (r < 0.5) continue;

          const colorRoll = prng();
          let fill = dotColor;
          if (useAccent && colorRoll > 0.88) fill = accentColor;

          dots += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(2)}" fill="${fill}" />\n`;
        }
      }

      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${bg}" />
  ${dots}
</svg>`;
    }

    case "geo": {
      const shapeCount = Math.floor(rRange(24, 46));
      const densityOption = optionPercent(options.density);
      const shapeSizeOption = optionPercent(options.size);
      const effectiveShapeCount = densityOption !== undefined
        ? Math.round(8 + (densityOption / 100) * 72)
        : shapeCount;
      const effectiveShapeSize = shapeSizeOption !== undefined
        ? (width / 8) * (0.1 + (shapeSizeOption / 100) * 0.9)
        : undefined;
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

      for (let i = 0; i < effectiveShapeCount; i++) {
        const cx = rRange(-width * 0.08, width * 1.08);
        const cy = rRange(-height * 0.08, height * 1.08);
        const size = effectiveShapeSize !== undefined
          ? rRange(effectiveShapeSize * 0.45, effectiveShapeSize * 1.25)
          : rRange(minSide * 0.06, minSide * 0.28);
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
      const lineColor = colors[Math.floor(1 + prng() * (colors.length - 1))];
      const accentColor = colors[Math.floor(1 + prng() * (colors.length - 1))];

      const styleRoll = prng();
      const useWavy = styleRoll < 0.25;
      const useFingerprint = styleRoll < 0.5;
      const useDiagonal = styleRoll < 0.75;

      const lineCount = 18 + Math.floor(prng() * 24);
      const strokeWidth = (0.6 + prng() * 1.8).toFixed(2);
      const lineCountOption = optionPercent(options.lineCount);
      const amplitudeOption = optionPercent(options.amplitude);
      const strokeWidthOption = optionPercent(options.strokeWidth);
      const effectiveLineCount = lineCountOption !== undefined
        ? Math.round(6 + (lineCountOption / 100) * 54)
        : lineCount;
      const effectiveAmplitude = amplitudeOption !== undefined
        ? 1 + (amplitudeOption / 100) * (height / effectiveLineCount) * 2.5
        : undefined;
      const effectiveStrokeWidth = strokeWidthOption !== undefined
        ? (0.3 + (strokeWidthOption / 100) * 5.7).toFixed(2)
        : strokeWidth;
      const accentStroke = (Number(effectiveStrokeWidth) * 1.8).toFixed(2);
      const useAccentLine = prng() > 0.5;
      const accentInterval = 3 + Math.floor(prng() * 5);

      let paths = "";

      if (useWavy) {
        const amplitude = effectiveAmplitude ?? 8 + prng() * (height / effectiveLineCount) * 1.2;
        const frequency = 1.5 + prng() * 3.5;
        const phaseShift = prng() * Math.PI * 2;
        const spacing = height / (effectiveLineCount + 1);

        for (let i = 1; i <= effectiveLineCount; i++) {
          const baseY = i * spacing;
          const drift = (prng() - 0.5) * amplitude * 0.3;
          const amp = amplitude * (0.6 + prng() * 0.8);
          const freq = frequency * (0.85 + prng() * 0.3);
          const phase = phaseShift + i * 0.15;
          const steps = 80;
          const points: string[] = [];

          for (let s = 0; s <= steps; s++) {
            const x = (s / steps) * width;
            const y = baseY + drift + Math.sin((s / steps) * Math.PI * 2 * freq + phase) * amp;
            points.push(s === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : `L${x.toFixed(1)},${y.toFixed(1)}`);
          }

          const isAccent = useAccentLine && i % accentInterval === 0;
          const color = isAccent ? accentColor : lineColor;
          const sw = isAccent ? accentStroke : effectiveStrokeWidth;
          const opacity = isAccent ? "0.9" : (0.4 + prng() * 0.5).toFixed(2);

          paths += `<path d="${points.join(" ")}" stroke="${color}" stroke-width="${sw}" fill="none" opacity="${opacity}" />\n`;
        }
      } else if (useFingerprint) {
        const cx = width * (0.3 + prng() * 0.4);
        const cy = height * (0.3 + prng() * 0.4);
        const maxR = Math.max(width, height) * 0.65;
        const spacing = maxR / effectiveLineCount;
        const squeeze = 0.4 + prng() * 0.5;

        for (let i = 1; i <= effectiveLineCount; i++) {
          const r = i * spacing;
          const rx = r;
          const ry = r * squeeze;
          const steps = 120;
          const points: string[] = [];

          for (let s = 0; s <= steps; s++) {
            const angle = (s / steps) * Math.PI * 2;
            const distortion = (prng() * 2 - 1) * (r * 0.04);
            const x = cx + (rx + distortion) * Math.cos(angle);
            const y = cy + (ry + distortion) * Math.sin(angle);
            points.push(s === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : `L${x.toFixed(1)},${y.toFixed(1)}`);
          }
          points.push("Z");

          const isAccent = useAccentLine && i % accentInterval === 0;
          const color = isAccent ? accentColor : lineColor;
          const sw = isAccent ? accentStroke : effectiveStrokeWidth;
          const opacity = isAccent ? "0.9" : (0.35 + prng() * 0.55).toFixed(2);

          paths += `<path d="${points.join(" ")}" stroke="${color}" stroke-width="${sw}" fill="none" opacity="${opacity}" />\n`;
        }
      } else if (useDiagonal) {
        const angle = 25 + Math.floor(prng() * 40);
        const rad = (angle * Math.PI) / 180;
        const amplitude = effectiveAmplitude ?? 6 + prng() * 20;
        const frequency = 1.2 + prng() * 2.5;
        const phase = prng() * Math.PI * 2;
        const diagLen = Math.sqrt(width * width + height * height);
        const spacing = diagLen / (effectiveLineCount + 1);

        for (let i = 0; i <= effectiveLineCount + 4; i++) {
          const offset = i * spacing - diagLen * 0.3;
          const steps = 100;
          const points: string[] = [];

          for (let s = 0; s <= steps; s++) {
            const t = (s / steps) * diagLen * 1.4 - diagLen * 0.2;
            const wave = Math.sin((s / steps) * Math.PI * 2 * frequency + phase + i * 0.25) * amplitude;
            const x = t * Math.cos(rad) - offset * Math.sin(rad) + wave * Math.sin(rad);
            const y = t * Math.sin(rad) + offset * Math.cos(rad) + wave * Math.cos(rad);
            points.push(s === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : `L${x.toFixed(1)},${y.toFixed(1)}`);
          }

          const isAccent = useAccentLine && i % accentInterval === 0;
          const color = isAccent ? accentColor : lineColor;
          const sw = isAccent ? accentStroke : effectiveStrokeWidth;
          const opacity = isAccent ? "0.85" : (0.3 + prng() * 0.6).toFixed(2);

          paths += `<path d="${points.join(" ")}" stroke="${color}" stroke-width="${sw}" fill="none" opacity="${opacity}" />\n`;
        }
      } else {
        const angle = Math.floor(prng() * 180);
        const rad = (angle * Math.PI) / 180;
        const diagLen = Math.sqrt(width * width + height * height);
        const spacing = (diagLen / (effectiveLineCount + 1)) * (0.4 + prng() * 0.6);
        const totalLines = Math.floor(diagLen / spacing) + 4;

        for (let i = 0; i <= totalLines; i++) {
          const offset = i * spacing - diagLen * 0.3;
          const x1 = (width / 2) + (-diagLen) * Math.cos(rad) - offset * Math.sin(rad);
          const y1 = (height / 2) + (-diagLen) * Math.sin(rad) + offset * Math.cos(rad);
          const x2 = (width / 2) + diagLen * Math.cos(rad) - offset * Math.sin(rad);
          const y2 = (height / 2) + diagLen * Math.sin(rad) + offset * Math.cos(rad);
          const isAccent = useAccentLine && i % accentInterval === 0;
          const color = isAccent ? accentColor : lineColor;
          const weight = isAccent ? Number(accentStroke) : 0.4 + prng() * 2.5;
          const opacity = isAccent ? "0.9" : (0.25 + prng() * 0.65).toFixed(2);

          paths += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${weight.toFixed(2)}" opacity="${opacity}" />\n`;
        }
      }

      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${bg}" />
  ${paths}
</svg>`;
    }

    case "topographic": {
      const focalX = rRange(width * 0.18, width * 0.82);
      const focalY = rRange(height * 0.18, height * 0.82);
      const rings = Math.floor(rRange(6, 13));
      const contourCountOption = optionPercent(options.lineCount);
      const distortionOption = optionPercent(options.amplitude);
      const effectiveContourCount = contourCountOption !== undefined
        ? Math.round(4 + (contourCountOption / 100) * 16)
        : rings;
      const distortion = distortionOption !== undefined ? (distortionOption / 100) * 0.35 : 0.025;
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
            x: current.x + Math.cos(angle) * controlDistance + rRange(-minSide * distortion, minSide * distortion),
            y: current.y + Math.sin(angle) * controlDistance + rRange(-minSide * distortion, minSide * distortion),
          };
          const c2 = {
            x: next.x - Math.cos(angle) * controlDistance + rRange(-minSide * distortion, minSide * distortion),
            y: next.y - Math.sin(angle) * controlDistance + rRange(-minSide * distortion, minSide * distortion),
          };
          d += ` C ${format(c1.x)} ${format(c1.y)}, ${format(c2.x)} ${format(c2.y)}, ${format(next.x)} ${format(next.y)}`;
        }
        return `${d} Z`;
      };

      content = `<rect width="100%" height="100%" fill="${bg}" />`;
      for (let ring = 1; ring <= effectiveContourCount; ring++) {
        const progress = ring / effectiveContourCount;
        const rx = minSide * (0.08 + progress * 0.72) * rRange(0.88, 1.16);
        const ry = minSide * (0.06 + progress * 0.48) * rRange(0.86, 1.22);
        const rotation = rRange(0, Math.PI);
        const points = Array.from({ length: 8 }, (_, index) => {
          const angle = (Math.PI * 2 * index) / 8;
          const distortedRx = rx * rRange(1 - distortion, 1 + distortion);
          const distortedRy = ry * rRange(1 - distortion, 1 + distortion);
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
      const blobDensityOption = optionPercent(options.density);
      const blobSizeOption = optionPercent(options.size);
      const effectiveBlobCount = blobDensityOption !== undefined
        ? Math.round(2 + (blobDensityOption / 100) * 6)
        : blobCount;
      const effectiveBlobRadius = blobSizeOption !== undefined
        ? minSide * 0.1 + (blobSizeOption / 100) * (minSide * 0.5)
        : undefined;
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

      for (let i = 0; i < effectiveBlobCount; i++) {
        const radius = effectiveBlobRadius !== undefined
          ? rRange(effectiveBlobRadius * 0.75, effectiveBlobRadius * 1.35)
          : rRange(minSide * 0.18, maxSide * 0.36);
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
      const noiseSizeOption = optionPercent(options.size);
      const baseFreq = rRange(0.015, 0.04).toFixed(3);
      const effectiveBaseFreq = noiseSizeOption !== undefined
        ? (0.005 + (noiseSizeOption / 100) * 0.055).toFixed(4)
        : baseFreq;

      content = `
        <defs>
          <filter id="noiseFilter">
            <feTurbulence type="turbulence" baseFrequency="${effectiveBaseFreq}" numOctaves="4" seed="${Math.floor(rRange(1, 9999))}" stitchTiles="stitch" />
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
