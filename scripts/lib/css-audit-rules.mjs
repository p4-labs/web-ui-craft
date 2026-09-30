// css-audit-rules.mjs — the checks behind audit-css.mjs. Input: [{path, source}] + options;
// output: {findings: [{id, level, file, line, message}], stats}. Levels: error (breaks a rule of the
// skill), warn (usually wrong, sometimes deliberate: silence with /* audit-ok: <id> */), info (--verbose).

import { parseCss, contextOf } from './css-block-parser.mjs';

export const LEVELS = {
  'raw-color': 'error', 'font-size-literal': 'error', 'font-weight': 'error', 'transition-all': 'error',
  'reduced-motion-missing': 'error', 'outline-none': 'warn', 'font-family': 'warn', gradient: 'warn',
  'backdrop-blur': 'warn', 'animate-layout': 'warn', 'duration-long': 'warn', important: 'warn',
  'z-index': 'warn', 'infinite-motion': 'warn', 'viewport-units': 'warn', 'type-scale': 'warn',
  'weight-literal': 'info', 'hover-transform': 'info', 'tight-leading': 'info',
};

const LAYOUT_PROPS = new Set(['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height', 'top',
  'left', 'right', 'bottom', 'inset', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'grid-template-columns',
  'grid-template-rows', 'font-size', 'border-width', 'flex-basis', 'gap', 'block-size', 'inline-size']);
const TIMING = /^(ease|linear|ease-in|ease-out|ease-in-out|step-start|step-end|allow-discrete|normal)$|^(cubic-bezier|steps|linear)\(/;
const ANIM_WORDS = /^(infinite|normal|reverse|alternate|alternate-reverse|none|forwards|backwards|both|running|paused|[\d.]+)$/;
const RAW_COLOR = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\([^)]*\)/i;
const WEIGHT_WORDS = { normal: 400, bold: 700 };
const SIZE_OK = /^(inherit|initial|unset|revert|100%|1em|smaller|larger)$/;

function splitTop(value, sep) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i += 1) {
    const c = value[i];
    if (c === '(') depth += 1;
    else if (c === ')') depth -= 1;
    else if (c === sep && depth === 0) { parts.push(value.slice(start, i)); start = i + 1; }
  }
  parts.push(value.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}
const toMs = (t) => { const m = t.match(/^([\d.]+)(ms|s)$/i); return m ? parseFloat(m[1]) * (m[2].toLowerCase() === 's' ? 1000 : 1) : null; };
const short = (s) => (s.length > 60 ? `${s.slice(0, 57)}…` : s);

