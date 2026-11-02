import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
  'index.html', 'explore.html',
  'problem.html?slug=tamil-voice-recognition',
  'project.html?slug=kuralvoice', 'prototype.html'
];
const widths = [320, 360, 390, 768, 1024, 1440, 1920];

function contrastRatio(foreground: string, background: string) {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
    const linear = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    const [red = 0, green = 0, blue = 0] = linear;
    return red * 0.2126 + green * 0.7152 + blue * 0.0722;
  };
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

test('shared navigation is keyboard reachable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/index.html');
  const menu = page.getByRole('button', { name: 'Menu' });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#mobile-nav')).toBeVisible();
  await expect(page.locator('#mobile-nav a').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await page.locator('#mobile-nav').getByRole('link', { name: 'Open Problems' }).click();
  await expect(page).toHaveURL(/explore\.html#problems/);
});

test('closing mobile navigation never leaves focus in a hidden link', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/index.html');
  const menu = page.getByRole('button', { name: 'Menu' });
  const mobileNav = page.locator('#mobile-nav');

  await menu.click();
  await expect(mobileNav.locator('a').first()).toBeFocused();
  await page.locator('main').dispatchEvent('click');
  await expect(mobileNav).toBeHidden();
  await expect(menu).toBeFocused();

  await menu.click();
  await expect(mobileNav.locator('a').first()).toBeFocused();
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(mobileNav).toBeHidden();
  await expect(page.locator('.site-header .nav-links a').first()).toBeFocused();
});

for (const width of [320, 360, 768]) {
  test(`mobile navigation opens accessibly at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/index.html');
    const menu = page.getByRole('button', { name: 'Menu' });
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#mobile-nav a').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toBeFocused();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
  });
}

test('shared mobile navigation opens on every entry route', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of routes) {
    await page.goto(`/${route}`);
    const menu = page.getByRole('button', { name: 'Menu' });
    await expect(menu, route).toBeVisible();
    await menu.click();
    await expect(page.locator('#mobile-nav a').first(), route).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu, route).toBeFocused();
  }
});

test('Studio tabs use roving focus and expose their panels', async ({ page }) => {
  await page.goto('/prototype.html');
  const builder = page.getByRole('tab', { name: /Builder/ });
  const owner = page.getByRole('tab', { name: /Problem Owner/ });
  await builder.focus();
  await page.keyboard.press('ArrowRight');
  await expect(owner).toBeFocused();
  await expect(owner).toHaveAttribute('aria-selected', 'true');
  await expect(builder).toHaveAttribute('tabindex', '-1');
  await expect(page.getByRole('tabpanel', { name: /Problem Owner/ })).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: /Member Space/ })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(builder).toBeFocused();
  await expect(page.getByRole('tabpanel', { name: /Builder/ })).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: /Member Space/ })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(builder).toBeFocused();
  await page.locator('#source-opt-manual').click();
  await expect(page.locator('#source-opt-manual')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#gh-repo-field')).toBeHidden();
});

test('outbound dialog traps focus, closes on Escape, and restores focus', async ({ page }) => {
  await page.goto('/project.html?slug=kuralvoice');
  const trigger = page.locator('[data-outbound-url]').first();
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Leaving Solvynk' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('link', { name: /Continue to Demo/ })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(trigger).toBeFocused();
});

test('outbound dialog cycles keyboard focus inside the modal', async ({ page }) => {
  await page.goto('/project.html?slug=kuralvoice');
  await page.locator('[data-outbound-url]').first().click();
  const dialog = page.getByRole('dialog', { name: 'Leaving Solvynk' });
  const cancel = dialog.getByRole('button', { name: 'Cancel' });
  const continueLink = dialog.getByRole('link', { name: /Continue to Demo/ });
  await expect(cancel).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(continueLink).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(cancel).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(continueLink).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(cancel).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(continueLink).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(cancel).toBeFocused();
  for (const key of ['Shift+Tab', 'Shift+Tab', 'Tab', 'Tab', 'Tab']) {
    await page.keyboard.press(key);
    const focus = await page.evaluate(() => {
      const modal = document.querySelector('#safety-modal');
      return {
        inside: modal === document.activeElement || Boolean(modal?.contains(document.activeElement)),
        tag: document.activeElement?.tagName,
        id: document.activeElement?.id
      };
    });
    expect(focus.inside, `focus after ${key}: ${focus.tag}#${focus.id}`).toBe(true);
  }
});

