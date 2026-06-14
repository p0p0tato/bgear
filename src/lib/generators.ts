import seedrandom from 'seedrandom';

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

export function generateSVG(
  style: StyleType,
  seed: string | number,
  paletteTheme: PaletteType,
  width: number = 800,
  height: number = 600
): string {
  // Initialize deterministic PRNG
  const prng = seedrandom(seed.toString());

  const colors = PALETTES[paletteTheme];
  
  // Helper for repeatable random colors
  const getRandomColor = () => colors[Math.floor(prng() * colors.length)];
  const getBackgroundColor = () => colors[0]; // Let first color be standard bg color

  // Random ranges
  const rRange = (min: number, max: number) => prng() * (max - min) + min;

  let content = "";
  const bg = getBackgroundColor();

  switch (style) {
    case "plain":
      content = `<rect width="100%" height="100%" fill="${bg}" />`;
      break;

    case "gradient":
      const color1 = getRandomColor();
      const color2 = getRandomColor();
      const angle = Math.floor(rRange(0, 360));
      content = `
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${angle} ${width/2} ${height/2})">
            <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad1)" />
      `;
      break;

    case "dots":
      content = `<rect width="100%" height="100%" fill="${bg}" />`;
      const numDots = Math.floor(rRange(30, 80));
      for (let i = 0; i < numDots; i++) {
        const cx = rRange(0, width);
        const cy = rRange(0, height);
        const r = rRange(5, width * 0.1);
        const fill = getRandomColor();
        const opacity = rRange(0.4, 0.9).toFixed(2);
        content += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}" />`;
      }
      break;

    case "geo":
      content = `<rect width="100%" height="100%" fill="${bg}" />`;
      const numShapes = Math.floor(rRange(15, 40));
      for (let i = 0; i < numShapes; i++) {
        const type = prng() > 0.5 ? 'rect' : 'polygon';
        const color = getRandomColor();
        const opacity = rRange(0.3, 0.8).toFixed(2);

        if (type === 'rect') {
          const w = rRange(20, 150);
          const h = rRange(20, 150);
          const x = rRange(-w, width);
          const y = rRange(-h, height);
          const rot = rRange(0, 360);
          content += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" opacity="${opacity}" transform="rotate(${rot} ${x + w/2} ${y + h/2})" />`;
        } else {
          // Triangle
          const cx = rRange(0, width);
          const cy = rRange(0, height);
          const size = rRange(30, 200);
          const p1 = `${cx},${cy - size}`;
          const p2 = `${cx - size},${cy + size}`;
          const p3 = `${cx + size},${cy + size}`;
          const rot = rRange(0, 360);
          content += `<polygon points="${p1} ${p2} ${p3}" fill="${color}" opacity="${opacity}" transform="rotate(${rot} ${cx} ${cy})" />`;
        }
      }
      break;

    case "lines":
      content = `<rect width="100%" height="100%" fill="${bg}" />`;
      const numLines = Math.floor(rRange(10, 30));
      for (let i = 0; i < numLines; i++) {
        const x1 = rRange(-width*0.2, width*1.2);
        const y1 = rRange(-height*0.2, height*1.2);
        const x2 = rRange(-width*0.2, width*1.2);
        const y2 = rRange(-height*0.2, height*1.2);
        const stroke = getRandomColor();
        const strokeWidth = rRange(2, 40);
        content += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" opacity="0.8" />`;
      }
      break;

    case "topographic":
      content = `<rect width="100%" height="100%" fill="${bg}" />`;
      const steps = Math.floor(rRange(8, 15));
      const lineCol = getRandomColor();
      for (let i = steps; i > 0; i--) {
        const scale = i * rRange(0.08, 0.12); // expanding scale
        // Create an organic path around the center
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(width, height) * scale;
        
        // Very basic simple random wavy circle
        let d = `M ${cx + radius} ${cy} `;
        for (let angle = 0; angle <= 360; angle += 45) {
          const rad = angle * (Math.PI / 180);
          const rVar = radius + (rRange(-0.2, 0.2) * radius);
          const px = cx + rVar * Math.cos(rad);
          const py = cy + rVar * Math.sin(rad);
          d += `Q ${px} ${py} ${cx + rVar * Math.cos(rad + 0.1)} ${cy + rVar * Math.sin(rad + 0.1)} `;
        }
        
        content += `<path d="${d}" fill="none" stroke="${lineCol}" stroke-width="2" opacity="0.6" />`;
      }
      break;

    case "blob":
      content = `<rect width="100%" height="100%" fill="${bg}" />`;
      const numBlobs = Math.floor(rRange(3, 7));
      for (let i = 0; i < numBlobs; i++) {
        const cx = rRange(0, width);
        const cy = rRange(0, height);
        const rVar = rRange(width * 0.2, width * 0.5);
        const fill = getRandomColor();
        const opacity = rRange(0.6, 0.9).toFixed(2);
        
        content += `<path d="M ${cx} ${cy - rVar} C ${cx + rVar} ${cy - rVar}, ${cx + rVar} ${cy + rVar}, ${cx} ${cy + rVar} C ${cx - rVar} ${cy + rVar}, ${cx - rVar} ${cy - rVar}, ${cx} ${cy - rVar} Z" fill="${fill}" opacity="${opacity}" transform="rotate(${rRange(0, 360)} ${cx} ${cy}) scale(${rRange(0.8, 1.2)} ${rRange(0.8, 1.2)})" />`;
      }
      break;

    case "noise":
      const nsBase = getRandomColor();
      // Use SVG turbulent filter to generate a noise pattern mapped over a rect
      content = `
        <defs>
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="${rRange(0.5, 1.5).toFixed(2)}" numOctaves="3" stitchTiles="stitch"/>
            <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.5 0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="${nsBase}" />
        <rect width="100%" height="100%" style="filter:url(#noiseFilter)" opacity="0.5" />
      `;
      break;

    default:
      content = `<rect width="100%" height="100%" fill="${bg}" />`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${content}</svg>`;
}
