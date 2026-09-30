#!/usr/bin/env node
// screenshot-matrix.mjs — screenshots every URL at every size × colour scheme, and reports horizontal
// overflow, console errors/warnings and failed requests for each shot. Uses Playwright if one can be
// found (current project, --playwright <dir>, or next to this script) and the installed Chrome/Edge.
//   node screenshot-matrix.mjs http://127.0.0.1:8789/#agent --out shots
//   node screenshot-matrix.mjs <url> <url2> --out shots --sizes 1440x900,390x844 --schemes light,dark --full
//   node screenshot-matrix.mjs <url> --out shots --eval "document.querySelector('#tab-ket-qua').click()" --wait 1500
// Widths under 768 emulate a touch phone (pointer: coarse), like the real device would.

import { createRequire } from 'node:module';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HELP = `screenshot-matrix.mjs — size × scheme screenshot matrix with overflow/console checks
Usage: node screenshot-matrix.mjs <url> [url…] --out <dir> [options]
  --sizes <list>       default 1440x900,1024x768,390x844
  --schemes <list>     default light,dark
  --wait <ms>          extra wait after load + fonts (default 800)
  --full               full-page screenshots
  --reduced-motion     emulate prefers-reduced-motion: reduce (stable shots)
  --eval <js>          run in the page after load (click a tab, import a module to fake a state…)
  --name <prefix>      file name prefix (default: from the URL)
  --channel <c>        chrome | msedge | chromium (default: first that launches)
  --playwright <dir>   folder whose node_modules has playwright or playwright-core
No Playwright? Install one (npm i -D playwright) or use the Playwright MCP tools (see 10-kiem-tra.md).`;

function parseArgs(argv) {
  const o = { urls: [], sizes: '1440x900,1024x768,390x844', schemes: 'light,dark', wait: 800 };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--help' || a === '-h') o.help = true;
    else if (a === '--out') o.out = next();
    else if (a === '--sizes') o.sizes = next();
    else if (a === '--schemes') o.schemes = next();
    else if (a === '--wait') o.wait = Number(next());
    else if (a === '--full') o.full = true;
    else if (a === '--reduced-motion') o.reduced = true;
    else if (a === '--eval') o.eval = next();
    else if (a === '--name') o.name = next();
    else if (a === '--channel') o.channel = next();
    else if (a === '--playwright') o.playwright = next();
    else if (a.startsWith('--')) throw new Error(`Unknown option ${a}`);
    else o.urls.push(a);
  }
  return o;
}

async function loadPlaywright(extra) {
  const here = dirname(fileURLToPath(import.meta.url));
  const bases = [extra, process.cwd(), here].filter(Boolean).map((b) => resolve(b));
  for (const base of bases) {
    for (const name of ['playwright', 'playwright-core']) {
      try {
        const entry = createRequire(join(base, 'noop.js')).resolve(name);
        const mod = await import(pathToFileURL(entry).href);
        const chromium = mod.chromium || mod.default?.chromium;
        if (chromium) return { chromium, from: entry };
      } catch { /* try the next place */ }
    }
  }
  return null;
}

async function launch(chromium, channel) {
  const tries = channel ? [channel === 'chromium' ? undefined : channel] : ['chrome', 'msedge', undefined];
  let lastError;
  for (const ch of tries) {
    try { return { browser: await chromium.launch({ channel: ch, headless: true }), channel: ch || 'bundled chromium' }; } catch (err) { lastError = err; }
  }
  throw lastError;
}

const slug = (url) => (new URL(url).pathname + new URL(url).hash).replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'home';

