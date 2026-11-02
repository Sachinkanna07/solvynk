import { expect, test } from '@playwright/test';

const widths = [320, 360, 390, 768, 1024, 1440, 1920];
const routes = ['index.html', 'explore.html', 'problem.html?slug=tamil-voice-recognition', 'project.html?slug=kuralvoice', 'prototype.html'];
const panels = ['builder', 'owner', 'linker', 'review', 'member', 'admin'];

for (const width of widths) {
  test(`T-002 five routes and six Studio panels fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of routes) {
      await page.goto('/' + route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), route).toBeLessThanOrEqual(1);
    }
    for (const panel of panels) {
      await page.locator(`#${panel}-tab`).click();
      await expect(page.locator(`#${panel}`)).toBeVisible();
      const extent = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        offenders: [...document.querySelectorAll('#' + document.querySelector('.prototype-panel:not([hidden])')!.id + ' *')]
          .filter(element => element.getBoundingClientRect().right > innerWidth + 1)
          .slice(0, 8).map(element => `${element.tagName}.${element.className}: ${Math.round(element.getBoundingClientRect().right)}`) }));
      expect(extent.overflow, `${panel} @ ${width}: ${extent.offenders.join(', ')}`).toBeLessThanOrEqual(1);
    }
    expect(errors).toEqual([]);
  });
}

for (const [route, panel, width, name] of [
  ['prototype.html', 'linker', 390, 'linker-390'],
  ['prototype.html', 'review', 1440, 'review-1440'],
  ['prototype.html', 'member', 390, 'member-390'],
  ['prototype.html', 'admin', 390, 'admin-390'],
  ['project.html?slug=kuralvoice', '', 1440, 'project-1440'],
  ['problem.html?slug=tamil-voice-recognition', '', 390, 'problem-390']
] as const) {
  test(`T-002 evidence ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/' + route);
    if (panel) await page.locator(`#${panel}-tab`).click();
    await page.screenshot({ path: `artifacts/t002-qa/${test.info().project.name}/${name}.png`, fullPage: true });
  });
}