test('modal blocks background focus and survives repeated open-close cycles', async ({ page }) => {
  await page.goto('/project.html?slug=kuralvoice');
  const trigger = page.locator('[data-outbound-url]').first();
  const dialog = page.getByRole('dialog', { name: 'Leaving Solvynk' });
  const cancel = dialog.getByRole('button', { name: 'Cancel' });
  for (let cycle = 0; cycle < 3; cycle++) {
    await trigger.click();
    await expect(cancel).toBeFocused();
    await page.evaluate(() => document.querySelector<HTMLElement>('.site-header a[href]')?.focus());
    const focusInside = await page.evaluate(() => document.querySelector('#safety-modal')?.contains(document.activeElement));
    expect(focusInside).toBe(true);
    if (cycle % 2 === 0) await page.keyboard.press('Escape');
    else await cancel.click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  }
});

test('dialog restores a safe fallback when its trigger is disabled or removed', async ({ page }) => {
  await page.goto('/project.html?slug=kuralvoice');
  const trigger = page.locator('[data-outbound-url]').first();
  const dialog = page.getByRole('dialog', { name: 'Leaving Solvynk' });
  const headerLink = page.locator('.site-header a[href]').first();
  await trigger.click();
  await trigger.evaluate(element => element.setAttribute('aria-disabled', 'true'));
  await page.keyboard.press('Escape');
  await expect(headerLink).toBeFocused();
  await trigger.evaluate(element => element.removeAttribute('aria-disabled'));
  await trigger.click();
  await trigger.evaluate(element => element.remove());
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(headerLink).toBeFocused();
});

test('mobile dialog stays inside the viewport and traps keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/project.html?slug=kuralvoice');
  const trigger = page.locator('[data-outbound-url]').first();
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Leaving Solvynk' });
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('link', { name: /Continue to Demo/ })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('source selection supports keyboard activation', async ({ page }) => {
  await page.goto('/prototype.html');
  const manual = page.locator('#source-opt-manual');
  await manual.focus();
  await page.keyboard.press('Space');
  await expect(manual).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#gh-repo-field')).toBeHidden();
  const github = page.locator('#source-opt-gh');
  await github.focus();
  await page.keyboard.press('Enter');
  await expect(github).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#gh-repo-field')).toBeVisible();
});

test('Explore content filters remain accessible', async ({ page }) => {
  await page.goto('/explore.html');
  await page.getByRole('button', { name: 'Project Showcases' }).click();
  await expect(page.locator('#tab-projects')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#problems-section')).toBeHidden();
  await expect(page.locator('#projects-section')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('results shown');
});

test('reduced motion suppresses interface transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/index.html');
  const duration = await page.locator('.button-primary').first().evaluate(element => getComputedStyle(element).transitionDuration);
  expect(Number.parseFloat(duration)).toBeLessThan(0.001);
});

test('shared tokens load and touch controls meet 44px targets', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto('/index.html');
  const canvas = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--canvas-base').trim());
  expect(canvas).toBe('#0B0F16');
  for (const selector of ['.nav-toggle', '.hero-actions .button:first-child']) {
    const box = await page.locator(selector).boundingBox();
    expect(box?.height, selector).toBeGreaterThanOrEqual(44);
  }
  await page.goto('/explore.html');
  for (const selector of ['.tab-btn', '.filter-btn']) {
    const box = await page.locator(selector).first().boundingBox();
    expect(box?.height, selector).toBeGreaterThanOrEqual(44);
  }
  await page.goto('/prototype.html');
  const tab = await page.locator('.prototype-tab').first().boundingBox();
  expect(tab?.height).toBeGreaterThanOrEqual(44);
  await context.close();
});

test('muted text and focus tokens meet contrast thresholds on approved surfaces', async ({ page }) => {
  await page.goto('/index.html');
  const tokens = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return Object.fromEntries(['--text-muted', '--border-focus', '--canvas-base', '--canvas-nav', '--canvas-card', '--canvas-raised']
      .map(name => [name, styles.getPropertyValue(name).trim()]));
  });
  expect(tokens['--text-muted']).toBe('#9AAEC5');
  for (const surface of ['--canvas-base', '--canvas-nav', '--canvas-card', '--canvas-raised']) {
    expect(contrastRatio(tokens['--text-muted']!, tokens[surface]!), `${surface} muted text`).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(tokens['--border-focus']!, tokens[surface]!), `${surface} focus border`).toBeGreaterThanOrEqual(3);
  }
});

