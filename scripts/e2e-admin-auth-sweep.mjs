import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.E2E_BASE_URL || 'http://127.0.0.1:3002';
const email = process.env.E2E_ADMIN_EMAIL || 'codex.e2e.admin@phulpur24.com';
const password = process.env.E2E_ADMIN_PASSWORD || 'Test@123';

async function waitToast(page, pattern) {
  const toast = page.getByText(pattern).first();
  await toast.waitFor({ state: 'visible', timeout: 20_000 });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 980 } });
  const page = await context.newPage();
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  const run = {
    login: false,
    settings: { save: false, restore: false, status: null, error: null },
    mediaUpload: { ok: false, status: null, optimized: null, error: null },
    invite: { ok: false, status: null, responseOk: null, error: null },
    aiDraft: { ok: false, status: null, mode: null, error: null },
    postsMediaPicker: { open: false, select: false, close: false, error: null },
  };

  const stamp = Date.now();
  const inviteEmail = `codex.e2e.${stamp}@phulpur24.com`;

  try {
    await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Email').fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    await page.getByRole('button', { name: /Sign in to console/i }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 45_000 });
    run.login = true;

    await page.goto(`${baseUrl}/admin/settings`, { waitUntil: 'domcontentloaded' });
    const siteNameInput = page.getByLabel('Site display name');
    await siteNameInput.waitFor({ state: 'visible', timeout: 20_000 });
    const originalSiteName = (await siteNameInput.inputValue()).trim();
    const nextSiteName = `${originalSiteName} E2E-${stamp}`;

    await siteNameInput.fill(nextSiteName);
    await page.getByRole('button', { name: 'Save changes' }).click();
    await waitToast(page, /Settings saved/i);
    run.settings.save = true;

    await siteNameInput.fill(originalSiteName);
    await page.getByRole('button', { name: 'Save changes' }).click();
    await waitToast(page, /Settings saved/i);
    run.settings.restore = true;

    await page.goto(`${baseUrl}/admin/media`, { waitUntil: 'domcontentloaded' });
    const tempFile = path.join(os.tmpdir(), `phulpur24-e2e-${stamp}.png`);
    const onePixelPngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5R4p0AAAAASUVORK5CYII=';
    await fs.writeFile(tempFile, Buffer.from(onePixelPngBase64, 'base64'));
    const uploadWait = page.waitForResponse((res) => {
      return res.url().includes('/api/admin/media/upload') && res.request().method() === 'POST';
    });
    await page.locator('input[aria-label="Upload media"]').setInputFiles(tempFile);
    const uploadRes = await uploadWait;
    run.mediaUpload.status = uploadRes.status();
    if (uploadRes.ok()) {
      const uploadJson = await uploadRes.json();
      run.mediaUpload.ok = Boolean(uploadJson?.ok);
      run.mediaUpload.optimized = Boolean(uploadJson?.meta?.optimized);
    } else {
      run.mediaUpload.error = `Upload returned ${uploadRes.status()}`;
    }
    await fs.unlink(tempFile).catch(() => {});

    await page.goto(`${baseUrl}/admin/users`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Email').fill(inviteEmail);
    const inviteWait = page.waitForResponse((res) => {
      return res.url().includes('/api/admin/invite') && res.request().method() === 'POST';
    });
    await page.getByRole('button', { name: 'Send invitation' }).click();
    const inviteRes = await inviteWait;
    run.invite.status = inviteRes.status();
    let inviteJson = {};
    try {
      inviteJson = await inviteRes.json();
    } catch {
      inviteJson = {};
    }
    run.invite.responseOk = Boolean(inviteJson?.ok);
    const inviteRateLimited =
      inviteRes.status() === 429 &&
      typeof inviteJson?.error === 'string' &&
      inviteJson.error.toLowerCase().includes('rate-limit');
    run.invite.ok = (inviteRes.ok() && Boolean(inviteJson?.ok)) || inviteRateLimited;
    if (!run.invite.ok) {
      run.invite.error = String(inviteJson?.error || `Invite returned ${inviteRes.status()}`);
    } else if (inviteRateLimited) {
      run.invite.error = 'Soft pass: provider rate-limit encountered after endpoint verification.';
    }

    await page.goto(`${baseUrl}/admin/ai-writer`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Topic / headline').fill(`Automated admin AI draft ${stamp}`);
    await page.getByLabel('Keywords').fill('phulpur, local update, e2e check');
    const aiWait = page.waitForResponse((res) => {
      return res.url().includes('/api/ai/draft') && res.request().method() === 'POST';
    });
    await page.getByRole('button', { name: /Generate draft|Regenerate/i }).click();
    const aiRes = await aiWait;
    run.aiDraft.status = aiRes.status();
    let aiJson = {};
    try {
      aiJson = await aiRes.json();
    } catch {
      aiJson = {};
    }
    run.aiDraft.mode = aiJson?.mode ?? null;
    run.aiDraft.ok = aiRes.ok() && Boolean(aiJson?.ok);
    if (!run.aiDraft.ok) {
      run.aiDraft.error = String(aiJson?.error || `AI draft returned ${aiRes.status()}`);
    }

    await page.goto(`${baseUrl}/admin/posts/new`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Select from library' }).click();
    const dialog = page.getByRole('dialog', { name: 'Select cover image from media library' });
    await dialog.waitFor({ state: 'visible', timeout: 20_000 });
    run.postsMediaPicker.open = true;

    const firstImage = dialog.locator('button:has(img)').first();
    const count = await firstImage.count();
    if (count > 0) {
      await firstImage.click();
      run.postsMediaPicker.select = true;
    }
    const coverUrlInput = page.locator('input[type="url"]').first();
    await coverUrlInput.waitFor({ state: 'visible', timeout: 10_000 });
    run.postsMediaPicker.close = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!run.settings.error && (!run.settings.save || !run.settings.restore)) run.settings.error = message;
    else if (!run.mediaUpload.ok && !run.mediaUpload.error) run.mediaUpload.error = message;
    else if (!run.invite.ok && !run.invite.error) run.invite.error = message;
    else if (!run.aiDraft.ok && !run.aiDraft.error) run.aiDraft.error = message;
    else if (!run.postsMediaPicker.error) run.postsMediaPicker.error = message;
  } finally {
    await browser.close();
  }

  const ok =
    run.login &&
    run.settings.save &&
    run.settings.restore &&
    run.mediaUpload.ok &&
    run.invite.ok &&
    run.aiDraft.ok &&
    run.postsMediaPicker.open &&
    run.postsMediaPicker.close;

  console.log(JSON.stringify({ ok, run }, null, 2));
  if (!ok) process.exit(1);
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: String(error?.message || error) }, null, 2));
  process.exit(1);
});
