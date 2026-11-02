import { expect, test } from '@playwright/test';

test('Explore filters actual visible cards, reset, and hash navigation', async ({ page }) => {
  await page.goto('/explore.html#projects');
  const visibleCards = page.locator('[data-searchable]:visible');
  await expect(visibleCards).toHaveCount(3);
  await expect(page.locator('#tab-projects')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#explore-search').fill('KURALVOICE');
  await expect(visibleCards).toHaveCount(1);
  await expect(page.locator('#explore-result-status')).toContainText('1 results');
  await page.locator('#explore-search').fill('kural');
  await expect(visibleCards).toHaveCount(1);
  await page.locator('#explore-search').fill('KuRaLvOiCe');
  await expect(visibleCards).toHaveCount(1);
  await page.getByRole('button', { name: 'Accessibility & Voice' }).click();
  await expect(visibleCards).toHaveCount(1);
  await page.getByRole('button', { name: 'Sensors & Hardware' }).click();
  await expect(visibleCards).toHaveCount(0);
  await expect(page.locator('#explore-empty')).toBeVisible();
  await page.locator('#explore-search').fill('not-a-matching-project');
  await expect(visibleCards).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset Filters' }).click();
  await expect(visibleCards).toHaveCount(6);
  await page.getByRole('button', { name: 'Problems Hub' }).click();
  await expect(page).toHaveURL(/#problems$/);
  await expect(visibleCards).toHaveCount(3);
  await page.goBack();
  await expect(visibleCards).toHaveCount(6);
  await page.goForward();
  await expect(visibleCards).toHaveCount(3);
});

test('Project wizard validates fields and URL before advancing', async ({ page }) => {
  await page.goto('/prototype.html');
  await page.getByRole('button', { name: /Next: Engineering Facts/ }).click();
  await page.locator('#project-title').fill('');
  await page.getByRole('button', { name: /Next: Screenshots/ }).click();
  await expect(page.locator('#builder-step-2')).toBeVisible();
  await expect(page.locator('#project-title')).toBeFocused();
  await expect(page.locator('#project-errors')).toContainText('Project Name is required');
  await page.locator('#project-title').fill('Test project');
  await page.locator('#project-valueline').fill('');
  await page.getByRole('button', { name: /Next: Screenshots/ }).click();
  await expect(page.locator('#project-valueline')).toBeFocused();
  await page.locator('#project-valueline').fill('A real value proposition');
  await page.locator('#project-works').fill('');
  await page.getByRole('button', { name: /Next: Screenshots/ }).click();
  await expect(page.locator('#project-works')).toBeFocused();
  await page.locator('#project-works').fill('Works locally');
  await page.locator('#project-demo').fill('http://example.com');
  await page.getByRole('button', { name: /Next: Screenshots/ }).click();
  await expect(page.locator('#project-demo')).toBeFocused();
  await page.locator('#project-demo').fill('https://example.com');
  await page.getByRole('button', { name: /Next: Screenshots/ }).click();
  await expect(page.locator('#builder-step-3')).toBeVisible();
  await page.locator('#cover-alt').fill('');
  await page.getByRole('button', { name: /Next: Review & Scan/ }).click();
  await expect(page.locator('#cover-alt')).toBeFocused();
  await page.locator('#cover-alt').fill('Sample screenshot');
  await page.getByRole('button', { name: /Next: Review & Scan/ }).click();
  await expect(page.locator('#builder-step-4')).toBeVisible();
  await page.locator('#project-title').evaluate((input: HTMLInputElement) => { input.value = ''; });
  await page.getByRole('button', { name: 'Save Draft Locally' }).click();
  await expect(page.locator('#builder-step-2')).toBeVisible();
  await expect(page.locator('#project-title')).toBeFocused();
  await expect(page.locator('#project-feedback')).not.toContainText('saved locally');
  await page.locator('#project-title').fill('Test project');
  await page.getByRole('button', { name: /Next: Screenshots/ }).click();
  await page.getByRole('button', { name: /Next: Review & Scan/ }).click();
  await page.locator('#publish-confirm').uncheck();
  await page.locator('#publish-final-btn').click();
  await expect(page.locator('#publish-confirm')).toBeFocused();
  await expect(page.locator('#project-errors')).toContainText('Confirm');
  await page.getByRole('button', { name: /Back/ }).last().click();
  await expect(page.locator('#cover-alt')).toHaveValue('Sample screenshot');
});

test('Project draft restores safe fields and source after refresh, then resets', async ({ page }) => {
  await page.goto('/prototype.html');
  await page.locator('#source-opt-manual').click();
  await page.getByRole('button', { name: /Next: Engineering Facts/ }).click();
  await page.locator('#project-title').fill('My local prototype');
  await page.locator('#project-valueline').fill('A useful sample project');
  await page.locator('#project-stack').fill('Rust, WebAssembly');
  await page.locator('#project-demo').fill('https://example.com/demo');
  await page.getByRole('button', { name: /Next: Screenshots/ }).click();
  await page.getByRole('button', { name: /Next: Review & Scan/ }).click();
  await page.getByRole('button', { name: 'Save Draft Locally' }).click();
  await expect(page.locator('#project-feedback')).toContainText('saved locally');
  await page.reload();
  await expect(page.locator('#source-opt-manual')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#project-title')).toHaveValue('My local prototype');
  await expect(page.locator('#project-stack')).toHaveValue('Rust, WebAssembly');
  await expect(page.locator('#project-demo')).toHaveValue('https://example.com/demo');
  await page.locator('#reset-project-draft').click();
  await expect(page.locator('#project-title')).toHaveValue('KuralVoice STT');
  await page.reload();
  await expect(page.locator('#project-feedback')).toContainText('no draft has been saved');
});

test('Fictional secret marker blocks simulated submission and clears', async ({ page }) => {
  await page.goto('/prototype.html');
  await page.getByRole('button', { name: /Inject Demo Token Placeholder/ }).click();
  await expect(page.locator('#secret-scan-alert')).toBeVisible();
  await expect(page.locator('#publish-final-btn')).toBeDisabled();
  await page.getByRole('button', { name: 'Clear Test Secrets' }).click();
  await expect(page.locator('#secret-scan-alert')).toBeHidden();
  await expect(page.locator('#publish-final-btn')).toBeEnabled();
});

test('Copy sample Markdown responds without a JavaScript error', async ({ page, context }) => {
  if (test.info().project.name === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/project.html?slug=kuralvoice');
  await page.locator('#copy-badge-btn').click();
  if (test.info().project.name === 'chromium') {
    await expect(page.locator('#badge-feedback')).toContainText('Sample Markdown link copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('[Sample Solvynk project]');
  } else {
    await expect(page.locator('#badge-feedback')).toContainText(/Sample Markdown link copied|Clipboard unavailable/);
  }
  expect(errors).toEqual([]);
});

test('Project and problem saves restore after reload; spark is reversible and honest', async ({ page }) => {
  await page.goto('/project.html?slug=kuralvoice');
  const saveProject = page.locator('[data-save="kuralvoice"]');
  await saveProject.click();
  await expect(saveProject).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(saveProject).toHaveAttribute('aria-pressed', 'true');
  await expect(saveProject).toContainText('Saved locally');
  const spark = page.locator('#spark-btn');
  await spark.click();
  await expect(spark).toHaveAttribute('aria-pressed', 'true');
  await spark.click();
  await expect(spark).toHaveAttribute('aria-pressed', 'false');
  await expect(spark).not.toContainText('24');
  await page.goto('/problem.html?slug=tamil-voice-recognition');
  const saveProblem = page.locator('#save-prob-btn');
  await saveProblem.click();
  await page.reload();
  await expect(saveProblem).toHaveAttribute('aria-pressed', 'true');
  await expect(saveProblem).toContainText('Saved locally');
});

test('Unknown slugs show an explicit not-found state', async ({ page }) => {
  await page.goto('/project.html?slug=missing');
  await expect(page.getByRole('heading', { name: 'Project not found' })).toBeVisible();
  await expect(page.getByText('KuralVoice — Ultra-Fast On-Device Tamil STT')).toHaveCount(0);
  await page.goto('/problem.html?slug=missing');
  await expect(page.getByRole('heading', { name: 'Problem not found' })).toBeVisible();
});

test('Problem requirements remain unique and the draft restores after refresh', async ({ page }) => {
  await page.goto('/prototype.html');
  await page.locator('#owner-tab').click();
  await page.locator('#prob-title').fill('A local challenge');
  await page.locator('#add-req-btn').click();
  await page.locator('#requirements-list .req-input-row').last().locator('input').fill('Fourth requirement');
  await page.locator('#requirements-list .req-input-row').last().getByRole('button', { name: 'Remove requirement' }).click();
  await page.locator('#add-req-btn').click();
  await expect(page.locator('#requirements-list .req-input-row').last().locator('.mono')).toHaveText('R4:');
  await page.locator('#requirements-list .req-input-row').last().locator('input').fill('Replacement fourth requirement');
  await page.getByRole('button', { name: 'Save Problem Draft' }).click();
  await expect(page.locator('#problem-feedback')).toContainText('saved locally');
  await page.reload();
  await page.locator('#owner-tab').click();
  await expect(page.locator('#prob-title')).toHaveValue('A local challenge');
  await expect(page.locator('#requirements-list .req-input-row')).toHaveCount(4);
  await expect(page.locator('#requirements-list .req-input-row').last().locator('input')).toHaveValue('Replacement fourth requirement');
  for (let index = 4; index < 8; index++) await page.locator('#add-req-btn').click();
  await expect(page.locator('#requirements-list .req-input-row')).toHaveCount(8);
  await page.locator('#add-req-btn').click();
  await expect(page.locator('#requirements-list .req-input-row')).toHaveCount(8);
  await page.locator('#reset-problem-draft').click();
  await expect(page.locator('#prob-title')).toHaveValue('Real-time Tamil Speech-to-Text for Low-Resource Edge Devices');
  await expect(page.locator('#requirements-list .req-input-row')).toHaveCount(3);
  await expect(page.locator('#problem-feedback')).toContainText('no problem draft has been saved');
  expect(await page.evaluate(() => localStorage.getItem('solvynk-problem-draft-v1'))).toBeNull();
});

test('Five entry routes and six Studio panels have no JavaScript page errors or missing local assets', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1:4173/') && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  for (const route of ['index.html', 'explore.html', 'problem.html?slug=tamil-voice-recognition', 'project.html?slug=kuralvoice', 'prototype.html']) {
    await page.goto('/' + route);
  }
  for (const tab of ['builder-tab', 'owner-tab', 'linker-tab', 'review-tab', 'admin-tab', 'member-tab']) {
    await page.locator(`#${tab}`).click();
  }
  expect(errors).toEqual([]);
});

test('Image picker creates a valid local preview and removes it', async ({ page }) => {
  await page.goto('/prototype.html');
  await page.getByRole('button', { name: /Next: Engineering Facts/ }).click();
  await page.getByRole('button', { name: /Next: Screenshots/ }).click();
  const chooserPromise = page.waitForEvent('filechooser');
  await page.locator('#select-project-images').click();
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: 'sample.png', mimeType: 'image/png',
    buffer: (globalThis as unknown as { Buffer: { from(value: string, encoding: string): Uint8Array } }).Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/vXcAAAAASUVORK5CYII=', 'base64')
  });
  await expect(page.locator('.local-image-preview')).toHaveCount(1);
  await expect(page.locator('.local-image-preview img')).toHaveAttribute('alt', 'Local preview: sample.png');
  await expect.poll(() => page.locator('.local-image-preview img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Remove preview sample.png' }).click();
  await expect(page.locator('.local-image-preview')).toHaveCount(0);
});
