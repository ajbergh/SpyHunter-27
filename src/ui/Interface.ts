import type { WeaponCounts } from '../combat/SpecialWeapons';
import { GAME_MODES, type GameMode } from '../gameplay/GameModes';
import { transmissionLabel, type DriveGear } from '../gameplay/Transmission';
import { ROUTE_CHOICES, type RouteSide } from '../gameplay/RouteDirector';
import type { Biome } from '../world/WorldPlan';
import { formatMissionDistance, formatMissionTime } from '../gameplay/SessionMetrics';
import {
  loadPreferences, savePreferences, assignBinding, BINDING_ACTIONS,
  assignGamepadBinding, GAMEPAD_ACTIONS, type GamepadAction,
  type GamePreferences, type BindingAction,
} from '../gameplay/Settings';

export type Screen = 'menu' | 'playing' | 'paused' | 'gameover';

export class Interface {
  readonly stage: HTMLDivElement;
  private readonly root: HTMLDivElement;
  private readonly menu: HTMLElement;
  private readonly paused: HTMLElement;
  private readonly gameover: HTMLElement;
  private readonly hud: HTMLElement;
  onStart: (mode: GameMode) => void = () => {};
  private selectedMode: GameMode = 'classic';
  onResume: () => void = () => {};
  onSettingsChange: (settings: GamePreferences) => void = () => {};
  private preferences = loadPreferences();
  private capturing: BindingAction | null = null;

