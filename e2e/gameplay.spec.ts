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
