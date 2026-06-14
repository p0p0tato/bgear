"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shuffle, RefreshCw, Copy, Check } from "lucide-react";

const STYLES = ["gradient", "dots", "geo", "lines", "topographic", "blob", "noise", "plain"];
const PALETTES = ["warm", "cool", "earth", "mono", "neon", "pastel", "dark"];

const ASPECT_RATIOS = [
  { label: "Twitter/X", w: 1500, h: 500 },
  { label: "LinkedIn", w: 1584, h: 396 },
  { label: "Square", w: 800, h: 800 },
  { label: "Portrait", w: 800, h: 1000 },
];

const createPreviewUrl = (s: string, p: string, sd: string, w: number, h: number) => {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  return `${baseUrl}/api/v1/${s}/${sd || "default"}?palette=${p}&w=${w}&h=${h}`;
};

export default function Home() {
  const [style, setStyle] = useState("geo");
  const [palette, setPalette] = useState("warm");
  const [seed, setSeed] = useState("bgear");
  const [width, setWidth] = useState(1500);
  const [height, setHeight] = useState(500);
  const [activeSettings, setActiveSettings] = useState({
    style: "geo",
    palette: "warm",
    seed: "bgear",
    width: 1500,
    height: 500,
  });
  const [isCopied, setIsCopied] = useState(false);
  const previewUrl = createPreviewUrl(
    activeSettings.style,
    activeSettings.palette,
    activeSettings.seed,
    activeSettings.width,
    activeSettings.height
  );

  const handleGenerate = () => {
    setActiveSettings({ style, palette, seed, width, height });
  };

  const handleShuffle = () => {
    const newSeed = Math.random().toString(36).substring(7);
    setSeed(newSeed);
    setActiveSettings({ style, palette, seed: newSeed, width, height });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-6 md:p-12 font-sans selection:bg-neutral-800">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Hero Section */}
        <div className="space-y-8 pb-4">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white">
              SVG backdrops, on demand.
            </h1>
            <p className="text-neutral-400 text-xl max-w-3xl">
              bgear is a free, open-source API for generating deterministic, infinitely scalable SVG backgrounds directly from a seeded URL string.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900 aspect-[3/2]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/api/v1/geo/showcase1?palette=neon&w=600&h=400" alt="Geo Showcase" className="w-full h-full object-cover" />
            </div>
            <div className="rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900 aspect-[3/2]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/api/v1/topographic/earthy?palette=earth&w=600&h=400" alt="Topographic Showcase" className="w-full h-full object-cover" />
            </div>
            <div className="rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900 aspect-[3/2]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/api/v1/blob/coolbeans?palette=cool&w=600&h=400" alt="Blob Showcase" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Playground Section */}
        <div className="space-y-6">
          <Card className="bg-neutral-900 border-neutral-800 text-white overflow-hidden">
            <CardHeader className="border-b border-neutral-800 pb-4">
              <CardTitle>Playground</CardTitle>
              <CardDescription className="text-neutral-400">Preview your generated SVG backdrop in real-time.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              
              {/* Preview Canvas */}
              <div 
                className="w-full bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800 flex items-center justify-center min-h-[200px]"
                style={{ aspectRatio: `${width}/${height}`, maxHeight: "500px" }}
              >
                {previewUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img 
                    src={previewUrl} 
                    alt="Generated SVG Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-neutral-600">Generating preview...</span>
                )}
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Style</label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="bg-neutral-950 border-neutral-800">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                      {STYLES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Palette</label>
                  <Select value={palette} onValueChange={setPalette}>
                    <SelectTrigger className="bg-neutral-950 border-neutral-800">
                      <SelectValue placeholder="Select palette" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                      {PALETTES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Seed</label>
                  <div className="flex gap-2">
                    <Input 
                      value={seed} 
                      onChange={(e) => setSeed(e.target.value)} 
                      className="bg-neutral-950 border-neutral-800"
                      placeholder="Enter a seed"
                    />
                    <Button variant="outline" size="icon" onClick={handleShuffle} className="bg-neutral-950 border-neutral-800 hover:bg-neutral-800 hover:text-white shrink-0">
                      <Shuffle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 lg:pt-7">
                  <Button onClick={handleGenerate} className="w-full bg-white text-black hover:bg-neutral-200">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate
                  </Button>
                </div>
              </div>

              {/* Aspect Ratio Shortcuts */}
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

              {/* Copy URL */}
              <div className="space-y-2 pt-4 border-t border-neutral-800">
                <label className="text-sm font-medium text-neutral-300">API URL</label>
                <div className="flex gap-2 isolate">
                  <code className="flex-1 px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-md text-sm text-neutral-300 overflow-x-auto whitespace-nowrap">
                    {previewUrl}
                  </code>
                  <Button 
                    variant="outline" 
                    onClick={() => copyToClipboard(previewUrl)}
                    className="bg-neutral-950 border-neutral-800 hover:bg-neutral-800 hover:text-white shrink-0"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documentation Section */}
        <div className="space-y-6 pt-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Documentation</h2>
            <p className="text-neutral-400">Everything you need to integrate bgear into your applications.</p>
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
                        {STYLES.map(s => (
                          <TableRow key={s} className="border-neutral-800 hover:bg-neutral-800/50">
                            <TableCell className="font-mono text-sm">{s}</TableCell>
                            <TableCell className="text-neutral-400 text-sm capitalize">{s} pattern backdrop</TableCell>
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
                        {PALETTES.map(p => (
                          <TableRow key={p} className="border-neutral-800 hover:bg-neutral-800/50">
                            <TableCell className="font-mono text-sm">{p}</TableCell>
                            <TableCell className="text-neutral-400 text-sm capitalize">{p} colors</TableCell>
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
                  <div>
                    <span className="text-neutral-400 mb-2 block">HTML Image Tag:</span>
                    <code className="block p-4 bg-neutral-950 border border-neutral-800 rounded-lg text-emerald-400 font-mono">
                      {'<img src="https://yourdomain.com/api/v1/geo/hello-world?palette=cool&w=1200&h=630" alt="Backdrop" />'}
                    </code>
                  </div>
                  <div>
                    <span className="text-neutral-400 mb-2 block">Markdown:</span>
                    <code className="block p-4 bg-neutral-950 border border-neutral-800 rounded-lg text-emerald-400 font-mono">
                      ![Backdrop](https://yourdomain.com/api/v1/dots/banner?palette=pastel&w=1500&h=500)
                    </code>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
        
        {/* Footer */}
        <footer className="pt-12 pb-6 text-center text-neutral-500 text-sm">
          Built with Next.js App Router, shadcn UI, and seedrandom. Deterministic SVG backdrops on the edge.
        </footer>
      </div>
    </div>
  );
}
