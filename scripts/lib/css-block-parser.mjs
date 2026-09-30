// css-block-parser.mjs — a small CSS reader for the audit (not a full parser): finds every block
// (rules, nested rules, at-rules), each block's own declarations with line numbers, and
// "audit-ok" comments that silence a finding on their line or the next one:
//   /* audit-ok: gradient */            /* audit-ok: raw-color, important */      /* audit-ok */ (= all)
// Comments are blanked (offsets kept) so braces or semicolons inside them never count.

export function parseCss(source) {
  const lineStarts = [0];
  for (let i = 0; i < source.length; i += 1) if (source.charCodeAt(i) === 10) lineStarts.push(i + 1);
  const lineOf = (offset) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= offset) lo = mid; else hi = mid - 1;
    }
    return lo + 1;
  };
  const { clean, annotations } = blankComments(source, lineOf);
  const blocks = findBlocks(clean);
  const decls = [];
  for (const block of blocks) {
    for (const d of ownDeclarations(clean, block)) decls.push({ ...d, line: lineOf(d.offset), block });
  }
  return { clean, blocks, decls, annotations, lineOf };
}

// Selector of the nearest style rule + the enclosing at-rule preludes (innermost first).
export function contextOf(block) {
  const atRules = [];
  let selector = null;
  for (let b = block; b; b = b.parent) {
    if (b.prelude.startsWith('@')) atRules.push(b.prelude);
    else if (selector === null) selector = b.prelude;
  }
  return { selector: selector || '', atRules };
}

function blankComments(source, lineOf) {
  const out = source.split('');
  const annotations = new Map(); // line → Set(rule ids | 'all')
  let quote = null;
  for (let i = 0; i < source.length; i += 1) {
    const c = source[i];
    if (quote) {
      if (c === '\\') i += 1;
      else if (c === quote || c === '\n') quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c !== '/' || source[i + 1] !== '*') continue;
    const end = source.indexOf('*/', i + 2);
    const stop = end < 0 ? source.length : end + 2;
    const m = source.slice(i + 2, stop - 2).match(/audit-ok\b\s*:?\s*([\w\s,-]*)/i);
    if (m) {
      const ids = m[1].split(/[\s,]+/).filter(Boolean).map((id) => id.toLowerCase());
      for (const line of new Set([lineOf(i), lineOf(stop - 1)])) {
        const set = annotations.get(line) || new Set();
        for (const id of ids.length ? ids : ['all']) set.add(id);
        annotations.set(line, set);
      }
    }
    for (let j = i; j < stop; j += 1) if (out[j] !== '\n') out[j] = ' ';
    i = stop - 1;
  }
  return { clean: out.join(''), annotations };
}

function findBlocks(clean) {
  const blocks = [];
  const stack = [];
  let segStart = 0;
  let quote = null;
  let paren = 0;
  for (let i = 0; i < clean.length; i += 1) {
    const c = clean[i];
    if (quote) {
      if (c === '\\') i += 1;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '(') { paren += 1; continue; }
    if (c === ')') { if (paren) paren -= 1; continue; }
    if (paren) continue;
    if (c === '{') {
      const seg = clean.slice(segStart, i);
      const cut = seg.lastIndexOf(';') + 1; // declarations before a nested rule end with ';'
      const lead = seg.slice(cut).search(/\S/);
      const parent = stack[stack.length - 1] || null;
      const block = {
        prelude: seg.slice(cut).trim().replace(/\s+/g, ' '),
        preludeOffset: segStart + cut + Math.max(0, lead),
        start: i + 1,
        end: clean.length,
        parent,
        children: [],
      };
      if (parent) parent.children.push(block);
      blocks.push(block);
      stack.push(block);
      segStart = i + 1;
    } else if (c === '}') {
      const block = stack.pop();
      if (block) block.end = i;
      segStart = i + 1;
    }
  }
  return blocks;
}

// Declarations written directly in `block` (nested blocks and their preludes excluded).
function ownDeclarations(clean, block) {
  const ranges = [];
  let pos = block.start;
  for (const child of block.children) {
    if (child.preludeOffset > pos) ranges.push([pos, child.preludeOffset]);
    pos = Math.max(pos, child.end + 1);
  }
  if (block.end > pos) ranges.push([pos, block.end]);
  const decls = [];
  for (const [from, to] of ranges) {
    let segStart = from;
    let quote = null;
    let paren = 0;
    for (let i = from; i <= to; i += 1) {
      const c = i < to ? clean[i] : ';';
      if (quote) {
        if (c === '\\') i += 1;
        else if (c === quote) quote = null;
        continue;
      }
      if (c === '"' || c === "'") { quote = c; continue; }
      if (c === '(') { paren += 1; continue; }
      if (c === ')') { if (paren) paren -= 1; continue; }
      if (paren || c !== ';') continue;
      const raw = clean.slice(segStart, i);
      const colon = raw.indexOf(':');
      const lead = raw.search(/\S/);
      if (colon > 0 && lead >= 0 && lead < colon) {
        const prop = raw.slice(0, colon).trim().toLowerCase();
        let value = raw.slice(colon + 1).trim().replace(/\s+/g, ' ');
        const important = /!\s*important\s*$/i.test(value);
        if (important) value = value.replace(/!\s*important\s*$/i, '').trim();
        if (/^-{0,2}[a-z][\w-]*$/i.test(prop)) decls.push({ prop, value, important, offset: segStart + lead });
      }
      segStart = i + 1;
    }
  }
  return decls;
}
