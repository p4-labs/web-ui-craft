#!/usr/bin/env node
// contrast.mjs — WCAG 2.x contrast ratio for colour pairs, no dependencies (Node 18+).
//   node contrast.mjs "#6e6e68" "#f2f0eb"                 one pair
//   node contrast.mjs "#fff" "#00754a" "#1e3932" "#fff"   several pairs (fg bg fg bg …)
//   node contrast.mjs --tokens style.css --pairs "text-3:bg,on-accent:accent,text:surface"
//   node contrast.mjs --tokens style.css --scheme dark --pairs "text-3:bg"
// Colours: #rgb, #rrggbb, #rrggbbaa, rgb()/rgba() (space or comma syntax). A translucent foreground
// is composited over its background first. Token values may reference other tokens with var(--x).
// Exit code 1 when any pair is below the chosen threshold (--min, default 4.5).

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const HELP = `contrast.mjs — WCAG contrast ratio
Usage:
  node contrast.mjs <fg> <bg> [<fg> <bg> …] [--min 4.5]
  node contrast.mjs --tokens <file.css> --pairs "fgToken:bgToken,…" [--scheme light|dark] [--min 4.5]
Thresholds: 4.5 body text (AA) · 3 large text ≥24px or ≥18.66px bold, icons, focus rings (AA) · 7 AAA.`;

function parseArgs(argv) {
  const opts = { colors: [], min: 4.5, scheme: 'light' };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--tokens') opts.tokens = argv[++i];
    else if (a === '--pairs') opts.pairs = argv[++i];
    else if (a === '--scheme') opts.scheme = argv[++i];
    else if (a === '--min') opts.min = Number(argv[++i]);
    else opts.colors.push(a);
  }
  return opts;
}

// → {r, g, b, a} with r/g/b 0–255 and a 0–1, or null.
export function parseColor(input) {
  const s = String(input || '').trim().toLowerCase();
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let hex = m[1];
    if (hex.length === 3 || hex.length === 4) hex = [...hex].map((c) => c + c).join('');
    if (hex.length !== 6 && hex.length !== 8) return null;
    const n = (i) => parseInt(hex.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: hex.length === 8 ? n(6) / 255 : 1 };
  }
  m = s.match(/^rgba?\(\s*([^)]+)\)$/);
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const channel = (v) => (v.endsWith('%') ? (parseFloat(v) / 100) * 255 : parseFloat(v));
    const alpha = parts[3] === undefined ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    const [r, g, b] = parts.slice(0, 3).map(channel);
    if ([r, g, b, alpha].some((v) => Number.isNaN(v))) return null;
    return { r, g, b, a: alpha };
  }
  if (s === 'white') return { r: 255, g: 255, b: 255, a: 1 };
  if (s === 'black') return { r: 0, g: 0, b: 0, a: 1 };
  return null;
}

function composite(fg, bg) {
  const a = fg.a;
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}

function luminance({ r, g, b }) {
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(fgInput, bgInput) {
  const bg = parseColor(bgInput);
  let fg = parseColor(fgInput);
  if (!fg || !bg) return null;
  const base = bg.a < 1 ? composite(bg, { r: 255, g: 255, b: 255, a: 1 }) : bg; // translucent bg: assume white page
  if (fg.a < 1) fg = composite(fg, base);
  const [hi, lo] = [luminance(fg), luminance(base)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function verdict(ratio) {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA large/UI only';
  return 'FAIL';
}

// Custom properties of :root (light) and of :root inside a prefers-color-scheme: dark block.
function readTokens(file, scheme) {
  const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const light = new Map();
  const dark = new Map();
  const darkStart = css.search(/@media[^{]*prefers-color-scheme\s*:\s*dark/);
  const collect = (text, into) => {
    for (const m of text.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) into.set(m[1], m[2].trim());
  };
  if (darkStart >= 0) {
    // take the balanced block of the dark media query
    let depth = 0;
    let end = darkStart;
    for (let i = css.indexOf('{', darkStart); i < css.length; i += 1) {
      if (css[i] === '{') depth += 1;
      else if (css[i] === '}') { depth -= 1; if (depth === 0) { end = i; break; } }
    }
    collect(css.slice(0, darkStart) + css.slice(end + 1), light);
    collect(css.slice(darkStart, end + 1), dark);
  } else {
    collect(css, light);
  }
  const map = scheme === 'dark' ? new Map([...light, ...dark]) : light;
  const resolve = (name, seen = new Set()) => {
    const key = name.startsWith('--') ? name : `--${name}`;
    if (seen.has(key)) return null;
    seen.add(key);
    const raw = map.get(key);
    if (!raw) return null;
    const ref = raw.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/);
    if (ref) return resolve(ref[1], seen) || (ref[2] ? ref[2].trim() : null);
    return raw;
  };
  return resolve;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || (!opts.tokens && opts.colors.length < 2)) {
    console.log(HELP);
    process.exit(opts.help ? 0 : 1);
  }
  const rows = [];
  if (opts.tokens) {
    if (!opts.pairs) { console.error('--tokens needs --pairs "fg:bg,…"'); process.exit(1); }
    const resolve = readTokens(opts.tokens, opts.scheme);
    for (const pair of opts.pairs.split(',').map((p) => p.trim()).filter(Boolean)) {
      const [fgName, bgName] = pair.split(':').map((p) => p.trim());
      const fg = resolve(fgName) || fgName;
      const bg = resolve(bgName) || bgName;
      rows.push({ label: `${fgName} on ${bgName}`, fg, bg });
    }
  } else {
    if (opts.colors.length % 2) { console.error('Colours must come in fg bg pairs.'); process.exit(1); }
    for (let i = 0; i < opts.colors.length; i += 2) rows.push({ label: '', fg: opts.colors[i], bg: opts.colors[i + 1] });
  }
  let failed = 0;
  for (const row of rows) {
    const ratio = contrastRatio(row.fg, row.bg);
    if (ratio === null) {
      console.log(`?  ${row.label || `${row.fg} on ${row.bg}`}: cannot parse (${row.fg} / ${row.bg})`);
      failed += 1;
      continue;
    }
    const ok = ratio >= opts.min;
    if (!ok) failed += 1;
    const name = row.label ? `${row.label} (${row.fg} on ${row.bg})` : `${row.fg} on ${row.bg}`;
    console.log(`${ok ? 'ok ' : 'LOW'} ${ratio.toFixed(2)}:1  ${verdict(ratio).padEnd(16)} ${name}`);
  }
  if (failed) console.log(`\n${failed} pair(s) below ${opts.min}:1${opts.tokens ? ` (${opts.scheme})` : ''}.`);
  process.exit(failed ? 1 : 0);
}

// Run as a CLI; stay quiet when imported (parseColor / contrastRatio are exported).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
