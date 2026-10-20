import { describe, it, expect } from 'vitest';
import { FILM_GRADE, createFilmicPass, setFilmicReducedMotion } from './FilmicPass';

describe('cinematic post-processing safety', () => {
  it('keeps restrained optical grade values', () => {
    expect(FILM_GRADE.chromatic).toBeLessThan(0.003);
    expect(FILM_GRADE.vignette).toBeLessThan(0.35);
  });
  it('uses proper color pass uniforms and honors reduced-motion preferences', () => {
    const pass = createFilmicPass();
    expect(pass.uniforms.tDiffuse).toBeDefined();
    setFilmicReducedMotion(pass, true);
    expect(pass.uniforms.uGrain.value).toBe(0);
    expect(pass.uniforms.uChromatic.value).toBe(0);
    setFilmicReducedMotion(pass, false);
    expect(pass.uniforms.uGrain.value).toBeGreaterThan(0);
  });
});
