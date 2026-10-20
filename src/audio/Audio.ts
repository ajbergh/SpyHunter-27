/** Original synthesized espionage score, reactive engine drone and arcade SFX. */
export class AudioManager {
  private context: AudioContext | null = null;
  private engine: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private muted = false;
  private effectsLevel = 0.7;
  private musicLevel = 0.45;
  private beatClock = 0;
  private beat = 0;

  async unlock(): Promise<void> {
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') await this.context.resume();
      if (!this.engine && this.context.state === 'running') {
        this.engine = this.context.createOscillator();
        this.engine.type = 'sawtooth';
        this.engineGain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        this.engineGain.gain.value = 0;
        this.engine.connect(filter).connect(this.engineGain).connect(this.context.destination);
        this.engine.start();
      }
    } catch { /* Audio is optional when blocked by browser policy. */ }
  }

  configure(music: number, effects: number): void {
    this.musicLevel = Math.max(0, Math.min(1, music));
    this.effectsLevel = Math.max(0, Math.min(1, effects));
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) this.silence();
    return this.muted;
  }

  fire(): void { this.tone(170, 0.045, 'sawtooth', 0.038, -90); }
  impact(): void { this.tone(135, 0.17, 'square', 0.18, -75); }
  explode(): void {
    this.tone(95, 0.3, 'sawtooth', 0.21, -80);
    this.tone(46, 0.42, 'triangle', 0.15, -15);
  }
  confirm(): void { this.tone(480, 0.12, 'sine', 0.1, 200); }

  /** Called once per fixed simulation step; does not use background timers. */
  step(dt: number, speed: number, danger: number, inBoat = false): void {
    if (!this.context || this.context.state !== 'running') return;
    const now = this.context.currentTime;
    if (this.engine && this.engineGain) {
      this.engine.frequency.setTargetAtTime((inBoat ? 58 : 48) + speed * (inBoat ? 2.8 : 3.5), now, 0.07);
      this.engineGain.gain.setTargetAtTime(this.muted ? 0 : 0.014 * this.effectsLevel, now, 0.08);
    }
    this.beatClock -= dt;
    if (this.beatClock <= 0) {
      // Newly composed angular espionage ostinato, intentionally not the
      // licensed theme associated with the historical arcade original.
      const melody = [174.61, 0, 233.08, 220, 0, 196.0, 261.63, 0,
        146.83, 174.61, 0, 293.66, 220, 0, 164.81, 196.0];
      const note = melody[this.beat++ % melody.length];
      const pace = danger > 4 ? 0.205 : 0.29;
      this.beatClock = pace;
      if (note !== 0 && this.musicLevel > 0) {
        this.tone(note, pace * 0.82, 'triangle', 0.09, -3, true);
        if (this.beat % 4 === 1) this.tone(note / 2, pace * 1.5, 'sine', 0.06, -4, true);
      }
    }
  }

  silence(): void {
    if (this.context && this.engineGain) {
      this.engineGain.gain.setTargetAtTime(0, this.context.currentTime, 0.025);
    }
    this.beatClock = 0;
  }

  private tone(freq: number, duration: number, type: OscillatorType, volume: number, slide: number, music = false): void {
    const context = this.context;
    if (!context || this.muted || context.state !== 'running') return;
    const level = music ? this.musicLevel : this.effectsLevel;
    if (level <= 0) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, now);
    oscillator.frequency.linearRampToValueAtTime(Math.max(30, freq + slide), now + duration);
    gain.gain.setValueAtTime(Math.max(0.0001, volume * level), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);
  }
}
