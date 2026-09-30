#!/usr/bin/env node
// audit-css.mjs — lints hand-written CSS against the web-ui-craft rules (no dependencies, Node 18+).
//   node audit-css.mjs <dir|file…> [--tokens style.css] [--weights 400,500,600] [--json] [--verbose] [--strict]
// Finds raw colours / font sizes / fonts outside the token file, off-scale weights, `transition: all`,
// layout-property animation, long durations, missing or incomplete prefers-reduced-motion, !important,
// z-index spam, gradients, backdrop blur, removed focus outlines, 100vh without dvh … (see --help).
// Exit code 1 when errors remain (--strict: warnings too). Silence a deliberate case in the CSS with
// /* audit-ok: <rule-id> */ on the same line or the line above.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative, join, extname } from 'node:path';
import { parseCss, contextOf } from './lib/css-block-parser.mjs';
import { auditCss, LEVELS } from './lib/css-audit-rules.mjs';

const HELP = `audit-css.mjs — CSS audit for web-ui-craft
Usage: node audit-css.mjs <dir|file> [more…] [options]
  --tokens <file>     token file(s) where raw colours / sizes / fonts are allowed (repeat or comma-list).
                      Default: the scanned file with the most :root custom properties (≥ 8).
  --weights <list>    allowed font weights (default 400,500,600)
  --max-sizes <n>     warn above n --fs-* tokens (default 8)
  --ignore <text>     skip paths containing text (repeatable; node_modules, dist, build, .min.css always skipped)
  --json              JSON output        --verbose  include info-level notes        --strict  warnings fail too
Rules (level): ${Object.entries(LEVELS).map(([id, lvl]) => `${id} (${lvl})`).join(', ')}
Silence one deliberate case: /* audit-ok: <rule-id> */ on that line or the line above.`;

function parseArgs(argv) {
  const o = { paths: [], tokens: [], ignore: [], weights: [400, 500, 600], maxSizes: 8 };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--help' || a === '-h') o.help = true;
    else if (a === '--tokens') o.tokens.push(...argv[++i].split(','));
    else if (a === '--weights') o.weights = argv[++i].split(',').map(Number);
    else if (a === '--max-sizes') o.maxSizes = Number(argv[++i]);
    else if (a === '--ignore') o.ignore.push(argv[++i]);
    else if (a === '--json') o.json = true;
    else if (a === '--verbose') o.verbose = true;
    else if (a === '--strict') o.strict = true;
    else if (a.startsWith('--')) throw new Error(`Unknown option ${a}`);
    else o.paths.push(a);
  }
  return o;
}

function collect(paths, ignore) {
  const skip = (p) => /node_modules|[\\/](dist|build)[\\/]|\.min\.css$/.test(p) || ignore.some((t) => p.includes(t));
  const out = [];
  const walk = (p) => {
    if (skip(p)) return;
    const st = statSync(p);
    if (st.isDirectory()) for (const name of readdirSync(p)) walk(join(p, name));
    else if (extname(p).toLowerCase() === '.css') out.push({ path: p, source: readFileSync(p, 'utf8') });
  };
  for (const p of paths) walk(resolve(p));
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

// The file declaring the most custom properties on :root / html.
function guessTokens(files) {
  let best = null;
  for (const f of files) {
    const { decls } = parseCss(f.source);
    const count = decls.filter((d) => d.prop.startsWith('--') && /^(:root|html)\b/.test(contextOf(d.block).selector)).length;
    if (count >= 8 && (!best || count > best.count)) best = { path: f.path, count };
  }
  return best?.path || null;
}

function main() {
  let opts;
  try { opts = parseArgs(process.argv.slice(2)); } catch (err) { console.error(err.message); console.log(HELP); process.exit(2); }
  if (opts.help || !opts.paths.length) { console.log(HELP); process.exit(opts.help ? 0 : 2); }
  const files = collect(opts.paths, opts.ignore);
  if (!files.length) { console.error('No .css files found.'); process.exit(2); }
  let tokenFiles = opts.tokens.map((t) => resolve(t));
  let guessed = false;
  if (!tokenFiles.length) {
    const g = guessTokens(files);
    if (g) { tokenFiles = [g]; guessed = true; }
  }
  const { findings, stats } = auditCss(files, { tokenFiles: new Set(tokenFiles), allowedWeights: opts.weights, maxSizes: opts.maxSizes });
  const root = files.length === 1 ? resolve(files[0].path, '..') : resolve(opts.paths[0]);
  const rel = (p) => (p.startsWith('(') ? p : relative(root, p) || p);
  const shown = findings.filter((f) => opts.verbose || f.level !== 'info');
  const errors = findings.filter((f) => f.level === 'error').length;
  const warns = findings.filter((f) => f.level === 'warn').length;

  if (opts.json) {
    console.log(JSON.stringify({ findings: shown.map((f) => ({ ...f, file: rel(f.file) })), stats: {
      ...stats, tokenFiles: tokenFiles.map(rel), sizes: Object.fromEntries(stats.sizes),
      weights: Object.fromEntries(stats.weights), zIndex: Object.fromEntries(stats.zIndex) } }, null, 2));
  } else {
    console.log(`audit-css — ${files.length} files, ${stats.declarations} declarations · tokens: ${tokenFiles.map(rel).join(', ') || '(none)'}${guessed ? ' (guessed)' : ''}`);
    for (const level of ['error', 'warn', 'info']) {
      const list = shown.filter((f) => f.level === level);
      if (!list.length) continue;
      console.log(`\n${level.toUpperCase()} (${list.length})`);
      for (const f of list) console.log(`  ${`${rel(f.file)}:${f.line}`.padEnd(28)} ${f.id.padEnd(22)} ${f.message}`);
    }
    const sizes = [...stats.sizes].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k.replace(/^var\((--[\w-]+)\)$/, '$1')}×${n}`);
    console.log(`\nSUMMARY`);
    console.log(`  font sizes (${stats.sizes.size}): ${sizes.join(' · ') || '—'}`);
    console.log(`  literal weights: ${[...stats.weights].map(([k, n]) => `${k}×${n}`).join(' · ') || '— (all via tokens)'}`);
    console.log(`  z-index: ${[...stats.zIndex.keys()].sort((a, b) => a - b).join(', ') || '—'}`);
    console.log(`  motion: ${stats.transitions} transitions, ${stats.animations} animations, ${stats.keyframes} @keyframes`);
    console.log(`  result: ${errors} error(s), ${warns} warning(s)${opts.verbose ? '' : `, ${findings.length - shown.length} info hidden (--verbose)`}`);
  }
  process.exit(errors || (opts.strict && warns) ? 1 : 0);
}

main();