test('keyboard focus exposes a visible skip-link ring', async ({ page }) => {
  test.skip(test.info().project.name === 'webkit', 'WebKit on this Windows host does not model macOS full-keyboard-access settings; keyboard traversal is exercised in Chromium and Firefox.');
  await page.goto('/index.html');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  const focusStyle = await skip.evaluate(element => {
    const styles = getComputedStyle(element);
    return { width: styles.outlineWidth, style: styles.outlineStyle };
  });
  expect(focusStyle.style).toBe('solid');
  expect(parseFloat(focusStyle.width)).toBeGreaterThanOrEqual(2);
});

test('homepage heading levels remain sequential', async ({ page }) => {
  await page.goto('/index.html');
  const levels = await page.locator('main h1, main h2, main h3, main h4, main h5, main h6').evaluateAll(headings =>
    headings.map(heading => Number(heading.tagName.slice(1)))
  );
  expect(levels[0]).toBe(1);
  for (let index = 1; index < levels.length; index++) {
    expect(levels[index]!, `heading ${index + 1} skips from h${levels[index - 1]}`).toBeLessThanOrEqual(levels[index - 1]! + 1);
  }
});

test('open mobile navigation and dialog have no WCAG axe issues', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/index.html');
  await page.getByRole('button', { name: 'Menu' }).click();
  let results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations
    .map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, detail: n.any.map(check => check.data) })).slice(0, 8) })))
    .toEqual([]);
  await page.goto('/project.html?slug=kuralvoice');
  await page.locator('[data-outbound-url]').first().click();
  results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map(v => v.id)).toEqual([]);
});

test('all Studio tab panels have no WCAG axe issues', async ({ page }) => {
  await page.goto('/prototype.html');
  for (const tab of await page.getByRole('tab').all()) {
    await tab.click();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const tabId = await tab.getAttribute('id');
    expect(results.violations
      .map(v => ({ tab: tabId, id: v.id, nodes: v.nodes.map(n => n.target.join(' ')).slice(0, 5) })))
      .toEqual([]);
  }
});

for (const route of routes) {
  test(`${route} has no WCAG axe violations`, async ({ page }) => {
    await page.goto('/' + route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations
      .map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target.join(' ')).slice(0, 8) })))
      .toEqual([]);
  });
}

test('prototype serves fonts and scripts only from its origin', async ({ page }) => {
  const external: string[] = [];
  page.on('request', request => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') external.push(request.url());
  });
  for (const route of routes) {
    await page.goto('/' + route);
    await page.evaluate(() => document.fonts.ready);
  }
  expect(external).toEqual([]);
  expect(await page.evaluate(() => document.fonts.check('400 15px Inter'))).toBe(true);
});

for (const width of widths) {
  test(`all public surfaces fit ${width}px without horizontal page overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto('/' + route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      const offenders = overflow > 1 ? await page.evaluate(() => [...document.querySelectorAll('body *')]
        .filter(element => element.getBoundingClientRect().right > innerWidth + 1)
        .slice(0, 12).map(element => `${element.tagName.toLowerCase()}.${String(element.className).replaceAll(' ', '.')} parent=${element.parentElement?.className} text=${element.textContent?.trim().slice(0, 30)} right=${Math.round(element.getBoundingClientRect().right)}`)) : [];
      expect(overflow, `${route}: ${offenders.join(', ')}`).toBeLessThanOrEqual(1);
    }
    await page.goto('/index.html');
    await page.screenshot({ path: `artifacts/t002-qa/${test.info().project.name}/home-${width}.png`, fullPage: true });
  });
}

for (const route of ['explore.html', 'problem.html?slug=tamil-voice-recognition', 'project.html?slug=kuralvoice', 'prototype.html']) {
  test(`${route} representative mobile and desktop screenshots`, async ({ page }) => {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/' + route);
      const name = route.split('.')[0];
      await page.screenshot({ path: `artifacts/t002-qa/${test.info().project.name}/${name}-${width}.png`, fullPage: true });
    }
  });
}
