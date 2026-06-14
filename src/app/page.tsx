"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Copy, Download, RefreshCw, Shuffle } from "lucide-react";

const STYLES = ["gradient", "dots", "geo", "lines", "topographic", "blob", "noise", "plain"];
const PALETTES = ["warm", "cool", "earth", "mono", "neon", "pastel", "dark"];

const PALETTE_COLORS: Record<string, string[]> = {
  warm: ["#7c2d12", "#c2410c", "#ea580c", "#fb923c", "#fde68a"],
  cool: ["#1e3a5f", "#1d4ed8", "#3b82f6", "#7dd3fc", "#e0f2fe"],
  earth: ["#1c1917", "#57534e", "#78716c", "#a8a29e", "#d6d3d1"],
  mono: ["#000000", "#404040", "#737373", "#d4d4d4", "#ffffff"],
  neon: ["#0f0f0f", "#7c3aed", "#06b6d4", "#10b981", "#f0abfc"],
  pastel: ["#fce7f3", "#fbcfe8", "#ddd6fe", "#bfdbfe", "#d1fae5"],
  dark: ["#0a0a0a", "#134e4a", "#0f766e", "#a16207", "#d4a76a"],
};

const STYLE_DESCRIPTIONS: Record<string, string> = {
  gradient: "Smooth color transitions, linear or radial",
  dots: "Layered circles with bokeh depth",
  geo: "Geometric shapes: rects, triangles, hexagons",
  lines: "Diagonal stripes and crosshatch patterns",
  topographic: "Concentric contour lines from a focal point",
  blob: "Organic aurora-like blobs with soft blur",
  noise: "Turbulent texture tinted by palette",
  plain: "Solid color with subtle vignette",
};

const PALETTE_DESCRIPTIONS: Record<string, string> = {
  warm: "Reds, oranges, and amber",
  cool: "Blues and cyan tones",
  earth: "Greens, browns, and cream",
  mono: "Black, white, and greys",
  neon: "Electric magentas, cyans, and greens",
  pastel: "Soft pinks, yellows, and blues",
  dark: "Deep blacks, teals, and warm sand",
};

const ASPECT_RATIOS = [
  { label: "Twitter/X", w: 1500, h: 500 },
  { label: "LinkedIn", w: 1584, h: 396 },
  { label: "Square", w: 800, h: 800 },
  { label: "Portrait", w: 800, h: 1000 },
];

const githubUrl = "https://github.com/p0p0tato/bgear";

const HERO_CHIPS = [
  { src: "/api/v1/geo/chip-one?palette=neon&w=320&h=180", label: "geo / neon" },
  { src: "/api/v1/blob/chip-two?palette=cool&w=320&h=180", label: "blob / cool" },
  { src: "/api/v1/topographic/chip-three?palette=earth&w=320&h=180", label: "topo / earth" },
  { src: "/api/v1/noise/chip-four?palette=dark&w=320&h=180", label: "noise / dark" },
  { src: "/api/v1/gradient/chip-five?palette=pastel&w=320&h=180", label: "gradient / pastel" },
];

const USE_CASES = [
  {
    src: "/api/v1/gradient/uc-readme?palette=cool&w=800&h=160",
    title: "GitHub README banners",
    description: "Add a polished header to any open-source repo. Seed it with your project name for a consistent look.",
  },
  {
    src: "/api/v1/geo/uc-og?palette=neon&w=800&h=160",
    title: "OG & social images",
    description: "Generate unique open graph images per page. Pass the post slug as a seed — same slug, same backdrop, every time.",
  },
  {
    src: "/api/v1/blob/uc-cover?palette=dark&w=800&h=160",
    title: "Notion & doc covers",
    description: "Drop a backdrop URL into any tool that accepts image URLs. Works with Notion, Linear, Coda, and more.",
  },
  {
    src: "/api/v1/topographic/uc-banner?palette=earth&w=800&h=160",
    title: "Twitter / X banners",
    description: "Pick a style and seed, copy the URL, paste it as your banner image. No design tool needed.",
  },
  {
    src: "/api/v1/noise/uc-app?palette=warm&w=800&h=160",
    title: "App loading screens",
    description: "Use a seeded backdrop as a placeholder while your app loads. Deterministic means it never flickers.",
  },
  {
    src: "/api/v1/dots/uc-email?palette=pastel&w=800&h=160",
    title: "Email headers",
    description: "Embed a backdrop as a full-width header image in HTML emails. Lightweight SVG keeps file sizes tiny.",
  },
];

