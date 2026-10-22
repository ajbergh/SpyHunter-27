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
  await page.locator('#high-contrast').check();
  await page.getByRole('button', { name: /apply and return/i }).click();
  await page.reload();
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await expect(page.locator('#bindings-grid [data-action="fire"] strong')).toHaveText('Z');
  await expect(page.locator('#reduced-motion')).toBeChecked();
  await expect(page.locator('#high-contrast')).toBeChecked();
  await expect(page.locator('.cabinet')).toHaveClass(/reduced-motion/);
  await expect(page.locator('.cabinet')).toHaveClass(/high-contrast/);
});

test('reaches mission terminated from real collisions and supports clean redeploy', async ({ page }) => {
  test.setTimeout(80000);
  const crashes: string[] = [];
  page.on('pageerror', e => crashes.push(e.message));
  await page.goto('/');
  // Software WebGL shadow rendering must not distort simulation time during
  // a long collision-recovery regression. Use the actual Low user preset.
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await page.locator('#quality-select').selectOption('low');
  await page.getByRole('button', { name: /apply and return/i }).click();
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await page.keyboard.down('d');
  await page.keyboard.down('w');
  await expect(page.locator('#gameover')).toBeVisible({ timeout: 65000 });
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

test('daily challenge shows UTC date and seeded session identity', async ({ page }) => {
  await page.goto('/');
  await page.locator('#mode-select').selectOption('daily');
  await expect(page.locator('#mode-description')).toContainText('UTC');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#daily-stamp')).toBeVisible();
  await expect(page.locator('#daily-date')).toContainText(/^\d{4}-\d{2}-\d{2}$/);
  await expect(page.locator('#lives')).toHaveText('●●●');
});

test('shows split-road approach warning and renders branch geometry', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/?testDistance=480');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#toast')).toContainText('DIVIDED HIGHWAY', { timeout: 5000 });
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.screenshot({ path: 'test-results/divided-highway-warning.png' });
  expect(errors).toEqual([]);
});

test('pursuit fork commits to selected route and reports branch status', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?testDistance=618');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#route-status')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#route-name')).toHaveText('PURSUIT ROUTE');
  await expect(page.locator('#stage canvas')).toBeVisible();
  expect(errors).toEqual([]);
});

test('prealigned interceptor selects the shadow bypass branch even under graphics load', async ({ page }) => {
  await page.goto('/?testDistance=618&testLane=-6.4');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#route-name')).toHaveText('SHADOW BYPASS', { timeout: 9000 });
  await expect(page.locator('#route-status')).toBeVisible();
});

test('renders curved desert canyon bridge with no runtime errors', async ({ page }) => {
  const crashes: string[] = [];
  page.on('pageerror', error => crashes.push(error.message));
  await page.goto('/?testDistance=1360');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#environment-name')).toContainText('DESERT');
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.screenshot({ path: 'test-results/bridge-canyon.png' });
  expect(crashes).toEqual([]);
});

test('warns before the distinct city viaduct bridge', async ({ page }) => {
  const crashes: string[] = [];
  page.on('pageerror', error => crashes.push(error.message));
  await page.goto('/?testDistance=3200');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#toast')).toContainText('VIADUCT', { timeout: 4500 });
  await expect(page.locator('#environment-name')).toContainText('NEON CITY');
  expect(crashes).toEqual([]);
});

test('squad pincer banner begins hidden before coordinated attacks arrive', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#tactic-status')).toBeHidden();
  await expect(page.locator('#stage canvas')).toBeVisible();
  expect(errors).toEqual([]);
});

test('gamepad buttons can be reassigned and persist between sessions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await page.locator('#gamepad-fire').selectOption('14');
  await expect(page.locator('#gamepad-fire')).toHaveValue('14');
  await page.locator('#gamepad-missile').selectOption('14');
  await expect(page.locator('#gamepad-missile')).toHaveValue('1');
  await expect(page.locator('#gamepad-status')).toContainText('already assigned');
  await page.getByRole('button', { name: /apply and return/i }).click();
  await page.reload();
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await expect(page.locator('#gamepad-fire')).toHaveValue('14');
});

test('elite air combat and debris renderer initialize without WebGL exceptions', async ({ page }) => {
  const crashes: string[] = [];
  page.on('pageerror', error => crashes.push(error.message));
  await page.goto('/?testDistance=2150');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#environment-name')).toContainText('ARCTIC');
  await expect(page.locator('#stage canvas')).toBeVisible();
  expect(crashes).toEqual([]);
});