async function shoot(browser, url, { width, height, scheme }, opts, file) {
  const phone = width < 768;
  const context = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, reducedMotion: opts.reduced ? 'reduce' : 'no-preference', isMobile: phone, hasTouch: phone });
  const page = await context.newPage();
  const problems = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`console.${m.type()}: ${m.text().slice(0, 140)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${String(e.message).slice(0, 140)}`));
  page.on('requestfailed', (r) => {
    const why = r.failure()?.errorText || '';
    // media range requests and poster probes are cancelled on purpose: not a problem
    if (!/ERR_ABORTED|NS_BINDING_ABORTED/.test(why)) problems.push(`request failed: ${r.url().slice(0, 100)} (${why})`);
  });
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url().slice(0, 100)}`); });
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.evaluate(() => document.fonts?.ready);
    if (opts.eval) await page.evaluate(`(async () => { ${opts.eval} })()`);
    await page.waitForTimeout(opts.wait);
    // A full-page shot never scrolls, so "reveal on scroll" sections stay blank: scroll through first.
    if (opts.full) {
      await page.evaluate(async () => {
        const step = Math.max(200, Math.round(innerHeight * 0.7));
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 140));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(900);
    }
    // Only a page that really scrolls sideways is a problem; then name the elements that stick out
    // (skipping ones an overflow:hidden/clip ancestor already cuts off, e.g. decorative art).
    const overflow = await page.evaluate(() => {
      const W = document.documentElement.clientWidth;
      if (document.documentElement.scrollWidth <= W) return [];
      const out = [`page ${document.documentElement.scrollWidth}px > ${W}px`];
      const clipped = (el) => {
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          if (/(hidden|clip)/.test(getComputedStyle(p).overflowX)) return true;
        }
        return false;
      };
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width && r.right > W + 1 && getComputedStyle(el).position !== 'fixed' && !clipped(el)) {
          out.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/)[0]}` : ''} → ${Math.round(r.right)}px`);
        }
        if (out.length >= 6) break;
      }
      return out;
    });
    await page.screenshot({ path: file, fullPage: Boolean(opts.full) });
    return { ok: true, overflow, problems };
  } catch (err) {
    return { ok: false, overflow: [], problems: [...problems, `failed: ${err.message.split('\n')[0]}`] };
  } finally {
    await context.close();
  }
}

async function main() {
  let opts;
  try { opts = parseArgs(process.argv.slice(2)); } catch (err) { console.error(err.message); console.log(HELP); process.exit(2); }
  if (opts.help || !opts.urls.length || !opts.out) { console.log(HELP); process.exit(opts.help ? 0 : 2); }
  const pw = await loadPlaywright(opts.playwright);
  if (!pw) { console.error('Playwright not found (tried --playwright, the current folder and the skill folder).'); console.log(HELP); process.exit(2); }
  const sizes = opts.sizes.split(',').map((s) => { const [w, h] = s.toLowerCase().split('x').map(Number); return { width: w, height: h }; });
  const schemes = opts.schemes.split(',').map((s) => s.trim());
  mkdirSync(opts.out, { recursive: true });
  const { browser, channel } = await launch(pw.chromium, opts.channel);
  console.log(`playwright: ${pw.from}\nbrowser: ${channel}\n`);
  let failed = 0;
  try {
    for (const url of opts.urls) {
      for (const size of sizes) {
        for (const scheme of schemes) {
          const file = join(resolve(opts.out), `${opts.name || slug(url)}-${size.width}x${size.height}-${scheme}.png`);
          const r = await shoot(browser, url, { ...size, scheme }, opts, file);
          if (!r.ok) failed += 1;
          const flags = [r.overflow.length ? `OVERFLOW ${r.overflow.join('; ')}` : '', r.problems.length ? `${r.problems.length} problem(s)` : ''].filter(Boolean).join(' · ');
          console.log(`${r.ok ? 'ok ' : 'ERR'} ${file}${flags ? `\n    ${flags}` : ''}`);
          for (const p of r.problems.slice(0, 5)) console.log(`    - ${p}`);
        }
      }
    }
  } finally {
    await browser.close();
  }
  if (!existsSync(opts.out)) failed += 1;
  process.exit(failed ? 1 : 0);
}

main();
