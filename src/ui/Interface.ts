import type { WeaponCounts } from '../combat/SpecialWeapons';

export type Screen = 'menu' | 'playing' | 'paused' | 'gameover';

export class Interface {
  readonly stage: HTMLDivElement;
  private readonly root: HTMLDivElement;
  private readonly menu: HTMLElement;
  private readonly paused: HTMLElement;
  private readonly gameover: HTMLElement;
  private readonly hud: HTMLElement;
  onStart: () => void = () => {};
  onResume: () => void = () => {};

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
          <div class="hud-block hud-right"><span class="micro">LIVES <span id="lives">●●●</span></span><strong><span id="speed">025</span><small> MPH</small></strong><span class="micro">DUAL CANNONS // <b class="ready">ARMED</b></span></div>
        </header>
        <div class="toast" id="toast" aria-live="polite"></div>
        <div class="special-hud" id="special-hud">
          <div class="special-line">[Q] MISSILE <b id="ammo-missile">03</b></div>
          <div class="special-line">[E] OIL <b id="ammo-oil">02</b></div>
          <div class="special-line">[R] SMOKE <b id="ammo-smoke">02</b></div>
          <div class="special-line van-line">VAN: <b id="van-status">READY [F]</b></div>
        </div>
        <div class="penalty" id="penalty" hidden>NO POINTS <span id="penalty-time">5</span>s</div>
        <section class="panel" id="menu">
          <div class="eyebrow">1983 REIMAGINED // 2027 RECHARGED</div>
          <div class="emblem">◈</div>
          <h1>SPY<br /><span>HUNTER</span><small>'27</small></h1>
          <p class="subhead">THE PURSUIT NEVER ENDS.</p>
          <div class="panel-rule"></div>
          <p class="intro">INTERCEPT HOSTILES. PROTECT CIVILIANS.<br />SURVIVE THE HIGHWAY.</p>
          <button id="start-button" class="primary-button">INITIATE PURSUIT <span>↗</span></button>
          <div class="keys">A / D <span>STEER</span> · W / S <span>SPEED</span> · SPACE <span>FIRE</span><div>Q <span>MISSILE</span> · E <span>OIL</span> · R <span>SMOKE</span> · F <span>RESUPPLY</span></div></div>
          <p class="build-tag">PHASE 1 // PLAYABLE PROTOTYPE</p>
        </section>
        <section class="panel compact" id="paused" hidden>
          <div class="eyebrow">MISSION INTERRUPTED</div><h2>PAUSED</h2>
          <p class="intro">PRESS P OR ESC TO RESUME</p>
          <button class="primary-button" id="resume-button">RESUME PURSUIT ↗</button>
        </section>
        <section class="panel compact" id="gameover" hidden>
          <div class="eyebrow">INTERCEPTOR LOST</div><h2>MISSION<br />TERMINATED</h2>
          <p class="intro">FINAL SCORE</p><div class="final-score" id="final-score">000000</div>
          <p class="intro">BEST <span id="final-best">000000</span></p>
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
    this.get('start-button').addEventListener('click', () => this.onStart());
    this.get('retry-button').addEventListener('click', () => this.onStart());
    this.get('resume-button').addEventListener('click', () => this.onResume());
    this.show('menu');
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
    this.get('special-hud').hidden = screen === 'menu' || screen === 'gameover';
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

  stats(score: number, best: number, lives: number, speed: number): void {
    const format = (n: number) => Math.floor(n).toString().padStart(6, '0');
    this.get('score').textContent = format(score);
    this.get('best').textContent = format(best);
    this.get('lives').textContent = '●'.repeat(Math.max(0, lives)) || '—';
    this.get('speed').textContent = Math.floor(speed * 2.1).toString().padStart(3, '0');
  }

  result(score: number, best: number): void {
    this.get('final-score').textContent = Math.floor(score).toString().padStart(6, '0');
    this.get('final-best').textContent = Math.floor(best).toString().padStart(6, '0');
  }

  mute(muted: boolean): void { this.get('sound-indicator').textContent = muted ? 'AUDIO OFF' : 'AUDIO ON'; }
  message(text: string): void { this.get('toast').textContent = text; }
}