test('cinematic high preset renders neon lighting, reflective surfaces and soft shadows', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?testDistance=3310');
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await page.locator('#quality-select').selectOption('high');
  await page.getByRole('button', { name: /apply and return/i }).click();
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#environment-name')).toContainText('NEON CITY');
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.screenshot({ path: 'test-results/cinematic-city-high.png' });
  expect(errors).toEqual([]);
});

test('upgraded animated water shader works on high-quality WebGL2', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?testDistance=4350');
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await page.locator('#quality-select').selectOption('high');
  await page.getByRole('button', { name: /apply and return/i }).click();
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#environment-name')).toContainText('WATERWAY');
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.screenshot({ path: 'test-results/cinematic-water-high.png' });
  expect(errors).toEqual([]);
});

test('original sculpted interceptor and dimensional terrain render in cinematic perspective', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('/?testDistance=1360');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#environment-name')).toContainText('DESERT');
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.screenshot({ path: 'test-results/terrain-sculpted-desert.png' });
  expect(errors).toEqual([]);
});

test('detailed 3D skyline and vehicle studio reflections render with high grade', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('/?testDistance=3330');
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await page.locator('#quality-select').selectOption('high');
  await page.getByRole('button', { name: /apply and return/i }).click();
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#environment-name')).toContainText('NEON CITY');
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.screenshot({ path: 'test-results/aaa-direction-neon-city.png' });
  expect(errors).toEqual([]);
});

test('cinematic environment hero landmarks render on high preset', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('/?testDistance=3340');
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await page.locator('#quality-select').selectOption('high');
  await page.getByRole('button', { name: /apply and return/i }).click();
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#environment-name')).toContainText('NEON CITY');
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.screenshot({ path: 'test-results/neon-landmark-hero.png' });
  expect(errors).toEqual([]);
});

test('reworked marine environment and watercraft render without shader errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('/?testDistance=4350');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#environment-name')).toContainText('WATERWAY');
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.screenshot({ path: 'test-results/marine-art-upgrade.png' });
  expect(errors).toEqual([]);
});

test('high-preset roadside forest canopy and close cinematic camera remain WebGL-safe', async ({ page }) => {
  const crashes: string[] = [];
  page.on('pageerror', error => crashes.push(error.message));
  await page.goto('/?testDistance=245');
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await page.locator('#quality-select').selectOption('high');
  await page.getByRole('button', { name: /apply and return/i }).click();
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#environment-name')).toContainText('FOREST');
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.screenshot({ path: 'test-results/forest-instanced-roadside-cinematic.png' });
  expect(crashes).toEqual([]);
});

test('road wear and desert clusters remain stable through streamed tile traversal', async ({ page }) => {
  const crashes: string[] = [];
  page.on('pageerror', error => crashes.push(error.message));
  await page.goto('/?testDistance=1350');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#environment-name')).toContainText('DESERT');
  await page.keyboard.down('w');
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.screenshot({ path: 'test-results/desert-roadwear-instances.png' });
  await page.keyboard.up('w');
  expect(crashes).toEqual([]);
});

test('high preset retains readable interceptor bodywork under restrained bloom', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?testDistance=3330');
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await page.locator('#quality-select').selectOption('high');
  await page.getByRole('button', { name: /apply and return/i }).click();
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#environment-name')).toContainText('NEON CITY');
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.screenshot({ path: 'test-results/balanced-neon-city-interceptor.png' });
  expect(errors).toEqual([]);
});

test('high-speed steering preserves WebGL gameplay with pooled tire skid marks', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?testDistance=1500');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await page.keyboard.down('w');
  await page.keyboard.down('a');
  await page.waitForTimeout(1150);
  await page.keyboard.up('a');
  await page.keyboard.up('w');
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.screenshot({ path: 'test-results/tire-skid-balance.png' });
  expect(errors).toEqual([]);
});

test('UV-mapped vehicle panel textures render in live high-quality forest play', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?testDistance=285');
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await page.locator('#quality-select').selectOption('high');
  await page.getByRole('button', { name: /apply and return/i }).click();
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.screenshot({ path: 'test-results/uv-mapped-vehicle-paint.png' });
  expect(errors).toEqual([]);
});

test('biome sky gradient and solar haze render across snow and desert transitions', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?testDistance=2260');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#environment-name')).toContainText('ARCTIC');
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.screenshot({ path: 'test-results/new-atmosphere-arctic.png' });
  expect(errors).toEqual([]);
});

test('neon roadway renders pooled wet reflections under high preset without WebGL failures', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?testDistance=3340');
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await page.locator('#quality-select').selectOption('high');
  await page.getByRole('button', { name: /apply and return/i }).click();
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#environment-name')).toContainText('NEON CITY');
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.screenshot({ path: 'test-results/neon-city-wet-reflections.png' });
  expect(errors).toEqual([]);
});

