import { NextResponse } from "next/server";

// Module-level cache: "year-make-model-color" → image URL
// Persists for the lifetime of the server process
const imageCache = new Map<string, string>();

// Map free-text color to the closest CarsXE color token.
// CarsXE accepted tokens: black, white, silver, gray, red, blue,
// green, brown, beige, yellow, orange, purple, gold
const COLOR_KEYWORDS: [string[], string][] = [
  [["black", "noir", "obsidian", "onyx", "shadow", "phantom", "jet", "midnight", "carbon", "ebony"], "black"],
  [["white", "pearl", "ivory", "cream", "snow", "chalk", "alpine", "arctic"], "white"],
  [["silver", "platinum", "aluminum", "metallic", "chrome", "mercury", "pewter", "tungsten"], "silver"],
  [["gray", "grey", "granite", "slate", "charcoal", "smoke", "storm", "ash", "titanium", "lunar"], "gray"],
  [["red", "crimson", "scarlet", "ruby", "burgundy", "maroon", "cherry", "magma", "lava", "oxide"], "red"],
  [["blue", "navy", "cobalt", "sapphire", "ocean", "sky", "azure", "steel", "teal", "aqua", "cyan", "aegean", "lapiz", "lapis"], "blue"],
  [["green", "olive", "forest", "lime", "emerald", "hunter", "sage", "malachite", "moss"], "green"],
  [["brown", "bronze", "mocha", "espresso", "copper", "terra", "cognac", "hazel", "cinnamon", "caramel"], "brown"],
  [["beige", "tan", "sand", "champagne", "wheat", "bisque", "linen", "khaki", "cashmere"], "beige"],
  [["yellow", "gold", "mustard", "amber", "honey", "maize", "solar", "saffron"], "yellow"],
  [["orange", "rust", "canyon", "spice", "sunset", "ember", "sienna"], "orange"],
  [["purple", "violet", "plum", "lavender", "eggplant", "grape", "aubergine"], "purple"],
];

function normalizeColor(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  for (const [keywords, token] of COLOR_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) return token;
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const make  = searchParams.get("make")  ?? "";
  const model = searchParams.get("model") ?? "";
  const year  = searchParams.get("year")  ?? "";
  const color = searchParams.get("color") ?? "";

  if (!make || !model || !year) {
    return NextResponse.json({ url: null }, { status: 400 });
  }

  const apiKey = process.env.CARSXE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ url: null, error: "CARSXE_API_KEY not configured" }, { status: 500 });
  }

  const colorToken = normalizeColor(color);
  const cacheKey   = `${year}-${make}-${model}-${colorToken ?? "any"}`.toLowerCase();

  // Return cached URL immediately if available
  const cached = imageCache.get(cacheKey);
  if (cached) {
    return NextResponse.json({ url: cached });
  }

  // Build CarsXE query — include color token if we have one
  const params = new URLSearchParams({
    key:   apiKey,
    year,
    make,
    model,
    angle: "side",
    // photo_type: exterior is the default
  });
  if (colorToken) params.set("color", colorToken);

  try {
    const res = await fetch(
      `https://api.carsxe.com/images?${params.toString()}`,
      { next: { revalidate: 86400 } } // Next.js fetch cache: 24 h
    );

    if (!res.ok) {
      return NextResponse.json({ url: null }, { status: 200 });
    }

    const json = await res.json();
    // CarsXE returns { images: [{ link, thumbnail, ... }] } or { collection: [...] }
    const images: { link?: string; url?: string }[] =
      json.images ?? json.collection ?? [];

    const url = images[0]?.link ?? images[0]?.url ?? null;

    if (url) imageCache.set(cacheKey, url);

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ url: null }, { status: 200 });
  }
}
