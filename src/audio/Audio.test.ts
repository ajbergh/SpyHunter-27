import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioManager } from './Audio';

class AudioParamStub {
  value = 0;
  lastTarget = 0;
  setTargetAtTime(value: number): void { this.value = value; this.lastTarget = value; }
  setValueAtTime(value: number): void { this.value = value; }
  linearRampToValueAtTime(value: number): void { this.value = value; }
  exponentialRampToValueAtTime(value: number): void { this.value = value; }
}
class AudioNodeStub {
  connect<T>(node: T): T { return node; }
}
class OscillatorStub extends AudioNodeStub {
  type = 'sine';
  frequency = new AudioParamStub();
  start(): void {}
  stop(): void {}
}
class GainStub extends AudioNodeStub { gain = new AudioParamStub(); }
class FilterStub extends AudioNodeStub {
  type = 'lowpass';
  frequency = new AudioParamStub();
  Q = new AudioParamStub();
}
class FakeAudioContext {
  static current: FakeAudioContext | null = null;
  readonly state = 'running';
  readonly currentTime = 0;
  readonly destination = new AudioNodeStub();
  readonly oscillators: OscillatorStub[] = [];
  readonly gains: GainStub[] = [];
  readonly filters: FilterStub[] = [];
  constructor() { FakeAudioContext.current = this; }
  createOscillator(): OscillatorStub {
    const result = new OscillatorStub();
    this.oscillators.push(result);
    return result;
  }
  createGain(): GainStub {
    const result = new GainStub();
    this.gains.push(result);
    return result;
  }
  createBiquadFilter(): FilterStub {
    const result = new FilterStub();
    this.filters.push(result);
    return result;
  }
}
afterEach(() => {
  vi.unstubAllGlobals();
  FakeAudioContext.current = null;
});

describe('reused WebAudio road / engine signal chain', () => {
  it('allocates three continuous oscillators once, then modulates in place', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioManager();
    audio.configure(0, 0.8); // suppress intermittent musical note oscillators
    await audio.unlock();
    const context = FakeAudioContext.current!;
    expect(context.oscillators).toHaveLength(3);
    expect(context.filters).toHaveLength(2);
    expect(context.gains).toHaveLength(3);

    audio.step(1 / 60, 25, 0, false, 'forest',
      { gear: 'low', throttle: false, brake: false, steer: 0, acceleration: 0 });
    const idle = audio.toneProfile!;
    audio.step(1 / 60, 39, 0, false, 'desert',
      { gear: 'low', throttle: true, brake: false, steer: 1, acceleration: 10 });
    const loaded = audio.toneProfile!;
    expect(loaded.engineHz).toBeGreaterThan(idle.engineHz);
    expect(loaded.textureGain).toBeGreaterThan(idle.textureGain);
    expect(context.oscillators[0].frequency.lastTarget).toBe(loaded.engineHz);
    expect(context.oscillators[2].frequency.lastTarget).toBe(loaded.textureHz);
    expect(context.filters[0].frequency.lastTarget).toBe(loaded.filterHz);
    expect(context.filters[1].frequency.lastTarget).toBe(loaded.textureFilterHz);
    expect(context.gains[2].gain.lastTarget).toBeCloseTo(loaded.textureGain * 0.8);
    expect(context.oscillators).toHaveLength(3);
    await audio.unlock();
    expect(context.oscillators).toHaveLength(3);
  });

  it('silences every continuous layer on mute and zero effects volume', async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    const audio = new AudioManager();
    await audio.unlock();
    const context = FakeAudioContext.current!;
    const drive = { gear: 'high' as const, throttle: true,
      brake: false, steer: 0, acceleration: 4 };
    audio.step(1 / 60, 42, 0, false, 'city', drive);
    expect(context.gains.every(node => node.gain.lastTarget > 0)).toBe(true);
    expect(audio.toggleMute()).toBe(true);
    audio.step(1 / 60, 42, 0, false, 'city', drive);
    expect(context.gains.every(node => node.gain.lastTarget === 0)).toBe(true);
    expect(audio.toggleMute()).toBe(false);
    audio.configure(0, 0);
    audio.step(1 / 60, 42, 0, true, 'water', drive);
    expect(context.gains.every(node => node.gain.lastTarget === 0)).toBe(true);
    audio.silence();
    expect(context.gains.every(node => node.gain.lastTarget === 0)).toBe(true);
  });
});
