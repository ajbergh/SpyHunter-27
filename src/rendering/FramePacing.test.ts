import { describe, expect, it } from 'vitest';
import { FramePacing } from './FramePacing';

describe('bounded render-frame timing telemetry', () => {
  it('reports exact 95th-percentile sample across an unfilled window', () => {
    const perf = new FramePacing();
    expect(perf.samples).toBe(0);
    expect(perf.p95Ms).toBe(0);
    perf.sample(1000);
    expect(perf.samples).toBe(0);
    perf.sample(1010);
    perf.sample(1030);
    perf.sample(1060);
    expect(perf.samples).toBe(3);
    expect(perf.p95Ms).toBe(30);
    perf.reset();
    expect(perf.samples).toBe(0);
    expect(perf.p95Ms).toBe(0);
  });

  it('keeps a fixed 120-frame ring and excludes background tab suspensions', () => {
    const perf = new FramePacing();
    perf.sample(1000);
    for (let i = 0; i < 160; i++)
      perf.sample(1000 + (i + 1) * 20);
    expect(perf.samples).toBe(120);
    expect(perf.p95Ms).toBeCloseTo(20, 2);
    perf.sample(10000);
    expect(perf.samples).toBe(120);
    expect(perf.p95Ms).toBeCloseTo(20, 2);
    perf.sample(10040);
    expect(perf.p95Ms).toBeCloseTo(20, 2);
    perf.sample(Number.NaN);
    perf.sample(-5);
    expect(perf.samples).toBe(120);
  });

  it('exposes long-tail frame times instead of hiding spikes in average FPS', () => {
    const perf = new FramePacing();
    perf.sample(1);
    let now = 1;
    for (let i = 0; i < 100; i++) {
      now += i % 10 === 0 ? 54 : 16;
      perf.sample(now);
    }
    expect(perf.samples).toBe(100);
    expect(perf.p95Ms).toBe(54);
    perf.reset();
    perf.sample(100);
    perf.sample(116);
    expect(perf.p95Ms).toBe(16);
  });
});
