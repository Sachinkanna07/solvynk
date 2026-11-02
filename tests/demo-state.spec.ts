import { expect, test } from '@playwright/test';

const relevance = 'This sample project claims the first requirement with a documented local implementation and a repeatable demonstration for the problem owner to review.';

test('invalid and outdated browser state is discarded; reset restores defaults', async ({ page }) => {
  await page.goto('/prototype.html');
  const result = await page.evaluate(() => {
    const demo = (window as any).SolvynkDemoState;
    localStorage.setItem(demo.key, JSON.stringify({ version: 999, links: [{ id: 'invented' }] }));
    const outdated = demo.getLinks().length;
    localStorage.setItem(demo.key, JSON.stringify({ version: 1, links: [{ id: 'invented' }], savedProjects: ['invented'] }));
    const invalid = demo.snapshot();
    demo.setSaved('project', 'kuralvoice', true);
    const saved = demo.isSaved('project', 'kuralvoice');
    demo.reset();
    return { outdated, invalidLinks: invalid.links.length, invalidSaves: invalid.savedProjects.length, saved, reset: demo.isSaved('project', 'kuralvoice') };
  });
  expect(result).toEqual({ outdated: 4, invalidLinks: 0, invalidSaves: 0, saved: true, reset: false });
});

test('problem draft preview reflects entered values safely and restores stable requirement IDs', async ({ page }) => {
  await page.goto('/prototype.html');
  await page.locator('#owner-tab').click();
  await page.locator('#prob-title').fill('A local water challenge');
  await page.locator('#prob-summary').fill('A concise and testable water-quality challenge for the sample community.');
  await page.locator('#requirements-list .req-input-row').first().locator('input').fill('<img src=x onerror=alert(1)> must remain text');
  await page.locator('#preview-problem-btn').click();
  await expect(page.locator('#problem-preview')).toContainText('A local water challenge');
  await expect(page.locator('#problem-preview')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('#problem-preview img')).toHaveCount(0);
  await page.getByRole('button', { name: 'Save Problem Draft' }).click();
  await page.reload();
  await page.locator('#owner-tab').click();
  await expect(page.locator('#prob-title')).toHaveValue('A local water challenge');
  await expect(page.locator('#requirements-list .req-input-row').first().locator('.mono')).toHaveText('R1:');
});

test('link, duplicate prevention and owner review stay consistent across detail pages', async ({ page }) => {
  await page.goto('/prototype.html#link-flow');
  await page.locator('#link-project-select').selectOption('tamilwhisper-wasm');
  await page.locator('#link-problem-select').selectOption('clean-water-testing');
  await page.locator('#link-requirements input[value="R1"]').check();
  await page.locator('#link-relevance').fill(relevance);
  await page.locator('#linker-form button[type="submit"]').click();
  await expect(page.locator('#linker-feedback')).toContainText('saved on this device');
  await page.locator('#linker-form button[type="submit"]').click();
  await expect(page.locator('#linker-feedback')).toContainText('already linked');

  await page.locator('#review-tab').click();
  await page.locator('#review-problem-select').selectOption('clean-water-testing');
  await page.locator('#review-link-select').selectOption('PRJ-102:PRB-002');
  await page.locator('#review-confirmations input[value="R1"]').check();
  await page.locator('#owner-review-text').fill('Sample owner confirms R1 after a local review; this is not official certification.');
  await page.locator('#feature-toggle').check();
  await page.locator('#save-review-btn').click();
  await expect(page.locator('#review-feedback')).toContainText('saved locally');

  await page.goto('/problem.html?slug=clean-water-testing');
  await expect(page.locator('.matrix-table')).toContainText('TamilWhisper WASM');
  await expect(page.locator('.matrix-table')).toContainText('Sample owner confirms R1');
  await expect(page.locator('.featured-solutions')).toContainText('TamilWhisper WASM');
  await page.goto('/project.html?slug=tamilwhisper-wasm');
  await expect(page.getByText('Sample owner confirms R1')).toBeVisible();
  await expect(page.getByText('Decentralised Community Water Quality Monitor')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Sample owner confirms R1')).toBeVisible();
});

test('saved items, reset, admin queue and switches are visibly local and persistent', async ({ page }) => {
  await page.goto('/project.html?slug=kuralvoice');
  await page.locator('[data-save="kuralvoice"]').click();
  await page.goto('/problem.html?slug=clean-water-testing');
  await page.locator('#save-prob-btn').click();
  await page.goto('/prototype.html#member');
  await page.locator('#member-tab').click();
  await expect(page.locator('#saved-projects-list')).toContainText('KuralVoice');
  await expect(page.locator('#saved-problems-list')).toContainText('Water Quality');
  await page.locator('#admin-tab').click();
  await page.locator('[data-demo-switch="publishing"]').uncheck();
  await expect(page.locator('#admin-feedback')).toContainText('disabled locally');
  await page.getByRole('button', { name: 'Mark reviewed: TamSpeech-Lite Android' }).click();
  await expect(page.locator('#admin-feedback')).toContainText('reviewed on this device');
  await page.reload();
  await page.locator('#admin-tab').click();
  await expect(page.locator('[data-demo-switch="publishing"]')).not.toBeChecked();
  await expect(page.locator('#admin-queue')).toContainText('reviewed');
  await page.locator('#member-tab').click();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#reset-demo-state').click();
  await expect(page.locator('#saved-projects-list')).toContainText('No saved projects');
  await expect(page.locator('#saved-problems-list')).toContainText('No saved problems');
  await page.locator('#admin-tab').click();
  await expect(page.locator('[data-demo-switch="publishing"]')).toBeChecked();
});

test('project gallery supports click and arrow-key selection', async ({ page }) => {
  await page.goto('/project.html?slug=kuralvoice');
  const buttons = page.locator('[data-gallery-index]');
  await expect(buttons).toHaveCount(2);
  await buttons.nth(1).click();
  await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await buttons.nth(1).press('ArrowRight');
  await expect(buttons.first()).toBeFocused();
  await expect(buttons.first()).toHaveAttribute('aria-pressed', 'true');
  await buttons.first().press('End');
  await expect(buttons.nth(1)).toBeFocused();
  await buttons.nth(1).press('Home');
  await expect(buttons.first()).toBeFocused();
});
