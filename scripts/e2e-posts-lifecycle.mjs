import { chromium } from 'playwright';

const baseUrl = process.env.E2E_BASE_URL || 'http://127.0.0.1:3002';
const email = process.env.E2E_ADMIN_EMAIL || 'codex.e2e.admin@phulpur24.com';
const password = process.env.E2E_ADMIN_PASSWORD || 'Test@123';

function localDatetime(minutesAhead = 15) {
  const d = new Date(Date.now() + minutesAhead * 60_000);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

async function expectVisible(locator, label) {
  await locator.waitFor({ state: 'visible', timeout: 30_000 });
  return label;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  const run = {
    login: false,
    created: false,
    scheduled: false,
    archived: false,
    restored: false,
    publishedNow: false,
    postSlug: '',
    postId: '',
  };

  const stamp = Date.now();
  const title = `E2E Posts Lifecycle ${stamp}`;
  const slug = `e2e-posts-lifecycle-${stamp}`;
  run.postSlug = slug;

  await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole('button', { name: /Sign in to console/i }).click();
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 45_000 });
  run.login = true;

  await page.goto(`${baseUrl}/admin/posts/new`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[placeholder*="Article title"]').fill(title);
  await page.locator('input[placeholder="post-slug"]').fill(slug);
  await page.getByLabel('Excerpt / subtitle').fill('Automated E2E lifecycle test post.');
  await page.locator('textarea[placeholder*="Write the English version"]').fill(
    'This post is created by automated E2E to validate create, autosave, schedule, archive, restore, and publish-now lifecycle.'
  );
  await page.locator('input[type="url"]').last().fill('https://images.unsplash.com/photo-1495020689067-958852a7765e');

  const scheduleAt = localDatetime(20);
  await page.locator('input[type="datetime-local"]').fill(scheduleAt);
  await page.getByRole('button', { name: /Schedule publish/i }).click();
  await page.waitForURL(/\/admin\/posts\/art-/, { timeout: 45_000 });
  run.created = true;
  run.scheduled = true;
  const postUrl = page.url();
  run.postId = postUrl.split('/').pop() || '';

  await page.goto(`${baseUrl}/admin/posts`, { waitUntil: 'domcontentloaded' });
  const searchInput = page.locator('input[placeholder*="Search by title"]').first();
  await searchInput.fill(title);
  const row = page.locator('tr', { has: page.getByText(title) }).first();
  await expectVisible(row, 'post-row');
  await expectVisible(row.getByText('Scheduled'), 'scheduled-badge');
  await row.getByRole('button', { name: 'Archive' }).click();
  await expectVisible(row.getByText('Archived'), 'archived-status');
  run.archived = true;

  await row.getByRole('button', { name: 'Restore' }).click();
  await expectVisible(row.getByText('Draft'), 'draft-status');
  run.restored = true;

  await row.locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: 'Publish' }).first().click();
  const rowAfterPublish = page.locator('tr', { has: page.getByText(title) }).first();
  await expectVisible(rowAfterPublish.getByText('Published'), 'published-status');
  const scheduledCount = await rowAfterPublish.getByText('Scheduled').count();
  if (scheduledCount !== 0) {
    throw new Error('Expected scheduled badge to be absent after publish-now.');
  }
  run.publishedNow = true;

  await browser.close();
  console.log(JSON.stringify({ ok: true, run }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: String(error?.message || error) }, null, 2));
  process.exit(1);
});
