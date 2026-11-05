import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { INDUSTRY_ICONS } from "../shared/icons";
import { ART_FILES, type ArtFile } from "./build";
import { mix } from "./colors";
import type { CollectionProfile } from "./types";

// Sample artwork for collection themes: flat illustrations in each theme's own colors,
// written to public/themes/<slug>/ by scripts/generate-collection-art.ts. Owners replace
// them with their own photos. Used only by that script and tests, never by the app.

const SKIN = ["#F1C7A5", "#D9A07A", "#B9805C", "#8D5B3F"];

function random(seed: string) {
  let state = [...seed].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 2654435761) >>> 0, 2166136261);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The icon's inner SVG markup, drawn on a 24px grid.
function iconPaths(id: string) {
  const icon = INDUSTRY_ICONS[id];
  if (!icon) throw new Error(`Unknown art icon "${id}"`);
  const markup = renderToStaticMarkup(createElement(icon));
  return markup.slice(markup.indexOf(">") + 1, markup.lastIndexOf("</svg>"));
}

function icon(id: string, x: number, y: number, size: number, color: string, stroke = 1.4) {
  const scale = size / 24;
  return `<g transform="translate(${x - size / 2} ${y - size / 2}) scale(${scale})" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${iconPaths(id)}</g>`;
}

