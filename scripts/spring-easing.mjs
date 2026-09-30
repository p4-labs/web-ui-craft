#!/usr/bin/env node
// spring-easing.mjs — turns a damped spring into a CSS linear() easing + the duration to use with it.
// No dependencies (Node 18+). The spring's exact step response is sampled, then thinned with
// Ramer–Douglas–Peucker so the linear() string stays short.
//   node spring-easing.mjs --preset gentle
//   node spring-easing.mjs --response 0.4 --bounce 0.15        (SwiftUI-style: perceptual duration + bounce)
//   node spring-easing.mjs --stiffness 300 --damping 26 --mass 1
//   node spring-easing.mjs --preset no-bounce --css-var --ease-spring --plot
// linear() works in Chrome 113+, Safari 17.2+, Firefox 112+; keep a cubic-bezier fallback.

import { pathToFileURL } from 'node:url';

// Overshoot follows from the bounce: 0 → 0%, 0.15 → ~0.6%, 0.25 → ~2.8%, 0.4 → ~9.5%.
const PRESETS = {
  'no-bounce': { response: 0.35, bounce: 0, use: 'tab indicator, drawers, anything that moves between two spots' },
  snappy: { response: 0.3, bounce: 0.15, use: 'menus, popovers, small toggles (overshoot barely visible)' },
  gentle: { response: 0.4, bounce: 0.25, use: 'completion pop, a card settling in (~3% overshoot)' },
  bouncy: { response: 0.5, bounce: 0.4, use: 'rare playful moments only, never core UI chrome (~10%)' },
};

const HELP = `spring-easing.mjs — CSS linear() spring easing
Usage:
  node spring-easing.mjs --preset <${Object.keys(PRESETS).join('|')}>
  node spring-easing.mjs --response <s> --bounce <0..0.9>
  node spring-easing.mjs --stiffness <k> --damping <c> [--mass <m>]
Options:
  --precision <v>   settle threshold as a fraction of the distance (default 0.001)
  --tolerance <v>   max deviation of the thinned curve (default 0.002)
  --css-var <name>  print as a custom property, e.g. --css-var --ease-spring
  --plot            ASCII preview of the curve
  --json            machine-readable output
Presets:
${Object.entries(PRESETS).map(([k, p]) => `  ${k.padEnd(10)} response ${p.response}s, bounce ${p.bounce} — ${p.use}`).join('\n')}`;

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--help' || a === '-h') o.help = true;
    else if (a === '--preset') o.preset = next();
    else if (a === '--response') o.response = Number(next());
    else if (a === '--bounce') o.bounce = Number(next());
    else if (a === '--stiffness') o.stiffness = Number(next());
    else if (a === '--damping') o.damping = Number(next());
    else if (a === '--mass') o.mass = Number(next());
    else if (a === '--precision') o.precision = Number(next());
    else if (a === '--tolerance') o.tolerance = Number(next());
    else if (a === '--css-var') o.cssVar = next();
    else if (a === '--plot') o.plot = true;
    else if (a === '--json') o.json = true;
    else throw new Error(`Unknown option: ${a}`);
  }
  return o;
}

// Physical parameters from the options (SwiftUI mapping for response/bounce).
export function springParams({ preset, response, bounce, stiffness, damping, mass = 1 } = {}) {
  if (preset) {
    const p = PRESETS[preset];
    if (!p) throw new Error(`Unknown preset "${preset}". Try: ${Object.keys(PRESETS).join(', ')}`);
    ({ response, bounce } = p);
  }
  if (Number.isFinite(stiffness) && Number.isFinite(damping)) return { k: stiffness, c: damping, m: mass || 1 };
  const r = Number.isFinite(response) ? response : 0.35;
  const b = Math.min(0.9, Math.max(0, Number.isFinite(bounce) ? bounce : 0));
  return { k: (2 * Math.PI / r) ** 2, c: (4 * Math.PI * (1 - b)) / r, m: 1 };
}

// Exact step response x(t) from 0 to 1, starting at rest.
export function springPosition({ k, c, m }) {
  const w0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));
  // bounce 0 lands on zeta ≈ 1 ± float noise: the two other formulas are unstable there
  if (Math.abs(zeta - 1) < 1e-6) return (t) => 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return (t) => 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
  }
  const s = Math.sqrt(zeta * zeta - 1);
  const r1 = -w0 * (zeta - s);
  const r2 = -w0 * (zeta + s);
  return (t) => 1 + (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r1 - r2);
}

