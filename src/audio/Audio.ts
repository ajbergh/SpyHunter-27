/** Original synthesized arcade SFX; no external or licensed audio. */
export class AudioManager {
  private context: AudioContext | null = null;
  private muted = false;

  async unlock(): Promise<void> {
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') await this.context.resume();
    } catch { /* Continue silently when audio is disabled by browser policy. */ }
  }

  toggleMute(): boolean { this.muted = !this.muted; return this.muted; }

  fire(): void { this.tone(170, 0.045, 'sawtooth', 0.028, -90); }
  impact(): void { this.tone(130, 0.17, 'square', 0.12, -75); }
  explode(): void { this.tone(95, 0.3, 'sawtooth', 0.17, -80); }
  confirm(): void { this.tone(480, 0.12, 'sine', 0.07, 200); }

  private tone(freq: number, duration: number, type: OscillatorType, volume: number, slide: number): void {
    if (!this.context || this.muted || this.context.state !== 'running') return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, now);
    oscillator.frequency.linearRampToValueAtTime(Math.max(30, freq + slide), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);
  }
}