const SOCIAL_PROOF_ITEMS = [
  "Free forever",
  "No API key required",
  "Deterministic output",
  "MIT licensed",
  "Edge-ready",
];

const EMBED_EXAMPLES = [
  {
    key: "html",
    label: "HTML Image Tag:",
    code: '<img src="https://fondor.dev/api/v1/geo/hello-world?palette=cool&w=1200&h=630" alt="Backdrop" />',
  },
  {
    key: "markdown",
    label: "Markdown:",
    code: "![Backdrop](https://fondor.dev/api/v1/dots/banner?palette=pastel&w=1500&h=500)",
  },
  {
    key: "css",
    label: "CSS background-image:",
    code: "background-image: url('https://fondor.dev/api/v1/blob/my-project?palette=dark&w=1920&h=1080');",
  },
];

const createLocalPreviewUrl = (s: string, p: string, sd: string, w: number, h: number) =>
  `/api/v1/${s}/${sd || "default"}?palette=${p}&w=${w}&h=${h}`;

const createPublicPreviewUrl = (s: string, p: string, sd: string, w: number, h: number) =>
  `https://fondor.dev/api/v1/${s}/${sd || "default"}?palette=${p}&w=${w}&h=${h}`;

const copyText = async (text: string) => {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back for browsers or test environments that expose clipboard but deny access.
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  textArea.remove();
};

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStyle = searchParams.get("style") || "geo";
  const initialPalette = searchParams.get("palette") || "warm";
  const initialSeed = searchParams.get("seed") || "fondor";
  const initialWidth = Number(searchParams.get("w")) || 1500;
  const initialHeight = Number(searchParams.get("h")) || 500;
  const [style, setStyle] = useState(initialStyle);
  const [palette, setPalette] = useState(initialPalette);
  const [seed, setSeed] = useState(initialSeed);
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [activeSettings, setActiveSettings] = useState({
    style: initialStyle,
    palette: initialPalette,
    seed: initialSeed,
    width: initialWidth,
    height: initialHeight,
  });
  const [isCopied, setIsCopied] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const localPreviewUrl = createLocalPreviewUrl(
    activeSettings.style,
    activeSettings.palette,
    activeSettings.seed,
    activeSettings.width,
    activeSettings.height
  );
  const publicPreviewUrl = createPublicPreviewUrl(
    activeSettings.style,
    activeSettings.palette,
    activeSettings.seed,
    activeSettings.width,
    activeSettings.height
  );
  const previewRatio = activeSettings.width / activeSettings.height;
  const previewMaxHeight = 500;

  const handleGenerate = useCallback(
    (nextSeed = seed) => {
      const nextSettings = { style, palette, seed: nextSeed, width, height };
      setActiveSettings(nextSettings);
      const params = new URLSearchParams({
        style,
        palette,
        seed: nextSeed,
        w: String(width),
        h: String(height),
      });
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [style, palette, seed, width, height, router]
  );

  const handleShuffle = () => {
    const newSeed = Math.random().toString(36).substring(7);
    setSeed(newSeed);
    handleGenerate(newSeed);
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        handleGenerate();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleGenerate]);

  const copyToClipboard = async (text: string) => {
    try {
      await copyText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const copyEmbed = async (text: string, key: string) => {
    try {
      await copyText(text);
      setCopiedEmbed(key);
      setTimeout(() => setCopiedEmbed(null), 2000);
    } catch (err) {
      console.error("Failed to copy embed", err);
    }
  };

  const downloadSvg = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(localPreviewUrl);
      const svg = await response.text();
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fondor-${activeSettings.style}-${activeSettings.seed || "default"}.svg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans selection:bg-neutral-800">
      <section className="relative min-h-screen overflow-hidden flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/api/v1/blob/fondor-hero?palette=dark&w=1920&h=1080"
          alt=""
          className="absolute inset-0 z-0 h-full w-full object-cover opacity-40"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[1]"
          style={{ background: "radial-gradient(ellipse at center, transparent 0%, #0a0a0a 70%)" }}
        />
        <div className="relative z-[2] mx-auto max-w-[800px] px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
            Pick a seed. Get a backdrop.
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl mt-6 max-w-2xl mx-auto">
            fondor generates deterministic, infinitely scalable SVG backgrounds from any string. Free, open-source, and ready to embed anywhere.
          </p>
          <div className="mt-10 flex gap-4 justify-center flex-wrap">
            <a
              href="#playground"
              className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-medium text-black transition-colors hover:bg-neutral-200"
            >
              Try the Playground
            </a>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950/40 px-5 text-sm font-medium text-neutral-200 transition-colors hover:border-neutral-500 hover:bg-neutral-900/80 hover:text-white"
            >
              View on GitHub
            </a>
          </div>
          <div className="mt-16 flex gap-3 justify-center flex-wrap">
            {HERO_CHIPS.map((chip) => (
              <div key={chip.src} className="space-y-2">
                <div className="h-[90px] w-[160px] overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={chip.src} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="text-xs text-neutral-500">{chip.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="px-6 md:px-12 py-16 md:py-20">
        <div className="max-w-6xl mx-auto space-y-16">
          <section id="use-cases" className="space-y-8 scroll-mt-24">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-white">Where fondor fits</h2>
              <p className="text-neutral-400">Any place you need a background, fondor works out of the box.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {USE_CASES.map((useCase) => (
                <article key={useCase.title} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={useCase.src} alt="" className="h-40 w-full object-cover" />
                  <div className="p-5">
                    <h3 className="text-white font-medium text-sm">{useCase.title}</h3>
                    <p className="text-neutral-400 text-sm mt-1">{useCase.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-neutral-500 py-8 border-y border-neutral-800">
            {SOCIAL_PROOF_ITEMS.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>

          <section id="playground" className="space-y-6 scroll-mt-24">
            <Card className="bg-neutral-900 border-neutral-800 text-white overflow-hidden">
            <CardHeader className="border-b border-neutral-800 pb-4">
              <CardTitle>Playground</CardTitle>
              <CardDescription className="text-neutral-400">
                Preview your generated SVG backdrop in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="w-full bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800 flex items-center justify-center p-3">
                <div
                  className="overflow-hidden rounded-md border border-neutral-800 bg-neutral-950"
                  style={{
                    aspectRatio: `${activeSettings.width}/${activeSettings.height}`,
                    width: `min(100%, ${Math.round(previewMaxHeight * previewRatio)}px)`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={localPreviewUrl}
                    alt="Generated SVG preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1.25fr_1fr_1fr_auto] gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Style</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {STYLES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStyle(s)}
                        className={`relative overflow-hidden rounded-md border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                          style === s
                            ? "border-white ring-1 ring-white"
                            : "border-neutral-800 hover:border-neutral-600"
                        }`}
                        title={s}
                        aria-pressed={style === s}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/v1/${s}/preview-thumb?palette=${palette}&w=120&h=80`}
                          alt={s}
                          className="w-full aspect-[3/2] object-cover"
                          loading="lazy"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 py-0.5 text-center font-mono text-[9px] text-neutral-300">
                          {s}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Palette</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {PALETTES.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPalette(p)}
                        className={`flex items-center gap-3 rounded-md border px-3 py-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                          palette === p
                            ? "border-white bg-neutral-800"
                            : "border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900"
                        }`}
                        aria-pressed={palette === p}
                      >
                        <div className="flex gap-0.5 shrink-0">
                          {(PALETTE_COLORS[p] || []).map((color) => (
                            <span
                              key={color}
                              className="h-3 w-3 rounded-sm"
                              style={{ backgroundColor: color }}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                        <span className="font-mono text-sm text-neutral-300">{p}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Seed</label>
                  <div className="flex gap-2">
                    <Input
                      value={seed}
                      onChange={(event) => setSeed(event.target.value)}
                      className="bg-neutral-950 border-neutral-800"
                      placeholder="Enter a seed"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleShuffle}
                      className="bg-neutral-950 border-neutral-800 hover:bg-neutral-800 hover:text-white shrink-0"
                    >
                      <Shuffle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:pt-7">
                  <Button onClick={() => handleGenerate()} className="w-full bg-white text-black hover:bg-neutral-200">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate
                    <kbd className="ml-auto hidden rounded bg-neutral-200 px-1.5 py-0.5 font-mono text-[10px] text-neutral-500 lg:inline">
                      ⌘↵
                    </kbd>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadSvg}
                    disabled={isDownloading}
                    className="w-full bg-neutral-950 border-neutral-800 hover:bg-neutral-800 hover:text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download SVG
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Presets</label>
                <div className="flex flex-wrap gap-2">
                  {ASPECT_RATIOS.map((ratio) => {
                    const isActive = width === ratio.w && height === ratio.h;
                    return (
                      <Button
                        key={ratio.label}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setWidth(ratio.w);
                          setHeight(ratio.h);
                        }}
                        className={isActive ? "bg-white text-black hover:bg-neutral-200" : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white"}
                      >
                        {ratio.label} ({ratio.w}x{ratio.h})
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">W</label>
                  <Input
                    type="number"
                    min={1}
                    value={width}
                    onChange={(event) => setWidth(Number(event.target.value))}
                    className="bg-neutral-950 border-neutral-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">H</label>
                  <Input
                    type="number"
                    min={1}
                    value={height}
                    onChange={(event) => setHeight(Number(event.target.value))}
                    className="bg-neutral-950 border-neutral-800"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleGenerate()}
                  className="bg-neutral-950 border-neutral-800 hover:bg-neutral-800 hover:text-white"
                >
                  Apply
                </Button>
              </div>

              <div className="space-y-2 pt-4 border-t border-neutral-800">
                <label className="text-sm font-medium text-neutral-300">API URL</label>
                <div className="flex gap-2 isolate">
                  <code className="flex-1 px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-md text-sm text-neutral-300 overflow-x-auto whitespace-nowrap">
                    {publicPreviewUrl}
                  </code>
                  <a
                    href={publicPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-1 px-2"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Raw
                  </a>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(publicPreviewUrl)}
                    className="bg-neutral-950 border-neutral-800 hover:bg-neutral-800 hover:text-white shrink-0 min-w-[90px] transition-all"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4 mr-1.5 text-green-500" />
                        <span className="text-green-500 text-xs">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1.5" />
                        <span className="text-xs">Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

          <section id="docs" className="space-y-6 pt-6 scroll-mt-24">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Documentation</h2>
            <p className="text-neutral-400">Everything you need to integrate fondor into your applications.</p>
          </div>

          <Card className="bg-neutral-900 border-neutral-800 text-white">
            <CardContent className="pt-6 space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">URL Structure</h3>
                <code className="block p-4 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 text-sm overflow-x-auto">
                  GET /api/v1/[style]/[seed]?w=[width]&h=[height]&palette=[palette]
                </code>
                <ul className="list-disc list-inside text-neutral-400 space-y-2 text-sm ml-2">
                  <li><strong className="text-neutral-200">style</strong>: The generation pattern (required).</li>
                  <li><strong className="text-neutral-200">seed</strong>: Any string to deterministically generate the pattern (required).</li>
                  <li><strong className="text-neutral-200">w & h</strong>: Image dimensions in pixels (defaults to 1500x500).</li>
                  <li><strong className="text-neutral-200">palette</strong>: The color theme (defaults to warm).</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Styles</h3>
                  <div className="border border-neutral-800 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-neutral-950">
                        <TableRow className="border-neutral-800 hover:bg-transparent">
                          <TableHead className="text-neutral-300">Name</TableHead>
                          <TableHead className="text-neutral-300">Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {STYLES.map((s) => (
                          <TableRow key={s} className="border-neutral-800 hover:bg-neutral-800/50">
                            <TableCell className="font-mono text-sm">{s}</TableCell>
                            <TableCell className="text-neutral-400 text-sm">{STYLE_DESCRIPTIONS[s]}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Palettes</h3>
                  <div className="border border-neutral-800 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-neutral-950">
                        <TableRow className="border-neutral-800 hover:bg-transparent">
                          <TableHead className="text-neutral-300">Name</TableHead>
                          <TableHead className="text-neutral-300">Theme</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {PALETTES.map((p) => (
                          <TableRow key={p} className="border-neutral-800 hover:bg-neutral-800/50">
                            <TableCell className="font-mono text-sm">{p}</TableCell>
                            <TableCell className="text-neutral-400 text-sm">{PALETTE_DESCRIPTIONS[p]}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Embed Examples</h3>
                <div className="space-y-4 text-sm mt-4">
                  {EMBED_EXAMPLES.map((example) => (
                    <div key={example.key}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-neutral-400">{example.label}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyEmbed(example.code, example.key)}
                          className="h-7 bg-neutral-950 border-neutral-800 px-2 text-xs hover:bg-neutral-800 hover:text-white"
                        >
                          {copiedEmbed === example.key ? (
                            <>
                              <Check className="w-3.5 h-3.5 mr-1 text-green-500" />
                              <span className="text-green-500">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <code className="block p-4 bg-neutral-950 border border-neutral-800 rounded-lg text-emerald-400 font-mono overflow-x-auto">
                        {example.code}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
