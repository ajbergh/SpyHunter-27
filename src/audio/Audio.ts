import { SOUNDSCAPES, musicPace } from './Soundscape';
import type { Biome } from '../world/WorldPlan';
import type { ThreatDirection } from '../gameplay/CombatReadability';
import { engineToneProfile, type DriveSoundControls, type EngineToneProfile } from './EngineResponse';
import type { DriveGear } from '../gameplay/Transmission';

/** Original synthesized espionage score, reactive engine drone and arcade SFX. */
export class AudioManager {
  private context: AudioContext | null = null;
  private engine: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private overtone: OscillatorNode | null = null;
  private overtoneGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private roadOscillator: OscillatorNode | null = null;
  private roadGain: GainNode | null = null;
  private roadFilter: BiquadFilterNode | null = null;
  private lastTone: EngineToneProfile | null = null;
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
        this.engineFilter = this.context.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.value = 300;
        this.engineGain.gain.value = 0;
        this.engine.connect(this.engineFilter)
          .connect(this.engineGain).connect(this.context.destination);
        this.engine.start();
        this.overtone = this.context.createOscillator();
        this.overtone.type = 'triangle';
        this.overtoneGain = this.context.createGain();
        this.overtoneGain.gain.value = 0;
        this.overtone.connect(this.overtoneGain).connect(this.context.destination);
        this.overtone.start();
        // One persistent oscillator and a reusable bandpass form the surface
        // layer: no per-frame oscillators, textures or external audio assets.
        this.roadOscillator = this.context.createOscillator();
        this.roadOscillator.type = 'sawtooth';
        this.roadGain = this.context.createGain();
        this.roadGain.gain.value = 0;
        this.roadFilter = this.context.createBiquadFilter();
        this.roadFilter.type = 'bandpass';
        this.roadFilter.Q.value = 0.62;
        this.roadOscillator.connect(this.roadFilter)
          .connect(this.roadGain).connect(this.context.destination);
        this.roadOscillator.start();
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

  /** Pure fixed-step telemetry is available in development without requiring an audio device. */
  get toneProfile(): EngineToneProfile | null { return this.lastTone; }

  shift(gear: DriveGear): void {
    if (gear === 'high') this.tone(640, 0.13, 'triangle', 0.07, -210);
    else this.tone(340, 0.13, 'triangle', 0.065, 130);
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
  step(dt: number, speed: number, danger: number, inBoat = false, biome: Biome = 'forest',
    drive: DriveSoundControls = {
      gear: 'low', throttle: false, brake: false, steer: 0, acceleration: 0,
    }): void {
    this.lastTone = engineToneProfile(biome, speed, drive, inBoat);
    if (!this.context || this.context.state !== 'running') return;
    const currentBiome = inBoat ? 'water' : biome;
    if (currentBiome !== this.previousBiome) {
      this.previousBiome = currentBiome;
      this.beat = 0;
      this.beatClock = 0;
    }
    const sound = SOUNDSCAPES[currentBiome];
    const now = this.context.currentTime;
    const profile = this.lastTone;
    if (this.engine && this.engineGain && this.engineFilter) {
      this.engine.frequency.setTargetAtTime(profile.engineHz, now, 0.075);
      this.engineFilter.frequency.setTargetAtTime(profile.filterHz, now, 0.075);
      this.engineGain.gain.setTargetAtTime(
        this.muted ? 0 : profile.engineGain * this.effectsLevel, now, 0.065);
    }
    if (this.overtone && this.overtoneGain) {
      this.overtone.frequency.setTargetAtTime(profile.overtoneHz, now, 0.10);
      this.overtoneGain.gain.setTargetAtTime(
        this.muted ? 0 : profile.overtoneGain * this.effectsLevel, now, 0.085);
    }
    if (this.roadOscillator && this.roadFilter && this.roadGain) {
      this.roadOscillator.frequency.setTargetAtTime(profile.textureHz, now, 0.10);
      this.roadFilter.frequency.setTargetAtTime(profile.textureFilterHz, now, 0.13);
      this.roadGain.gain.setTargetAtTime(
        this.muted ? 0 : profile.textureGain * this.effectsLevel, now, 0.12);
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
      this.roadGain?.gain.setTargetAtTime(0, this.context.currentTime, 0.025);
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