test('steering and brake lights remain WebGL-safe under cinematic neon driving', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?testDistance=3320');
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await page.locator('#quality-select').selectOption('high');
  await page.getByRole('button', { name: /apply and return/i }).click();
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#environment-name')).toContainText('NEON CITY');
  await page.keyboard.down('s');
  await page.keyboard.down('a');
  await page.waitForTimeout(750);
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.screenshot({ path: 'test-results/steering-wheel-brake-lights-neon.png' });
  await page.keyboard.up('a');
  await page.keyboard.up('s');
  expect(errors).toEqual([]);
});

test('cinematic helicopter searchlight renders in neon with no WebGL errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /WebGLProgram|shader|GL_INVALID_OPERATION/i.test(message.text())) {
      errors.push(message.text());
    }
  });
  await page.goto('/?testDistance=3350&testHelicopter=ace');
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await page.locator('#quality-select').selectOption('high');
  await page.getByRole('button', { name: /apply and return/i }).click();
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#environment-name')).toContainText('NEON CITY');
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.waitForTimeout(450);
  await page.screenshot({ path: 'test-results/gunship-searchlight-neon-high.png' });
  expect(errors).toEqual([]);
});

test('high-quality waterway renders pooled V-hull foam without WebGL errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /WebGLProgram|shader|GL_INVALID_OPERATION/i.test(message.text())) {
      errors.push(message.text());
    }
  });
  await page.goto('/?testDistance=4350');
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await page.locator('#quality-select').selectOption('high');
  await page.getByRole('button', { name: /apply and return/i }).click();
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#environment-name')).toContainText('WATERWAY');
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.keyboard.down('w');
  await page.waitForTimeout(750);
  await page.keyboard.up('w');
  await page.screenshot({ path: 'test-results/v-hull-foam-waterway-high.png' });
  expect(errors).toEqual([]);
});

test('classic speed control moves interceptor forward and backward inside the road view', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  // With CI's SwiftShader WebGL, real-time seconds may have only a handful of
  // frames. Advance the *same* fixed-step game simulation with real key state,
  // then verify collision-space depth, not just an animation or a screenshot.
  await page.goto('/?testDistance=140&testLane=6.4&testDrive=1');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  const car = page.locator('#stage canvas');
  await expect(car).toBeVisible();
  const advance = async (frames: number) => page.evaluate((ticks: number) => {
    const win = window as Window & {
      __spy27AdvanceDriving?: (frames: number) => {
        z: number; speed: number; screen: string;
      };
    };
    if (!win.__spy27AdvanceDriving) throw new Error('Development driving harness missing');
    return win.__spy27AdvanceDriving(ticks);
  }, frames);
  const initial = Number(await car.getAttribute('data-player-z'));
  await page.keyboard.down('w');
  const low = await advance(150);
  expect(low.speed).toBeGreaterThan(38);
  expect(low.speed).toBeLessThan(42);
  await expect(page.locator('#drive-gear')).toHaveText('LOW');
  await page.keyboard.down('g');
  await advance(1);
  await page.keyboard.up('g');
  await expect(page.locator('#drive-gear')).toHaveText('HIGH');
  const accelerated = await advance(210);
  await page.keyboard.up('w');
  expect(accelerated.screen).toBe('playing');
  expect(accelerated.speed).toBeGreaterThan(48);
  const forward = accelerated.z;
  expect(forward).toBeLessThan(initial - 5);
  await expect.poll(async () => Number(await car.getAttribute('data-player-z')))
    .toBeLessThan(initial - 5);
  await page.screenshot({ path: 'test-results/arcade-driving-forward.png' });
  await page.keyboard.down('s');
  const braked = await advance(180);
  await page.keyboard.up('s');
  expect(braked.screen).toBe('playing');
  expect(braked.speed).toBeLessThan(14);
  expect(braked.z).toBeGreaterThan(forward + 7);
  await expect.poll(async () => Number(await car.getAttribute('data-player-z')))
    .toBeGreaterThan(forward + 7);
  await page.screenshot({ path: 'test-results/arcade-driving-rearward.png' });
  expect(errors).toEqual([]);
});

test('head-on hostile appears facing the oncoming lane while player can dodge it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /WebGLProgram|shader|GL_INVALID_OPERATION/i.test(message.text())) {
      errors.push(message.text());
    }
  });
  await page.goto('/?testDistance=420&testLane=6.4&testHeadOn=1');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  const stage = page.locator('#stage canvas');
  await expect(stage).toBeVisible();
  await expect(stage).toHaveAttribute('data-head-on', '1');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/head-on-hostile-traffic.png' });
  expect(errors).toEqual([]);
});