const svg = (width: number, height: number, body: string, defs = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><defs>${defs}</defs>${body}</svg>\n`;

const gradient = (id: string, from: string, to: string) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`;

const dots = (color: string, opacity: number) =>
  `<pattern id="dots" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="${color}" fill-opacity="${opacity}"/></pattern>`;

function palette(profile: CollectionProfile, primary: string) {
  return {
    primary,
    deep: mix(primary, "#000000", 0.45),
    light: mix("#FFFFFF", primary, 0.12),
    accent: profile.accent,
    soft: mix(profile.accent, "#FFFFFF", 0.55),
  };
}

function hero(profile: CollectionProfile, c: ReturnType<typeof palette>) {
  const rand = random(`${profile.slug}-hero`);
  const skyline = Array.from({ length: 9 }, (_, index) => {
    const width = 120 + rand() * 90;
    const height = 180 + rand() * 300;
    const x = index * 180 - 40;
    return `<rect x="${x.toFixed(0)}" y="${(1000 - height).toFixed(0)}" width="${width.toFixed(0)}" height="${height.toFixed(0)}" rx="${profile.base === "sprouts" ? 40 : 6}" fill="${mix(c.deep, c.primary, rand() * 0.6)}"/>`;
  }).join("");
  const floaters = profile.icons
    .slice(1)
    .map((id, index) => {
      const [x, y] = ([[1000, 640], [1360, 560], [1220, 820]] as const)[index]!;
      return `<circle cx="${x}" cy="${y}" r="74" fill="#FFFFFF" fill-opacity="0.14"/>${icon(id, x, y, 72, "#FFFFFF", 1.6)}`;
    })
    .join("");
  return svg(
    1600,
    1000,
    `<rect width="1600" height="1000" fill="url(#bg)"/><rect width="1600" height="1000" fill="url(#dots)"/>
<circle cx="1210" cy="290" r="250" fill="${c.accent}" fill-opacity="0.9"/><circle cx="1210" cy="290" r="330" fill="none" stroke="${c.soft}" stroke-opacity="0.35" stroke-width="3"/>
${skyline}
<rect x="210" y="230" width="540" height="540" rx="${profile.base === "sprouts" ? 120 : 40}" fill="#FFFFFF" fill-opacity="0.1" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="3"/>
${icon(profile.icons[0], 480, 500, 330, "#FFFFFF", 1.3)}${floaters}`,
    gradient("bg", c.deep, c.primary) + dots("#FFFFFF", 0.1),
  );
}

function scene(profile: CollectionProfile, c: ReturnType<typeof palette>, index: number) {
  const rand = random(`${profile.slug}-scene-${index}`);
  const backgrounds = [
    [c.deep, c.primary],
    [c.primary, mix(c.primary, c.accent, 0.35)],
    [mix(c.deep, "#000000", 0.2), c.deep],
    [mix(c.primary, "#FFFFFF", 0.12), c.primary],
    [c.deep, mix(c.primary, c.accent, 0.5)],
    [c.primary, c.deep],
  ][index % 6]!;
  const sun = { x: 200 + rand() * 800, y: 120 + rand() * 260 };
  const card = (offset: number) =>
    `<rect x="${(150 + rand() * 700).toFixed(0)}" y="${(520 + rand() * 200).toFixed(0)}" width="300" height="190" rx="28" fill="#FFFFFF" fill-opacity="0.1" transform="rotate(${(offset * (rand() * 12 - 6)).toFixed(1)} 600 450)"/>`;
  return svg(
    1200,
    900,
    `<rect width="1200" height="900" fill="url(#bg)"/><rect width="1200" height="900" fill="url(#dots)"/>
<circle cx="${sun.x.toFixed(0)}" cy="${sun.y.toFixed(0)}" r="${(150 + rand() * 90).toFixed(0)}" fill="${c.accent}" fill-opacity="0.85"/>
${card(1)}${card(-1)}
<circle cx="600" cy="450" r="250" fill="#FFFFFF" fill-opacity="0.12"/><circle cx="600" cy="450" r="250" fill="none" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="3"/>
${icon(profile.icons[index % 4]!, 600, 450, 270, "#FFFFFF", 1.3)}`,
    gradient("bg", backgrounds[0]!, backgrounds[1]!) + dots("#FFFFFF", 0.09),
  );
}

function place(profile: CollectionProfile, c: ReturnType<typeof palette>, index: number) {
  const rand = random(`${profile.slug}-place-${index}`);
  let body: string;
  if (index === 1) {
    // An interior with three tall windows.
    body = [0, 1, 2]
      .map((window) => {
        const x = 260 + window * 400;
        return `<path d="M${x} 760V330a140 140 0 0 1 280 0V760Z" fill="url(#sky)" stroke="${c.light}" stroke-width="14"/><path d="M${x + 140} 200V760M${x} 520H${x + 280}" stroke="${c.light}" stroke-width="10"/>`;
      })
      .join("");
    body = `<rect width="1600" height="900" fill="${c.deep}"/>${body}<rect y="760" width="1600" height="140" fill="${mix(c.deep, "#000000", 0.25)}"/>${icon(profile.icons[1], 1400, 160, 90, c.soft, 1.6)}`;
  } else if (index === 2) {
    // A city skyline at dusk.
    const towers = Array.from({ length: 12 }, (_, tower) => {
      const width = 90 + rand() * 70;
      const height = 220 + rand() * 420;
      const x = tower * 138 - 20;
      const windows = Array.from({ length: Math.floor(height / 70) }, (_, row) => `<rect x="${(x + 22).toFixed(0)}" y="${(900 - height + 30 + row * 70).toFixed(0)}" width="${(width - 44).toFixed(0)}" height="18" rx="4" fill="${c.soft}" fill-opacity="${(0.2 + rand() * 0.5).toFixed(2)}"/>`).join("");
      return `<rect x="${x.toFixed(0)}" y="${(900 - height).toFixed(0)}" width="${width.toFixed(0)}" height="${height.toFixed(0)}" fill="${mix(c.deep, c.primary, rand() * 0.5)}"/>${windows}`;
    }).join("");
    body = `<rect width="1600" height="900" fill="url(#sky)"/><circle cx="1180" cy="260" r="150" fill="${c.accent}"/>${towers}`;
  } else if (index === 3) {
    // Rolling hills.
    body = `<rect width="1600" height="900" fill="url(#sky)"/><circle cx="420" cy="280" r="160" fill="${c.accent}"/>
<path d="M0 560C300 440 520 640 820 540S1340 400 1600 520V900H0Z" fill="${mix(c.primary, "#FFFFFF", 0.25)}"/>
<path d="M0 680C260 600 560 760 900 660S1380 600 1600 680V900H0Z" fill="${c.primary}"/>
<path d="M0 800C400 740 700 860 1100 790S1500 760 1600 800V900H0Z" fill="${c.deep}"/>`;
  } else {
    // Soft abstract waves with a featured icon.
    body = `<rect width="1600" height="900" fill="url(#sky)"/>
${Array.from({ length: 5 }, (_, wave) => `<path d="M0 ${300 + wave * 120}C400 ${220 + wave * 120} 800 ${400 + wave * 120} 1600 ${280 + wave * 120}" fill="none" stroke="#FFFFFF" stroke-opacity="${0.12 + wave * 0.05}" stroke-width="${30 - wave * 4}"/>`).join("")}
<circle cx="1150" cy="450" r="220" fill="${c.accent}" fill-opacity="0.9"/>${icon(profile.icons[2], 1150, 450, 220, c.deep, 1.4)}`;
  }
  return svg(1600, 900, body, gradient("sky", index === 4 ? c.primary : c.soft, index === 4 ? c.deep : mix(c.primary, "#FFFFFF", 0.35)));
}

function person(profile: CollectionProfile, c: ReturnType<typeof palette>, index: number) {
  const skin = SKIN[(index + profile.slug.length) % SKIN.length]!;
  const clothes = [c.primary, c.deep, mix(c.primary, c.accent, 0.4), mix(c.deep, "#FFFFFF", 0.2)][index % 4]!;
  const hairColor = ["#2B1D14", "#4A3426", "#1C1C1C", "#6B4A2F"][index % 4]!;
  const hair = [
    `<path d="M290 330c0-90 50-150 110-150s110 60 110 150c-20-50-60-70-110-70s-90 20-110 70Z" fill="${hairColor}"/>`,
    `<path d="M282 350c-10-110 40-180 118-180s128 70 118 180l10 150c-30-30-40-80-40-120 0-70-40-100-88-100s-88 30-88 100c0 40-10 90-40 120Z" fill="${hairColor}"/>`,
    `<circle cx="400" cy="170" r="54" fill="${hairColor}"/><path d="M288 330c0-90 50-142 112-142s112 52 112 142c-24-44-62-62-112-62s-88 18-112 62Z" fill="${hairColor}"/>`,
    `<path d="M292 320c4-80 48-128 108-128s104 48 108 128c-30-24-60-34-108-34s-78 10-108 34Z" fill="${hairColor}"/>`,
  ][index % 4]!;
  return svg(
    800,
    800,
    `<rect width="800" height="800" fill="url(#bg)"/><circle cx="400" cy="380" r="280" fill="${c.soft}" fill-opacity="0.6"/>
<path d="M150 800c0-150 110-250 250-250s250 100 250 250Z" fill="${clothes}"/><path d="M360 560h80l-40 70Z" fill="#FFFFFF" fill-opacity="0.85"/>
<rect x="362" y="460" width="76" height="110" rx="30" fill="${skin}"/><ellipse cx="400" cy="350" rx="112" ry="128" fill="${skin}"/>${hair}`,
    gradient("bg", c.light, mix(c.light, c.primary, 0.15)),
  );
}

export function collectionArt(profile: CollectionProfile, primary: string): Record<ArtFile, string> {
  const c = palette(profile, primary);
  const files = {} as Record<ArtFile, string>;
  for (const name of ART_FILES) {
    const [kind, number] = name.split("-") as [string, string | undefined];
    const index = Number(number);
    files[name] =
      kind === "hero" ? hero(profile, c) : kind === "scene" ? scene(profile, c, index - 1) : kind === "place" ? place(profile, c, index) : person(profile, c, index - 1);
  }
  return files;
}
