import { expect, test } from '@playwright/test';

test('boots WebGL and plays the fundamental arcade loop', async ({ page }) => {
  const crashes: string[] = [];
  page.on('pageerror', (error) => crashes.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /spy.*hunter/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /initiate pursuit/i })).toBeVisible();
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#menu')).toBeHidden();
  await expect(page.locator('#air-count')).toHaveText('00');
  await expect(page.locator('#combo-counter')).toBeHidden();
  await expect(page.locator('#enemy-round-count')).toHaveText('00');
  const canvas = page.locator('#stage canvas');
  await expect(canvas).toBeVisible();
  await expect.poll(async () => canvas.evaluate((element) => (element as HTMLCanvasElement).width)).toBeGreaterThan(1);

  await page.keyboard.down('w');
  await page.keyboard.down('Space');
  await expect.poll(async () => Number(await page.locator('#score').textContent())).toBeGreaterThan(0);
  await page.keyboard.up('Space');
  await page.keyboard.up('w');

  await page.keyboard.down('q');
  await expect(page.locator('#ammo-missile')).toHaveText('02');
  await page.keyboard.up('q');

  await page.keyboard.down('f');
  await expect(page.locator('#van-status')).toContainText('APPROACH');
  await page.keyboard.up('f');

  await page.keyboard.down('p');
  await expect(page.locator('#paused')).toBeVisible();
  await page.keyboard.up('p');
  await page.getByRole('button', { name: /resume pursuit/i }).click();
  await expect(page.locator('#paused')).toBeHidden();
  await page.screenshot({ path: 'test-results/phase2-gameplay.png' });
  expect(crashes).toEqual([]);
});

test('modern arcade mode configures lives and begins at forest biome', async ({ page }) => {
  await page.goto('/');
  await page.locator('#mode-select').selectOption('modern');
  await expect(page.locator('#mode-description')).toContainText('Extra protection');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#lives')).toHaveText('●●●●●');
  await expect(page.locator('#environment-name')).toContainText('FOREST');
});

test('persists renderer preferences and diagnostics across reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await expect(page.locator('#settings-panel')).toBeVisible();
  await page.locator('#quality-select').selectOption('low');
  await page.locator('#show-fps').check();
  await expect(page.locator('#fps-debug')).toBeVisible();
  await page.getByRole('button', { name: /apply and return/i }).click();
  await expect(page.locator('#settings-panel')).toBeHidden();
  await page.reload();
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await expect(page.locator('#quality-select')).toHaveValue('low');
  await expect(page.locator('#show-fps')).toBeChecked();
});

for (const [label, distance] of [
  ['FOREST', 300], ['DESERT', 1300], ['ARCTIC', 2300],
  ['NEON CITY', 3300], ['WATERWAY', 4300],
] as const) {
  test('renders biome: ' + label, async ({ page }) => {
    const crashes: string[] = [];
    page.on('pageerror', (e) => crashes.push(e.message));
    await page.goto('/?testDistance=' + distance);
    await page.getByRole('button', { name: /initiate pursuit/i }).click();
    await expect(page.locator('#environment-name')).toContainText(label);
    if (label === 'WATERWAY') {
      await expect(page.locator('#environment-name')).toContainText('SPEEDBOAT');
      await expect(page.locator('#van-status')).toContainText('NO VAN');
    }
    await expect(page.locator('#stage canvas')).toBeVisible();
    await page.screenshot({ path: 'test-results/biome-' + label.replaceAll(' ', '-').toLowerCase() + '.png' });
    expect(crashes).toEqual([]);
  });
}

test('converts a moving interceptor to boat when crossing a boathouse', async ({ page }) => {
  const crashes: string[] = [];
  page.on('pageerror', e => crashes.push(e.message));
  await page.goto('/?testDistance=3990');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#environment-name')).toContainText('NEON CITY');
  await expect(page.locator('#environment-name')).toContainText('SPEEDBOAT', { timeout: 10000 });
  await expect(page.locator('#van-status')).toContainText('NO VAN');
  expect(crashes).toEqual([]);
});

test('restores highway interceptor after leaving waterway', async ({ page }) => {
  await page.goto('/?testDistance=4990');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#environment-name')).toContainText('SPEEDBOAT');
  await expect(page.locator('#environment-name')).toContainText('FOREST HIGHWAY', { timeout: 10000 });
  await expect(page.locator('#environment-name')).not.toContainText('SPEEDBOAT');
  await expect(page.locator('#van-status')).toContainText('READY');
});

test('custom keyboard mappings persist and update visible control hints', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await page.locator('#bindings-grid [data-action="fire"]').click();
  await page.keyboard.press('z');
  await expect(page.locator('#bindings-grid [data-action="fire"] strong')).toHaveText('Z');
  await expect(page.locator('#control-keys')).toContainText('Z FIRE');
  await page.locator('#reduced-motion').check();
  await page.getByRole('button', { name: /apply and return/i }).click();
  await page.reload();
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await expect(page.locator('#bindings-grid [data-action="fire"] strong')).toHaveText('Z');
  await expect(page.locator('#reduced-motion')).toBeChecked();
  await expect(page.locator('.cabinet')).toHaveClass(/reduced-motion/);
});

test('reaches mission terminated from real collisions and supports clean redeploy', async ({ page }) => {
  test.setTimeout(50000);
  const crashes: string[] = [];
  page.on('pageerror', e => crashes.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await page.keyboard.down('d');
  await page.keyboard.down('w');
  await expect(page.locator('#gameover')).toBeVisible({ timeout: 35000 });
  await page.keyboard.up('d');
  await page.keyboard.up('w');
  await expect(page.locator('#result-time')).toContainText(/\d\d:\d\d/);
  await expect(page.locator('#result-distance')).toContainText('KM');
  await expect(page.locator('#result-accuracy')).toContainText('%');
  await page.getByRole('button', { name: /redeploy/i }).click();
  await expect(page.locator('#gameover')).toBeHidden();
  await expect(page.locator('#lives')).toHaveText('●●●');
  expect(crashes).toEqual([]);
});