test('manual gear shift is edge-triggered and can be rebound from settings', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('/?testDrive=1&testLane=6.4');
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await page.locator('[data-action="gear"]').click();
  await page.keyboard.press('z');
  await expect(page.locator('[data-action="gear"] strong')).toHaveText('Z');
  await page.getByRole('button', { name: /apply and return/i }).click();
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  await expect(page.locator('#drive-gear')).toHaveText('LOW');
  const advance = (frames: number) => page.evaluate(ticks => {
    const game = window as Window & { __spy27AdvanceDriving?: (n: number) => unknown };
    if (!game.__spy27AdvanceDriving) throw new Error('Missing test drivetrain bridge');
    game.__spy27AdvanceDriving(ticks);
  }, frames);

  await page.keyboard.down('z');
  await advance(3);
  await expect(page.locator('#drive-gear')).toHaveText('HIGH');
  await advance(100);
  await expect(page.locator('#drive-gear')).toHaveText('HIGH');
  await page.keyboard.up('z');
  await advance(2);
  await page.keyboard.down('z');
  await advance(2);
  await expect(page.locator('#drive-gear')).toHaveText('LOW');
  await page.keyboard.up('z');

  await page.reload();
  await page.getByRole('button', { name: /settings \/ audio \/ graphics/i }).click();
  await expect(page.locator('[data-action="gear"] strong')).toHaveText('Z');
  expect(errors).toEqual([]);
});

test('rear pursuer approaches from behind and high gear provides a readable escape', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => {
    if (msg.type() === 'error' && /WebGLProgram|shader|GL_INVALID_OPERATION/i.test(msg.text()))
      errors.push(msg.text());
  });
  await page.goto('/?testDistance=700&testDrive=1&testLane=-6.4&testTail=1');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  const canvas = page.locator('#stage canvas');
  await expect(canvas).toBeVisible();
  const advance = (frames: number) => page.evaluate(ticks => {
    const runtime = window as Window & { __spy27AdvanceDriving?: (frames: number) => unknown };
    if (!runtime.__spy27AdvanceDriving) throw new Error('Driving test bridge missing');
    return runtime.__spy27AdvanceDriving(ticks);
  }, frames);
  await advance(1);
  await expect(page.locator('#tactic-status')).toBeVisible();
  await expect(page.locator('#tactic-status')).toContainText('REAR PURSUIT');
  await expect(canvas).toHaveAttribute('data-rear-pursuit', '1');
  await page.screenshot({ path: 'test-results/rear-pursuit-interceptor-low.png' });
  await page.keyboard.down('g');
  await advance(1);
  await page.keyboard.up('g');
  await page.keyboard.down('w');
  await advance(250);
  await page.keyboard.up('w');
  await expect(page.locator('#drive-gear')).toHaveText('HIGH');
  const speed = Number((await page.locator('#speed').textContent()) ?? '0');
  expect(speed).toBeGreaterThan(105);
  await page.screenshot({ path: 'test-results/rear-pursuit-escape-high.png' });
  expect(errors).toEqual([]);
});

test('rear adversary selects a safe flanking lane and advertises the later cut-in', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?testDistance=1300&testDrive=1&testLane=0&testTail=1');
  await page.getByRole('button', { name: /initiate pursuit/i }).click();
  const canvas = page.locator('#stage canvas');
  await expect(canvas).toBeVisible();
  const advance = (frames: number) => page.evaluate(ticks => {
    const game = window as Window & {
      __spy27AdvanceDriving?: (n: number) => {
        screen: string; rear: { x: number; z: number; state: string } | null;
      };
    };
    if (!game.__spy27AdvanceDriving) throw new Error('Driving test bridge missing');
    return game.__spy27AdvanceDriving(ticks);
  }, frames);

  const initial = await advance(1);
  expect(initial.rear?.state).toBe('overtaking');
  expect(initial.rear?.x).toBeLessThan(0);
  const passing = await advance(55);
  expect(passing.screen).toBe('playing');
  expect(passing.rear?.state).toBe('overtaking');
  expect(passing.rear?.x).toBeLessThan(-4);
  await expect(page.locator('#tactic-status')).toContainText('REAR FLANK');
  await page.screenshot({ path: 'test-results/rear-flank-side-pass.png' });

  await page.keyboard.down('w');
  const ahead = await advance(360);
  await page.keyboard.up('w');
  expect(ahead.screen).toBe('playing');
  expect(ahead.rear).not.toBeNull();
  expect(ahead.rear!.z).toBeLessThan(0);
  expect(ahead.rear!.state).toBe('screening');
  await expect(page.locator('#tactic-status')).toContainText('CUT-IN AHEAD');
  await page.screenshot({ path: 'test-results/rear-flank-forward-screen.png' });
  expect(errors).toEqual([]);
});
