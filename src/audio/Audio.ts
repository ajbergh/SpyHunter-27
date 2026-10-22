import { SOUNDSCAPES, musicPace } from './Soundscape';
import type { Biome } from '../world/WorldPlan';
import type { ThreatDirection } from '../gameplay/CombatReadability';

/** Original synthesized espionage score, reactive engine drone and arcade SFX. */
export class AudioManager {
  private context: AudioContext | null = null;
  private engine: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private overtone: OscillatorNode | null = null;
  private overtoneGain: GainNode | null = null;
  private previousBiome: Biome = 'forest';
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
        this.overtone = this.context.createOscillator();
        this.overtone.type = 'triangle';
        this.overtoneGain = this.context.createGain();
        this.overtoneGain.gain.value = 0;
        this.overtone.connect(this.overtoneGain).connect(this.context.destination);
        this.overtone.start();
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
  warning(): void {
    this.tone(540, 0.14, 'square', 0.095, -145);
    this.tone(880, 0.09, 'sine', 0.06, -180);
  }
  /** Distinct pitched signatures for front, rear and two-direction contacts.
   *  The game decides when to sound a cue, so this never runs every frame.
   */
  contact(direction: ThreatDirection): void {
    if (direction === 'none') return;
    if (direction === 'front' || direction === 'both') {
      this.tone(700, 0.12, 'square', 0.07, -210);
      this.tone(880, 0.075, 'sine', 0.043, -100);
    }
    if (direction === 'rear' || direction === 'both') {
      this.tone(270, 0.16, 'triangle', 0.09, 135);
      this.tone(420, 0.12, 'square', 0.045, 120);
    }
  }
  resupply(): void {
    this.tone(392, 0.17, 'triangle', 0.11, 130);
    this.tone(659, 0.28, 'sine', 0.085, 110);
  }

  /** Fixed-step original five-environment adaptive music and engine layers. */
  step(dt: number, speed: number, danger: number, inBoat = false, biome: Biome = 'forest'): void {
    if (!this.context || this.context.state !== 'running') return;
    const currentBiome = inBoat ? 'water' : biome;
    if (currentBiome !== this.previousBiome) {
      this.previousBiome = currentBiome;
      this.beat = 0;
      this.beatClock = 0;
    }
    const sound = SOUNDSCAPES[currentBiome];
    const now = this.context.currentTime;
    if (this.engine && this.engineGain) {
      this.engine.frequency.setTargetAtTime(sound.engineBase + speed * sound.engineRate, now, 0.07);
      this.engineGain.gain.setTargetAtTime(this.muted ? 0 : 0.014 * this.effectsLevel, now, 0.08);
    }
    if (this.overtone && this.overtoneGain) {
      this.overtone.frequency.setTargetAtTime(sound.undercurrent + speed * 0.82, now, 0.1);
      this.overtoneGain.gain.setTargetAtTime(this.muted ? 0 : 0.006 * this.effectsLevel, now, 0.08);
    }
    this.beatClock -= dt;
    if (this.beatClock <= 0) {
      const pace = musicPace(currentBiome, danger);
      const position = this.beat++ % sound.score.length;
      const note = sound.score[position];
      this.beatClock = pace;
      if (note > 0 && this.musicLevel > 0) {
        this.tone(note, pace * 0.82, 'triangle', 0.09, -3, true);
        if (position % 4 === 0) this.tone(note / 2, pace * 1.3, 'sine', 0.06, -4, true);
        if (danger >= 5 && position % 4 === 2) {
          this.tone(note * 1.5, pace * 0.48, 'sawtooth', 0.035, -9, true);
        }
      }
      if (position % sound.percussionRate === 0 && this.musicLevel > 0) {
        this.tone(currentBiome === 'city' ? 66 : 52, 0.095, 'triangle', 0.08, -25, true);
      }
    }
  }

  silence(): void {
    if (this.context && this.engineGain) {
      this.engineGain.gain.setTargetAtTime(0, this.context.currentTime, 0.025);
      this.overtoneGain?.gain.setTargetAtTime(0, this.context.currentTime, 0.025);
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
