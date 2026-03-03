"use client";

import { useState, useEffect } from "react";

type Props = {
  make: string;
  model: string;
  year: number;
  color?: string | null;
  vin?: string | null;
  className?: string;
};

// Brand logo fallback map — Clearbit serves square logos reliably
const BRAND_LOGOS: Record<string, string> = {
  "acura":        "https://logo.clearbit.com/acura.com",
  "alfa romeo":   "https://logo.clearbit.com/alfaromeo.com",
  "aston martin": "https://logo.clearbit.com/astonmartin.com",
  "audi":         "https://logo.clearbit.com/audi.com",
  "bentley":      "https://logo.clearbit.com/bentleymotors.com",
  "bmw":          "https://logo.clearbit.com/bmw.com",
  "bugatti":      "https://logo.clearbit.com/bugatti.com",
  "buick":        "https://logo.clearbit.com/buick.com",
  "cadillac":     "https://logo.clearbit.com/cadillac.com",
  "chevrolet":    "https://logo.clearbit.com/chevrolet.com",
  "chrysler":     "https://logo.clearbit.com/chrysler.com",
  "dodge":        "https://logo.clearbit.com/dodge.com",
  "ferrari":      "https://logo.clearbit.com/ferrari.com",
  "fiat":         "https://logo.clearbit.com/fiat.com",
  "ford":         "https://logo.clearbit.com/ford.com",
  "genesis":      "https://logo.clearbit.com/genesis.com",
  "gmc":          "https://logo.clearbit.com/gmc.com",
  "honda":        "https://logo.clearbit.com/honda.com",
  "hyundai":      "https://logo.clearbit.com/hyundai.com",
  "infiniti":     "https://logo.clearbit.com/infiniti.com",
  "jaguar":       "https://logo.clearbit.com/jaguar.com",
  "jeep":         "https://logo.clearbit.com/jeep.com",
  "kia":          "https://logo.clearbit.com/kia.com",
  "lamborghini":  "https://logo.clearbit.com/lamborghini.com",
  "land rover":   "https://logo.clearbit.com/landrover.com",
  "lexus":        "https://logo.clearbit.com/lexus.com",
  "lincoln":      "https://logo.clearbit.com/lincoln.com",
  "maserati":     "https://logo.clearbit.com/maserati.com",
  "mclaren":      "https://logo.clearbit.com/mclaren.com",
  "mercedes":     "https://logo.clearbit.com/mercedes-benz.com",
  "mercedes-benz":"https://logo.clearbit.com/mercedes-benz.com",
  "mini":         "https://logo.clearbit.com/mini.com",
  "mitsubishi":   "https://logo.clearbit.com/mitsubishi.com",
  "nissan":       "https://logo.clearbit.com/nissanusa.com",
  "porsche":      "https://logo.clearbit.com/porsche.com",
  "ram":          "https://logo.clearbit.com/ramtrucks.com",
  "rolls royce":  "https://logo.clearbit.com/rolls-roycemotorcars.com",
  "rolls-royce":  "https://logo.clearbit.com/rolls-roycemotorcars.com",
  "subaru":       "https://logo.clearbit.com/subaru.com",
  "tesla":        "https://logo.clearbit.com/tesla.com",
  "toyota":       "https://logo.clearbit.com/toyota.com",
  "vespa":        "https://logo.clearbit.com/vespa.com",
  "volkswagen":   "https://logo.clearbit.com/vw.com",
  "volvo":        "https://logo.clearbit.com/volvocars.com",
};

