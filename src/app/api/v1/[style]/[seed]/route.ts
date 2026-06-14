import { NextRequest, NextResponse } from "next/server";
import { generateSVG, StyleType, PaletteType, PALETTES } from "@/lib/generators";

const validStyles = new Set<string>([
  "gradient", "dots", "geo", "lines", "topographic", "blob", "noise", "plain"
]);

type NextParams = { style: string; seed: string };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<NextParams> | NextParams }
) {
  try {
    const resolvedParams = await params;
    const style = resolvedParams.style;
    const seed = resolvedParams.seed;

    if (!validStyles.has(style)) {
      const allowedList = Array.from(validStyles).join(", ");
      return NextResponse.json(
        { error: `Invalid style. Valid styles are: ${allowedList}` },
        { status: 400 }
      );
    }

    const searchParams = new URL(request.url).searchParams;

    let w = 1500;
    if (searchParams.has("w")) {
      const parsedW = parseInt(searchParams.get("w")!, 10);
      if (!isNaN(parsedW)) {
        w = parsedW;
      }
    }

    let h = 500;
    if (searchParams.has("h")) {
      const parsedH = parseInt(searchParams.get("h")!, 10);
      if (!isNaN(parsedH)) {
        h = parsedH;
      }
    }

    let palette = "warm";
    if (searchParams.has("palette")) {
      palette = searchParams.get("palette")!;
    }

    if (!(palette in PALETTES)) {
      palette = "warm";
    }

    const svgString = generateSVG(
      style as StyleType,
      seed,
      palette as PaletteType,
      w,
      h
    );

    return new NextResponse(svgString, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });

  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