// Last moment the curve is farther than `precision` from 1 (sampled at 1 ms, up to 10 s).
function settleTime(x, precision) {
  let last = 0;
  for (let t = 0; t <= 10; t += 0.001) if (Math.abs(x(t) - 1) >= precision) last = t;
  return Math.max(0.05, last);
}

function rdp(points, tolerance) {
  if (points.length < 3) return points;
  const [a, b] = [points[0], points[points.length - 1]];
  let maxDist = -1;
  let index = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const p = points[i];
    // vertical distance to the chord (time is monotonic, so this is what linear() interpolates)
    const expected = a.y + ((b.y - a.y) * (p.x - a.x)) / (b.x - a.x);
    const d = Math.abs(p.y - expected);
    if (d > maxDist) { maxDist = d; index = i; }
  }
  if (maxDist <= tolerance) return [a, b];
  return [...rdp(points.slice(0, index + 1), tolerance).slice(0, -1), ...rdp(points.slice(index), tolerance)];
}

const fmt = (n, digits) => String(Number(n.toFixed(digits)));

export function springEasing(options = {}) {
  const params = springParams(options);
  const x = springPosition(params);
  const precision = options.precision > 0 ? options.precision : 0.001;
  const tolerance = options.tolerance > 0 ? options.tolerance : 0.002;
  const duration = settleTime(x, precision);
  const samples = [];
  const N = 400;
  for (let i = 0; i <= N; i += 1) samples.push({ x: i / N, y: i === N ? 1 : x((i / N) * duration) });
  const kept = rdp(samples, tolerance);
  const stops = kept.map((p, i) => {
    if (i === 0) return fmt(p.y, 4);
    if (i === kept.length - 1) return '1';
    return `${fmt(p.y, 4)} ${fmt(p.x * 100, 2)}%`;
  });
  const peak = Math.max(...samples.map((p) => p.y));
  const t95 = samples.find((p) => p.y >= 0.95)?.x ?? 1;
  return {
    easing: `linear(${stops.join(', ')})`,
    durationMs: Math.round(duration * 1000),
    overshootPct: Math.max(0, (peak - 1) * 100),
    reach95Ms: Math.round(t95 * duration * 1000),
    points: kept.length,
    params,
    samples,
  };
}

function plot(samples, width = 60, height = 12) {
  const maxY = Math.max(1, ...samples.map((p) => p.y));
  const rows = Array.from({ length: height }, () => Array(width).fill(' '));
  for (let col = 0; col < width; col += 1) {
    const p = samples[Math.round((col / (width - 1)) * (samples.length - 1))];
    const row = height - 1 - Math.round((p.y / maxY) * (height - 1));
    rows[Math.min(height - 1, Math.max(0, row))][col] = '•';
  }
  const oneRow = height - 1 - Math.round((1 / maxY) * (height - 1));
  return rows.map((r, i) => `${i === oneRow ? '1 ┤' : '  │'}${r.join('')}`).join('\n') + `\n  └${'─'.repeat(width)}`;
}

function main() {
  let opts;
  try { opts = parseArgs(process.argv.slice(2)); } catch (err) { console.error(err.message); console.log(HELP); process.exit(1); }
  if (opts.help) { console.log(HELP); return; }
  const result = springEasing(opts);
  if (opts.json) {
    const { samples, ...rest } = result;
    console.log(JSON.stringify(rest, null, 2));
    return;
  }
  const name = opts.cssVar ? (opts.cssVar.startsWith('--') ? opts.cssVar : `--${opts.cssVar}`) : null;
  const { k, c, m } = result.params;
  const zeta = c / (2 * Math.sqrt(k * m));
  console.log(`/* spring: stiffness ${fmt(k, 1)}, damping ${fmt(c, 2)}, mass ${fmt(m, 2)} (damping ratio ${fmt(zeta, 3)}) */`);
  console.log(`/* duration ${result.durationMs}ms · 95% at ${result.reach95Ms}ms · overshoot ${fmt(result.overshootPct, 2)}% · ${result.points} stops */`);
  console.log(name ? `${name}: ${result.easing};` : result.easing);
  console.log(`/* use: transition: transform ${result.durationMs}ms ${name ? `var(${name})` : '<easing>'}; fallback: cubic-bezier(.2, .8, .2, 1) */`);
  if (opts.plot) console.log(`\n${plot(result.samples)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