// Map common color names to a CSS-renderable color for the placeholder background
const CSS_COLOR_MAP: [string[], string][] = [
  [["black", "noir", "obsidian", "onyx", "shadow", "jet", "midnight", "carbon", "ebony", "phantom"], "#1a1a1a"],
  [["white", "pearl", "ivory", "cream", "snow", "chalk", "alpine", "arctic"], "#f0f0f0"],
  [["silver", "platinum", "metallic", "chrome", "mercury", "pewter", "tungsten"], "#b0b8c1"],
  [["gray", "grey", "granite", "slate", "charcoal", "smoke", "storm", "ash", "titanium", "lunar"], "#6b7280"],
  [["red", "crimson", "scarlet", "ruby", "burgundy", "maroon", "cherry", "magma", "oxide"], "#dc2626"],
  [["blue", "navy", "cobalt", "sapphire", "ocean", "azure", "steel", "aegean", "lapis"], "#2563eb"],
  [["green", "olive", "forest", "lime", "emerald", "hunter", "sage", "moss"], "#16a34a"],
  [["brown", "bronze", "mocha", "espresso", "copper", "cognac", "cinnamon", "caramel"], "#92400e"],
  [["beige", "tan", "sand", "champagne", "wheat", "khaki", "cashmere"], "#d4b896"],
  [["yellow", "gold", "mustard", "amber", "honey", "saffron", "solar"], "#ca8a04"],
  [["orange", "rust", "canyon", "spice", "sunset", "ember", "sienna"], "#ea580c"],
  [["purple", "violet", "plum", "lavender", "grape", "aubergine"], "#7c3aed"],
  [["teal", "aqua", "cyan", "turquoise"], "#0d9488"],
];

function colorToCss(raw: string | null | undefined): string {
  if (!raw) return "#4b5563"; // neutral gray default
  const lower = raw.toLowerCase();
  for (const [keywords, css] of CSS_COLOR_MAP) {
    if (keywords.some((k) => lower.includes(k))) return css;
  }
  // Try to use the raw value directly as a CSS color (may work for common names)
  return raw;
}

// 0 = CarsXE photo, 1 = brand logo, 2 = color placeholder
type ImageState = 0 | 1 | 2;

export function VehicleImage({ make, model, year, color, className = "" }: Props) {
  const [state, setState] = useState<ImageState>(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const makeKey     = make.toLowerCase().trim();
  const brandLogoUrl = BRAND_LOGOS[makeKey];

  useEffect(() => {
    let cancelled = false;

    async function fetchPhoto() {
      try {
        const params = new URLSearchParams({ make, model, year: String(year) });
        if (color) params.set("color", color);
        const res = await fetch(`/api/vehicle-image?${params.toString()}`);
        if (!res.ok) throw new Error("fetch failed");
        const json = await res.json();
        if (!cancelled && json.url) {
          setPhotoUrl(json.url);
        } else if (!cancelled) {
          setState(brandLogoUrl ? 1 : 2);
        }
      } catch {
        if (!cancelled) setState(brandLogoUrl ? 1 : 2);
      }
    }

    fetchPhoto();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [make, model, year, color]);

  // Fallback 2 — color-tinted placeholder with brand initials
  if (state === 2) {
    const initials = make
      .split(" ")
      .map((w) => w[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("");
    const bgColor = colorToCss(color);
    // Choose white or dark text based on lightness of background
    const isDark = ["#1a1a1a", "#6b7280", "#2563eb", "#16a34a", "#92400e", "#7c3aed", "#0d9488", "#4b5563", "#dc2626"].includes(bgColor);
    return (
      <div
        className={`flex items-center justify-center rounded font-bold text-sm select-none ${className}`}
        style={{ background: bgColor, color: isDark ? "#fff" : "#1a1a1a" }}
      >
        {initials}
      </div>
    );
  }

  // Fallback 1 — brand logo
  if (state === 1 && brandLogoUrl) {
    const bgColor = colorToCss(color);
    return (
      <div className={`relative flex items-center justify-center rounded overflow-hidden ${className}`}
        style={{ background: bgColor }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={brandLogoUrl}
          alt={make}
          onError={() => setState(2)}
          className="w-10 h-10 object-contain drop-shadow-sm"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }}
        />
      </div>
    );
  }

  // Primary — CarsXE photo (or loading state while fetching)
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={`${year} ${make} ${model}`}
        onError={() => setState(brandLogoUrl ? 1 : 2)}
        className={`object-cover rounded ${className}`}
      />
    );
  }

  // Loading skeleton while fetching
  return (
    <div
      className={`rounded animate-pulse ${className}`}
      style={{ background: "var(--surface2)" }}
    />
  );
}