// transition shorthand → [{property|null, duration|null}] (null property = implicit "all")
function transitionParts(value) {
  return splitTop(value, ',').map((seg) => {
    let property = null;
    const times = [];
    for (const tok of splitTop(seg, ' ')) {
      const ms = toMs(tok);
      if (ms !== null) times.push(ms);
      else if (!TIMING.test(tok) && !/^var\(/.test(tok) && property === null) property = tok;
    }
    return { property, duration: times.length ? times[0] : null };
  });
}

export function auditCss(files, { tokenFiles = new Set(), allowedWeights = [400, 500, 600], maxSizes = 8 } = {}) {
  const findings = [];
  const stats = { files: files.length, declarations: 0, sizes: new Map(), weights: new Map(), zIndex: new Map(),
    keyframes: 0, animations: 0, transitions: 0, fsTokens: 0, tokenFiles: [...tokenFiles] };
  const motion = [];      // first motion use, for reduced-motion-missing
  const infinite = [];    // infinite animations to match against reduced-motion blocks
  const reducedTexts = [];

  for (const { path, source } of files) {
    const parsed = parseCss(source);
    const isTokens = tokenFiles.has(path);
    // focus shown on a parent instead (:focus-within, or :has(… :focus-visible)) → removed outline is only a warning
    const focusWithin = /:focus-within|:has\([^{]*:focus/.test(parsed.clean);
    const report = (line, id, message, level) => {
      const silenced = [parsed.annotations.get(line), parsed.annotations.get(line - 1)]
        .some((set) => set && (set.has('all') || set.has(id)));
      if (!silenced) findings.push({ id, level: level || LEVELS[id], file: path, line, message });
    };
    stats.declarations += parsed.decls.length;
    for (const block of parsed.blocks) {
      if (/prefers-reduced-motion\s*:\s*reduce/i.test(block.prelude)) reducedTexts.push(parsed.clean.slice(block.start, block.end));
      if (/^@keyframes/i.test(block.prelude)) stats.keyframes += 1;
    }
    const byBlock = new Map();
    for (const d of parsed.decls) byBlock.set(d.block, [...(byBlock.get(d.block) || []), d]);
    const layoutKeyframes = new Set();

    for (const d of parsed.decls) {
      const { selector, atRules } = contextOf(d.block);
      const at = atRules.join(' ').toLowerCase();
      const siblings = byBlock.get(d.block);
      const v = d.value.toLowerCase();
      const noUrl = v.replace(/url\([^)]*\)/g, '').replace(/"[^"]*"|'[^']*'/g, ''); // strings (content: "#1") are not colours
      const isVar = /var\(--/.test(v);
      if (isTokens && d.prop.startsWith('--fs-')) stats.fsTokens += 1;

      const color = noUrl.match(RAW_COLOR);
      if (color && !isTokens && !/forced-colors/.test(at)) report(d.line, 'raw-color', `${color[0]} in "${d.prop}: ${short(d.value)}" → use a role token`);
      if (!isTokens && /(?:linear|radial|conic)-gradient\(/.test(noUrl)) report(d.line, 'gradient', `gradient in "${d.prop}" — no gradients on UI chrome (silence if it is a functional trick)`);
      if (/^(-webkit-)?backdrop-filter$/.test(d.prop) && v !== 'none') report(d.line, 'backdrop-blur', `backdrop-filter "${short(d.value)}" — glass on ≤1–2 surfaces, with a solid fallback`);
      if (!isTokens && !/^@font-face/i.test(d.block.prelude) && (d.prop === 'font-family' || (d.prop === 'font' && !/^(inherit|initial|unset)$/.test(v)))
        && !/^(inherit|initial|unset|var\()/.test(v)) report(d.line, 'font-family', `"${d.prop}: ${short(d.value)}" outside the token file → var(--font-*)`);

      if (d.prop === 'font-size') {
        stats.sizes.set(v, (stats.sizes.get(v) || 0) + 1);
        if (!isTokens && !isVar && !SIZE_OK.test(v)) report(d.line, 'font-size-literal', `font-size ${d.value} → use a --fs-* step`);
      }
      if (d.prop === 'font-weight') {
        if (!isVar) {
          const n = WEIGHT_WORDS[v] ?? Number(v);
          if (Number.isNaN(n)) report(d.line, 'font-weight', `font-weight ${d.value} (relative weights depend on the parent)`, 'warn');
          else {
            stats.weights.set(n, (stats.weights.get(n) || 0) + 1);
            if (!allowedWeights.includes(n)) report(d.line, 'font-weight', `font-weight ${d.value} is off the scale (${allowedWeights.join('/')})`);
            else if (!isTokens) report(d.line, 'weight-literal', `font-weight ${d.value} → var(--fw-*)`);
          }
        }
      }

      if (d.prop === 'transition' || d.prop === 'transition-property') {
        stats.transitions += 1;
        motion.push({ file: path, line: d.line });
        const parts = d.prop === 'transition' ? transitionParts(v) : splitTop(v, ',').map((p) => ({ property: p, duration: null }));
        if (parts.some((p) => p.property === null || p.property === 'all')) report(d.line, 'transition-all', `"${d.prop}: ${short(d.value)}" animates every property → list them`);
        for (const p of parts) {
          if (p.property && LAYOUT_PROPS.has(p.property)) report(d.line, 'animate-layout', `transition on ${p.property} runs layout every frame → transform / grid 0fr→1fr / FLIP (fine for one rare disclosure)`);
          if (p.duration > 400 && !/^(visibility|display|overlay)$/.test(p.property || '')) report(d.line, 'duration-long', `${p.duration}ms transition — interactions should be 100–300ms`);
        }
      }
      if (d.prop === 'transition-duration') {
        for (const t of splitTop(v, ',')) if (toMs(t) > 400) report(d.line, 'duration-long', `${t} transition — interactions should be 100–300ms`);
      }
      if ((d.prop === 'animation' || d.prop === 'animation-name') && !/^none$/.test(v)) {
        stats.animations += 1;
        motion.push({ file: path, line: d.line });
        const names = splitTop(v, ',').flatMap((seg) => splitTop(seg, ' ').filter((t) => toMs(t) === null && !TIMING.test(t) && !ANIM_WORDS.test(t) && !/^var\(/.test(t)));
        const loops = /\binfinite\b/.test(v) || siblings.some((s) => s.prop === 'animation-iteration-count' && /infinite/.test(s.value));
        if (loops && !/prefers-reduced-motion/.test(at)) infinite.push({ file: path, line: d.line, selector, names, report });
      }
      if (/@keyframes/.test(at) && LAYOUT_PROPS.has(d.prop)) {
        const key = `${atRules.find((a) => /@keyframes/i.test(a))}|${d.prop}`;
        if (!layoutKeyframes.has(key)) { layoutKeyframes.add(key); report(d.line, 'animate-layout', `${key.split('|')[0]} animates ${d.prop} → use transform/opacity`); }
      }
      if (d.important && !/prefers-reduced-motion|forced-colors|print/.test(at) && !/\[hidden\]|sr-only/.test(selector)) report(d.line, 'important', `!important on ${d.prop} (${short(selector)})`);
      if (d.prop === 'z-index' && /^-?\d+$/.test(v)) {
        const n = Number(v);
        stats.zIndex.set(n, (stats.zIndex.get(n) || 0) + 1);
        if (Math.abs(n) >= 1000) report(d.line, 'z-index', `z-index ${n} — use a small named scale (--z-*) or the top layer (<dialog>, popover)`);
      }
      if ((d.prop === 'outline' && /^(none|0|0px)$/.test(v)) || (d.prop === 'outline-style' && /^(none|hidden)$/.test(v))) {
        const replaced = siblings.some((s) => /^(box-shadow|border|border-color|background|background-color|text-decoration)$/.test(s.prop));
        if (!replaced) {
          const hard = /:focus/.test(selector) && !focusWithin;
          report(d.line, 'outline-none', `outline removed on ${short(selector)} — show focus another way (:focus-visible ring, :focus-within on the parent)`, hard ? 'error' : 'warn');
        }
      }
      if (/\b100vh\b/.test(v) && !siblings.some((s) => /\d(dvh|svh|lvh)\b/.test(s.value))) report(d.line, 'viewport-units', `100vh without a dvh line → add "${d.prop}: ${d.value.replace(/100vh/g, '100dvh')}" after it`);
      if (/:hover/.test(selector) && d.prop === 'transform' && v !== 'none' && !/hover\s*:\s*hover|prefers-reduced-motion/.test(at)) report(d.line, 'hover-transform', `hover transform on ${short(selector)} outside @media (hover: hover) sticks on touch screens`);
      if (d.prop === 'line-height' && /^[\d.]+$/.test(v) && Number(v) < 1.15
        && siblings.some((s) => s.prop === 'font-size' && (/--fs-(2xl|3xl|4xl|display|hero)/.test(s.value) || parseFloat(s.value) >= 24))) {
        report(d.line, 'tight-leading', `line-height ${d.value} on large text — check stacked Vietnamese diacritics (Ệ Ộ Ử) on line two`);
      }
    }
  }

  if (motion.length && !reducedTexts.length) {
    findings.push({ id: 'reduced-motion-missing', level: 'error', file: motion[0].file, line: motion[0].line,
      message: 'animations/transitions exist but no @media (prefers-reduced-motion: reduce) anywhere' });
  }
  const universalStop = reducedTexts.some((t) => /\*[^{}]*\{[^}]*animation(?:-name|-duration|-play-state)?\s*:/.test(t));
  for (const use of infinite) {
    if (universalStop || use.names.every((n) => /spin/.test(n))) continue; // spinners carry status
    const classes = [...use.selector.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
    const covered = classes.some((cls) => reducedTexts.some((t) => new RegExp(`\\.${cls.replace(/[-]/g, '\\-')}(?![\\w-])`).test(t)));
    if (!covered) use.report(use.line, 'infinite-motion', `infinite animation (${use.names.join(', ') || '?'}) on ${short(use.selector)} is not stopped under prefers-reduced-motion`);
  }
  if (stats.zIndex.size > 6) findings.push({ id: 'z-index', level: 'warn', file: '(project)', line: 0, message: `${stats.zIndex.size} different z-index values — define a --z-* scale` });
  if (stats.fsTokens > maxSizes) findings.push({ id: 'type-scale', level: 'warn', file: '(project)', line: 0, message: `${stats.fsTokens} --fs-* tokens — an app needs ~6` });
  return { findings, stats };
}