  constructor(host: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'cabinet';
    this.root.innerHTML = `
      <div class="top-bar"><span class="brand">SH<span class="brand-amber">/27</span></span><span class="top-tag">CLASSIFIED // PROJECT INTERCEPTOR</span><span class="signal"><i></i> SYSTEM ONLINE</span></div>
      <div class="viewport" id="viewport">
        <div class="stage" id="stage"></div>
        <div class="scanlines" aria-hidden="true"></div>
        <header class="hud" id="hud">
          <div class="hud-block"><span class="micro">SCORE</span><strong id="score">000000</strong><span class="micro">HI <span id="best">000000</span></span></div>
          <div class="hud-block hud-right"><span class="micro">LIVES <span id="lives">●●●</span></span><strong><span id="speed">025</span><small> MPH</small></strong><span class="micro">GEAR <b id="drive-gear" aria-live="polite">LOW</b> · CANNONS <b class="ready">ARMED</b></span></div>
        </header>
        <div class="toast" id="toast" aria-live="polite"></div>
        <div class="environment-name" id="environment-name">FOREST HIGHWAY</div>
        <div class="route-status" id="route-status" hidden><span>FORK CHOICE</span> <b id="route-name"></b></div>
        <div class="daily-stamp" id="daily-stamp" hidden>DAILY <b id="daily-date">—</b></div>
        <div class="special-hud" id="special-hud">
          <div class="special-line">[Q] MISSILE <b id="ammo-missile">03</b></div>
          <div class="special-line">[E] OIL <b id="ammo-oil">02</b></div>
          <div class="special-line">[R] SMOKE <b id="ammo-smoke">02</b></div>
          <div class="special-line van-line">VAN: <b id="van-status">READY [F]</b></div>
          <div class="special-line radar-line">AIR <b id="air-count">00</b> · ROUNDS <b id="enemy-round-count">00</b></div>
        </div>
        <div class="tactic-status" id="tactic-status" hidden>SQUAD TACTICS <b>PINCER</b><small>OPEN CENTER CORRIDOR</small></div>
        <div class="combo-counter" id="combo-counter" hidden>COMBO <b id="combo-value">×2</b><small id="combo-time">5.0s</small></div>
        <div class="penalty" id="penalty" hidden>NO POINTS <span id="penalty-time">5</span>s</div>
        <section class="panel" id="menu">
          <div class="eyebrow">1983 REIMAGINED // 2027 RECHARGED</div>
          <div class="emblem">◈</div>
          <h1>SPY<br /><span>HUNTER</span><small>'27</small></h1>
          <p class="subhead">THE PURSUIT NEVER ENDS.</p>
          <div class="panel-rule"></div>
          <p class="intro">INTERCEPT HOSTILES. PROTECT CIVILIANS.<br />SURVIVE THE HIGHWAY.</p>
          <label class="mode-label" for="mode-select">MISSION PROTOCOL</label>
          <select id="mode-select" class="mode-select" aria-label="Game mode"><option value="classic">CLASSIC ARCADE</option><option value="modern">MODERN ARCADE</option><option value="endless">ENDLESS PURSUIT</option><option value="daily">DAILY CHALLENGE</option></select>
          <p class="mode-description" id="mode-description">Three lives. Fast enemies. Every impact counts.</p>
          <button id="start-button" class="primary-button">INITIATE PURSUIT <span>↗</span></button>
          <div class="keys" id="control-keys">A / D <span>STEER</span> · W / S <span>SPEED</span> · SPACE <span>FIRE</span><div>Q <span>MISSILE</span> · E <span>OIL</span> · R <span>SMOKE</span> · F <span>RESUPPLY</span></div></div>
          <button class="aux-button" id="settings-button">SETTINGS / AUDIO / GRAPHICS</button>
          <p class="build-tag">THREE.JS // WEBGL ARCADE</p>
        </section>
        <section class="settings-overlay" id="settings-panel" hidden>
          <div class="eyebrow">SYSTEM PREFERENCES</div><h2 class="settings-heading">CONFIGURATION</h2>
          <label for="quality-select">RENDERING QUALITY</label>
          <select id="quality-select" aria-label="Rendering quality">
            <option value="low">LOW // PERFORMANCE</option>
            <option value="medium">MEDIUM // BALANCED</option>
            <option value="high">HIGH // CINEMATIC LIGHTING + BLOOM</option>
          </select>
          <label for="music-volume">ORIGINAL MUSIC VOLUME</label>
          <input type="range" id="music-volume" min="0" max="100" step="5" />
          <label for="effects-volume">SOUND EFFECTS VOLUME</label>
          <input type="range" id="effects-volume" min="0" max="100" step="5" />
          <label class="toggle"><input type="checkbox" id="reduced-motion" /> REDUCED MOTION</label>
          <label class="toggle"><input type="checkbox" id="high-contrast" /> HIGH-CONTRAST HUD</label>
          <label class="toggle"><input type="checkbox" id="show-fps" /> PERFORMANCE DIAGNOSTICS</label>
          <div class="binding-heading">REMAP KEYBOARD CONTROLS</div>
          <div class="bindings-grid" id="bindings-grid"></div>
          <p class="binding-status" id="binding-status" aria-live="polite">Select a command to change its key. Escape cancels.</p>
          <div class="binding-heading">GAMEPAD / STANDARD LAYOUT</div>
          <div class="gamepad-grid" id="gamepad-grid"></div>
          <p class="binding-status" id="gamepad-status" aria-live="polite">Reassign one gamepad button per action. Left stick steering stays available.</p>
          <button class="primary-button" id="close-settings">APPLY AND RETURN ↗</button>
        </section>
        <div class="fps-debug" id="fps-debug" hidden>FPS -- / DRAWS -- / VEH --</div>
        <section class="panel compact" id="paused" hidden>
          <div class="eyebrow">MISSION INTERRUPTED</div><h2>PAUSED</h2>
          <p class="intro">PRESS P OR ESC TO RESUME</p>
          <button class="primary-button" id="resume-button">RESUME PURSUIT ↗</button>
          <button class="aux-button" id="pause-settings-button">SETTINGS</button>
        </section>
        <section class="panel compact" id="gameover" hidden>
          <div class="eyebrow">INTERCEPTOR LOST</div><h2>MISSION<br />TERMINATED</h2>
          <p class="intro">FINAL SCORE</p><div class="final-score" id="final-score">000000</div>
          <p class="intro">BEST <span id="final-best">000000</span></p>
          <p class="intro" id="daily-result" hidden>DAILY BEST <strong id="daily-result-best">000000</strong></p>
          <div class="mission-results">
            <span>HOSTILES <b id="result-hostiles">0</b></span>
            <span>CIVILIANS <b id="result-civilians">0</b></span>
            <span>TOP COMBO <b id="result-combo">×1</b></span>
            <span>TRAVEL <b id="result-distance">0.00 KM</b></span>
            <span>TIME <b id="result-time">00:00</b></span>
            <span>ACCURACY <b id="result-accuracy">0%</b></span>
            <span>SHADOW ROUTES <b id="result-left-routes">0</b></span>
            <span>PURSUIT ROUTES <b id="result-right-routes">0</b></span>
          </div>
          <button class="primary-button" id="retry-button">REDEPLOY ↗</button>
        </section>
        <footer class="viewport-footer"><span>◉ LIVE OPERATIONS</span><span>THREAT LEVEL <b>HIGH</b></span><span id="sound-indicator">AUDIO ON</span></footer>
      </div>
      <div class="bottom-bar"><span>CONTROL // A,D STEER · W ACCEL · S BRAKE · SPACE FIRE</span><span>P PAUSE · M MUTE</span></div>
    `;
    host.appendChild(this.root);
    this.stage = this.get<HTMLDivElement>('stage');
    this.menu = this.get('menu');
    this.paused = this.get('paused');
    this.gameover = this.get('gameover');
    this.hud = this.get('hud');
    const mode = this.get<HTMLSelectElement>('mode-select');
    mode.addEventListener('change', () => {
      const selected = mode.value as GameMode;
      this.selectedMode = selected;
      this.get('mode-description').textContent = GAME_MODES[selected].description;
    });
    this.get('start-button').addEventListener('click', () => this.onStart(this.selectedMode));
    this.get('retry-button').addEventListener('click', () => this.onStart(this.selectedMode));
    this.get('resume-button').addEventListener('click', () => this.onResume());
    this.get('settings-button').addEventListener('click', () => { this.get('settings-panel').hidden = false; });
    this.get('pause-settings-button').addEventListener('click', () => { this.get('settings-panel').hidden = false; });
    this.get('close-settings').addEventListener('click', () => {
      this.capturing = null;
      this.get('settings-panel').hidden = true;
    });
    const quality = this.get<HTMLSelectElement>('quality-select');
    const music = this.get<HTMLInputElement>('music-volume');
    const effects = this.get<HTMLInputElement>('effects-volume');
    const motion = this.get<HTMLInputElement>('reduced-motion');
    const contrast = this.get<HTMLInputElement>('high-contrast');
    const fps = this.get<HTMLInputElement>('show-fps');
    quality.value = this.preferences.quality;
    music.value = String(Math.round(this.preferences.musicVolume * 100));
    effects.value = String(Math.round(this.preferences.effectsVolume * 100));
    motion.checked = this.preferences.reducedMotion;
    contrast.checked = this.preferences.highContrast;
    fps.checked = this.preferences.showFps;
    const change = () => {
      this.preferences = {
        quality: quality.value as GamePreferences['quality'],
        musicVolume: Number(music.value) / 100,
        effectsVolume: Number(effects.value) / 100,
        reducedMotion: motion.checked,
        highContrast: contrast.checked,
        showFps: fps.checked,
        bindings: this.preferences.bindings,
        gamepadBindings: this.preferences.gamepadBindings,
      };
      savePreferences(this.preferences);
      this.onSettingsChange(this.preferences);
      this.get('fps-debug').hidden = !this.preferences.showFps;
      this.root.classList.toggle('reduced-motion', this.preferences.reducedMotion);
      this.root.classList.toggle('high-contrast', this.preferences.highContrast);
    };
    for (const element of [quality, music, effects, motion, contrast, fps]) {
      element.addEventListener('change', change);
      element.addEventListener('input', change);
    }
    this.get('fps-debug').hidden = !this.preferences.showFps;
    this.root.classList.toggle('reduced-motion', this.preferences.reducedMotion);
    this.root.classList.toggle('high-contrast', this.preferences.highContrast);

    const labels: Record<BindingAction, string> = {
      left: 'LEFT', right: 'RIGHT', throttle: 'ACCELERATE', brake: 'BRAKE',
      fire: 'MACHINE GUNS', missile: 'MISSILE', oil: 'OIL / FLAME',
      smoke: 'SMOKE', van: 'RESUPPLY VAN', pause: 'PAUSE', gear: 'SHIFT LOW / HIGH',
    };
    const grid = this.get<HTMLDivElement>('bindings-grid');
    for (const action of BINDING_ACTIONS) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'binding-button';
      row.dataset.action = action;
      const label = document.createElement('span');
      label.textContent = labels[action];
      const key = document.createElement('strong');
      key.textContent = this.displayKey(this.preferences.bindings[action]);
      row.append(label, key);
      row.addEventListener('click', () => {
        this.capturing = action;
        this.get('binding-status').textContent = 'Press a new key for ' + labels[action] + ' — Escape to cancel';
      });
      grid.appendChild(row);
    }
    window.addEventListener('keydown', event => {
      if (!this.capturing) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const action = this.capturing;
      this.capturing = null;
      if (event.code === 'Escape') {
        this.get('binding-status').textContent = 'Key change cancelled';
        return;
      }
      const updated = assignBinding(this.preferences.bindings, action, event.code);
      if (!updated) {
        this.get('binding-status').textContent = 'Key unavailable or already assigned. Choose A–Z, 0–9, Space or Shift.';
        return;
      }
      this.preferences = { ...this.preferences, bindings: updated };
      savePreferences(this.preferences);
      this.onSettingsChange(this.preferences);
      this.get('binding-status').textContent = 'Updated ' + labels[action] + ' to ' + this.displayKey(event.code);
      const button = grid.querySelector<HTMLButtonElement>('[data-action="' + action + '"] strong');
      if (button) button.textContent = this.displayKey(event.code);
      this.refreshControlHints();
    }, true);
    const gamepadLabels: Record<GamepadAction, string> = {
      fire: 'MACHINE GUNS', missile: 'MISSILE', oil: 'OIL / FLAME',
      smoke: 'SMOKE', van: 'SUPPORT VAN', pause: 'PAUSE',
      throttle: 'THROTTLE', brake: 'BRAKE', gear: 'SHIFT LOW / HIGH',
    };
    const padGrid = this.get<HTMLDivElement>('gamepad-grid');
    for (const action of GAMEPAD_ACTIONS) {
      const label = document.createElement('label');
      label.className = 'gamepad-control';
      label.textContent = gamepadLabels[action];
      const select = document.createElement('select');
      select.id = 'gamepad-' + action;
      select.setAttribute('aria-label', 'Gamepad ' + gamepadLabels[action]);
      for (let i = 0; i <= 16; i++) {
        const option = document.createElement('option');
        option.value = String(i);
        option.textContent = 'Button ' + i;
        select.appendChild(option);
      }
      select.value = String(this.preferences.gamepadBindings[action]);
      select.addEventListener('change', () => {
        const updated = assignGamepadBinding(
          this.preferences.gamepadBindings, action, Number(select.value),
        );
        if (!updated) {
          select.value = String(this.preferences.gamepadBindings[action]);
          this.get('gamepad-status').textContent =
            'That button is already assigned or unavailable. Choose a free button.';
          return;
        }
        this.preferences = { ...this.preferences, gamepadBindings: updated };
        savePreferences(this.preferences);
        this.onSettingsChange(this.preferences);
        this.get('gamepad-status').textContent = gamepadLabels[action] + ' assigned to Button ' + updated[action];
      });
      label.appendChild(select);
      padGrid.appendChild(label);
    }
    this.refreshControlHints();
    this.show('menu');
  }

  private displayKey(code: string): string {
    return code.startsWith('Key') ? code.slice(3)
      : code.startsWith('Digit') ? code.slice(5)
      : code === 'Space' ? 'SPACE' : code.replace('Shift', 'SHIFT ');
  }

  private refreshControlHints(): void {
    const b = this.preferences.bindings;
    this.get('control-keys').textContent =
      this.displayKey(b.left) + '/' + this.displayKey(b.right) + ' STEER · ' +
      this.displayKey(b.throttle) + '/' + this.displayKey(b.brake) + ' SPEED · ' +
      this.displayKey(b.fire) + ' FIRE · ' +
      this.displayKey(b.missile) + ' MISSILE · ' +
      this.displayKey(b.oil) + ' OIL · ' +
      this.displayKey(b.smoke) + ' SMOKE · ' +
      this.displayKey(b.van) + ' RESUPPLY · ' +
      this.displayKey(b.gear) + ' SHIFT GEAR';
  }

  private get<T extends HTMLElement = HTMLElement>(id: string): T {
    const element = this.root.querySelector<T>(`#${id}`);
    if (!element) throw new Error(`Missing UI element: ${id}`);
    return element;
  }

  show(screen: Screen): void {
    this.menu.hidden = screen !== 'menu';
    this.paused.hidden = screen !== 'paused';
    this.gameover.hidden = screen !== 'gameover';
    this.hud.hidden = screen === 'menu';
    this.get('settings-panel').hidden = true;
    if (screen === 'menu' || screen === 'gameover') this.get('route-status').hidden = true;
    this.get('special-hud').hidden = screen === 'menu' || screen === 'gameover';
    if (screen === 'menu' || screen === 'gameover') this.get('combo-counter').hidden = true;
    if (screen === 'menu' || screen === 'gameover') this.get('tactic-status').hidden = true;
    if (screen === 'menu' || screen === 'gameover') this.get('penalty').hidden = true;
  }

  armory(ammo: WeaponCounts, van: string, penalty: number): void {
    this.get('ammo-missile').textContent = String(ammo.missile).padStart(2, '0');
    this.get('ammo-oil').textContent = String(ammo.oil).padStart(2, '0');
    this.get('ammo-smoke').textContent = String(ammo.smoke).padStart(2, '0');
    this.get('van-status').textContent = van;
    const warning = this.get('penalty');
    warning.hidden = penalty <= 0;
    this.get('penalty-time').textContent = String(Math.ceil(penalty));
  }

  threats(helicopters: number, enemyRounds: number): void {
    this.get('air-count').textContent = String(helicopters).padStart(2, '0');
    this.get('enemy-round-count').textContent = String(enemyRounds).padStart(2, '0');
  }

  tactics(pincer: boolean, retreat = false, rearPursuit = false,
    overtaking = false, screening = false): void {
    const label = this.get('tactic-status');
    label.hidden = !(pincer || retreat || rearPursuit);
    label.querySelector('b')!.textContent =
      pincer ? 'PINCER' : screening ? 'CUT-IN AHEAD'
        : overtaking ? 'REAR FLANK' : rearPursuit ? 'REAR PURSUIT' : 'RETREAT';
    label.querySelector('small')!.textContent =
      pincer ? 'OPEN CENTER CORRIDOR' :
        screening ? 'BRAKE OR CHANGE LANES' :
          overtaking ? 'SIDE LANE PASS — STAY CLEAR' :
            rearPursuit ? 'SHIFT HIGH OR CHANGE LANES'
              : 'SURVIVORS BREAKING OFF';
  }

  route(side: RouteSide | null, leftCompleted: number, rightCompleted: number): void {
    this.get('route-status').hidden = side === null;
    if (side) this.get('route-name').textContent = ROUTE_CHOICES[side].label;
    this.get('result-left-routes').textContent = String(leftCompleted);
    this.get('result-right-routes').textContent = String(rightCompleted);
  }

  dailyChallenge(day: string, best: number): void {
    this.get('daily-stamp').hidden = day.length === 0;
    this.get('daily-result').hidden = day.length === 0;
    if (day) {
      this.get('daily-date').textContent = day;
      this.get('daily-result-best').textContent = Math.floor(best).toString().padStart(6, '0');
    }
  }

  diagnostics(fps: number, drawCalls: number, vehicles: number): void {
    if (!this.preferences.showFps) return;
    this.get('fps-debug').textContent =
      'FPS ' + Math.round(fps) + ' / DRAWS ' + drawCalls + ' / VEH ' + vehicles;
  }

  environment(biome: Biome, boat: boolean): void {
    const labels: Record<Biome, string> = {
      forest: 'FOREST HIGHWAY', desert: 'DESERT PURSUIT',
      snow: 'ARCTIC RUN', city: 'NEON CITY', water: 'WATERWAY INTERCEPT',
    };
    this.get('environment-name').textContent = labels[biome] + (boat ? ' // SPEEDBOAT' : '');
  }

  combo(multiplier: number, seconds: number): void {
    this.get('combo-counter').hidden = multiplier <= 1 || seconds <= 0;
    this.get('combo-value').textContent = '×' + multiplier;
    this.get('combo-time').textContent = seconds.toFixed(1) + 's';
  }

  gearStatus(gear: DriveGear, boat: boolean): void {
    this.get('drive-gear').textContent = transmissionLabel(gear, boat);
  }

  stats(score: number, best: number, lives: number, speed: number): void {
    const format = (n: number) => Math.floor(n).toString().padStart(6, '0');
    this.get('score').textContent = format(score);
    this.get('best').textContent = format(best);
    this.get('lives').textContent = '●'.repeat(Math.max(0, lives)) || '—';
    this.get('speed').textContent = Math.floor(speed * 2.1).toString().padStart(3, '0');
  }

  result(
    score: number, best: number, hostiles = 0, civilians = 0, maxCombo = 1,
    distance = 0, survivalSeconds = 0, accuracy = 0,
  ): void {
    this.get('final-score').textContent = Math.floor(score).toString().padStart(6, '0');
    this.get('final-best').textContent = Math.floor(best).toString().padStart(6, '0');
    this.get('result-hostiles').textContent = String(hostiles);
    this.get('result-civilians').textContent = String(civilians);
    this.get('result-combo').textContent = '×' + maxCombo;
    this.get('result-distance').textContent = formatMissionDistance(distance);
    this.get('result-time').textContent = formatMissionTime(survivalSeconds);
    this.get('result-accuracy').textContent = accuracy + '%';
  }

  mute(muted: boolean): void { this.get('sound-indicator').textContent = muted ? 'AUDIO OFF' : 'AUDIO ON'; }
  message(text: string): void { this.get('toast').textContent = text; }
}
