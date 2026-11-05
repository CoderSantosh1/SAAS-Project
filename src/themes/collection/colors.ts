import type { DesignTokens } from "../types";

// Color math for collection themes. Tokens are derived from a theme's primary color and
// then darkened until text and buttons pass WCAG AA, so no theme can ship unreadable.

type Rgb = [number, number, number];

const toRgb = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
const toHex = (rgb: Rgb) =>
  `#${rgb.map((value) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, "0")).join("")}`.toUpperCase();

// `amount` of `b` mixed into `a`.
export function mix(a: string, b: string, amount: number) {
  const [x, y] = [toRgb(a), toRgb(b)];
  return toHex(x.map((value, i) => value + (y[i]! - value) * amount) as Rgb);
}

export function luminance(hex: string) {
  const channels = toRgb(hex).map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

export function contrast(a: string, b: string) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high! + 0.05) / (low! + 0.05);
}

// Darkens `color` until it reaches `ratio` against every background.
export function darkenFor(color: string, backgrounds: string[], ratio = 4.6) {
  let result = color;
  for (let step = 0; step < 40 && backgrounds.some((bg) => contrast(result, bg) < ratio); step++) {
    result = mix(result, "#000000", 0.06);
  }
  return result;
}

export function deriveTokens(input: {
  primary: string;
  headingFont: DesignTokens["headingFont"];
  bodyFont: DesignTokens["bodyFont"];
  radius: DesignTokens["radius"];
}): DesignTokens {
  const primary = darkenFor(input.primary, ["#FFFFFF"], 4.8);
  const background = mix("#FFFFFF", primary, 0.025);
  const surface = mix("#FFFFFF", primary, 0.07);
  const text = darkenFor(mix(primary, "#000000", 0.78), [background, surface], 10);
  const mutedText = darkenFor(mix(primary, "#3A3A3A", 0.75), [background, surface]);
  return {
    primary,
    onPrimary: "#FFFFFF",
    background,
    surface,
    text,
    mutedText,
    border: mix("#FFFFFF", primary, 0.16),
    headingFont: input.headingFont,
    bodyFont: input.bodyFont,
    radius: input.radius,
  };
}

// Five decoration colors for the playful family: the classic bright set, lightly tinted
// toward the theme's color so they stay vivid but belong together. The accent leads.
export function playfulPalette(primary: string, accent: string) {
  return {
    sun: accent,
    coral: mix("#FF7A59", primary, 0.2),
    mint: mix("#3CC5A0", primary, 0.2),
    grape: mix("#8E6CEF", primary, 0.2),
    sky: mix("#4FB3FF", primary, 0.2),
  };
}
