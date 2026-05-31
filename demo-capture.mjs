/**
 * TriageAI Demo Capture — node demo-capture.mjs
 * Automates Chrome to screenshot every key scene, then ffmpeg stitches the MP4.
 * Run:  node demo-capture.mjs
 */
import { chromium } from 'playwright';
import { execSync }  from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT       = dirname(fileURLToPath(import.meta.url));
const FRAMES_DIR = join(ROOT, 'demo-frames');
const OUT_VIDEO  = join(ROOT, 'triageai-demo.mp4');
const BASE       = 'http://localhost:3000';

// hold = seconds this scene stays on screen in the final video
const HOLD = { xs: 1.5, s: 2.5, m: 4, l: 6, xl: 8 };

let seq = 1;
const frames = [];  // [{ file, hold }]

async function shot(page, name, hold = HOLD.m) {
  const file = join(FRAMES_DIR, `${String(seq).padStart(4,'0')}_${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  [${String(seq).padStart(3)}] ${name}  (${hold}s)`);
  frames.push({ file, hold });
  seq++;
}

async function slowType(page, selector, text, delay = 50) {
  await page.click(selector);
  for (const ch of text) {
    await page.keyboard.type(ch);
    await page.waitForTimeout(delay);
  }
}

(async () => {
  if (existsSync(FRAMES_DIR)) rmSync(FRAMES_DIR, { recursive: true });
  mkdirSync(FRAMES_DIR);

  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page    = await ctx.newPage();

  console.log('\n🎬  TriageAI Demo Capture — starting\n');

  // ── Scene 1: Home / Ticket Form ──────────────────────────────────────────
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await shot(page, 'home_landing', HOLD.xl);

  // ── Scene 2: Billing ticket — fill form ──────────────────────────────────
  await slowType(page, '#name',  'Jane Smith');
  await slowType(page, '#email', 'jane@example.com');
  await shot(page, 'billing_name_email', HOLD.s);

  await slowType(page, '#issue',
    'My payment failed twice and I was charged double the amount on my invoice. Please resolve urgently.', 40);
  await shot(page, 'billing_form_filled', HOLD.l);

  // ── Scene 3: Billing result ───────────────────────────────────────────────
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Billing', { timeout: 8000 }).catch(() => page.waitForTimeout(2000));
  await page.waitForTimeout(500);
  await shot(page, 'billing_result_top', HOLD.xl);
  await page.evaluate(() => window.scrollBy(0, 280));
  await page.waitForTimeout(300);
  await shot(page, 'billing_draft_response', HOLD.xl);

  try {
    await page.click('button:has-text("Copy")');
    await page.waitForTimeout(350);
    await shot(page, 'billing_copy_clicked', HOLD.s);
  } catch (_) {}

  // ── Scene 4: Bug/Technical ticket ────────────────────────────────────────
  await page.evaluate(() => window.scrollTo(0, 0));
  try { await page.click('button:has-text("Submit Another")'); await page.waitForTimeout(400); }
  catch (_) { await page.goto(BASE, { waitUntil: 'networkidle' }); }

  await slowType(page, '#name',  'Alex Johnson');
  await slowType(page, '#email', 'alex@example.com');
  await slowType(page, '#issue',
    'The app crashes every single time I try to upload a PDF file. This is blocking my work completely!', 40);
  await shot(page, 'bug_form_filled', HOLD.l);

  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Engineering', { timeout: 8000 }).catch(() => page.waitForTimeout(2000));
  await page.waitForTimeout(500);
  await shot(page, 'bug_result', HOLD.xl);

  // ── Scene 5: Feature Request ──────────────────────────────────────────────
  await page.evaluate(() => window.scrollTo(0, 0));
  try { await page.click('button:has-text("Submit Another")'); await page.waitForTimeout(400); }
  catch (_) { await page.goto(BASE, { waitUntil: 'networkidle' }); }

  await slowType(page, '#name',  'Sara Lee');
  await slowType(page, '#email', 'sara@example.com');
  await slowType(page, '#issue',
    'Could you please add dark mode to the dashboard? It would greatly improve my daily experience.', 40);
  await shot(page, 'feature_form_filled', HOLD.l);

  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Product', { timeout: 8000 }).catch(() => page.waitForTimeout(2000));
  await page.waitForTimeout(500);
  await shot(page, 'feature_result', HOLD.xl);

  // ── Scene 6: Queue dashboard ──────────────────────────────────────────────
  await page.goto(`${BASE}/queue`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await shot(page, 'queue_stats', HOLD.xl);

  try {
    await page.click('button:has-text("High")');
    await page.waitForTimeout(500);
    await shot(page, 'queue_high_filter', HOLD.l);
  } catch (_) {}

  try {
    const row = await page.$('tbody tr');
    if (row) { await row.click(); await page.waitForTimeout(500); }
    await shot(page, 'queue_row_expanded', HOLD.l);
  } catch (_) {}

  // ── Scene 7: n8n Workflow ─────────────────────────────────────────────────
  // Log in to n8n
  await page.goto('http://localhost:5678/signin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.fill('input[type="email"], input[name="email"], #email', 'admin@triageai.local');
  await page.fill('input[type="password"], input[name="password"], #password', 'TriageAI2026!');
  await page.click('button[type="submit"], button:has-text("Sign in")');
  await page.waitForTimeout(2500);
  await shot(page, 'n8n_after_login', HOLD.m);

  // Navigate directly to the triageai workflow canvas
  await page.goto('http://localhost:5678/workflow/triageai-workflow', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  // Dismiss any onboarding modal
  try { await page.keyboard.press('Escape'); await page.waitForTimeout(500); } catch (_) {}
  await shot(page, 'n8n_workflow_canvas', HOLD.xl);

  // Zoom out a bit to show all nodes
  try {
    await page.keyboard.press('Minus'); // n8n zoom out shortcut
    await page.keyboard.press('Minus');
    await page.waitForTimeout(400);
    await shot(page, 'n8n_workflow_zoomed', HOLD.xl);
  } catch (_) {}

  await browser.close();
  console.log(`\n✅  ${frames.length} scenes captured.\n`);

  // ── Build ffmpeg concat list with per-frame duration ──────────────────────
  const concatPath = join(FRAMES_DIR, 'concat.txt');
  const lines = frames.flatMap(f => [
    `file '${f.file.replace(/\\/g, '/')}'`,
    `duration ${f.hold}`,
  ]);
  // Repeat last frame so ffmpeg flushes it properly
  lines.push(`file '${frames.at(-1).file.replace(/\\/g, '/')}'`);
  writeFileSync(concatPath, lines.join('\n') + '\n');

  console.log('🎞  Stitching with ffmpeg…');
  const vf = 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p';
  const ff = `ffmpeg -y -f concat -safe 0 -i "${concatPath.replace(/\\/g, '/')}" -vf "${vf}" -c:v libx264 -crf 20 -preset fast -movflags +faststart "${OUT_VIDEO.replace(/\\/g, '/')}"`;
  console.log(' ', ff, '\n');
  execSync(ff, { stdio: 'inherit' });

  const mb = (statSync(OUT_VIDEO).size / 1024 / 1024).toFixed(1);
  console.log(`\n🎉  triageai-demo.mp4  created! (${mb} MB)`);
  console.log(`    ${OUT_VIDEO}\n`);
})();
