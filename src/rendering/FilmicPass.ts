import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

/** Deliberately restrained cinematic grade: subtle optical edge response,
 * vignette, exposure grain and mild warm highlight rolloff. */
export const FILM_GRADE = {
  chromatic: 0.0015,
  grain: 0.035,
  vignette: 0.22,
} as const;

export function createFilmicPass(): ShaderPass {
  return new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uChromatic: { value: FILM_GRADE.chromatic },
      uGrain: { value: FILM_GRADE.grain },
      uVignette: { value: FILM_GRADE.vignette },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uTime;
      uniform float uChromatic;
      uniform float uGrain;
      uniform float uVignette;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);
      }
      void main() {
        vec2 pos = vUv * 2.0 - 1.0;
        float radial = dot(pos, pos);
        vec2 delta = pos * (uChromatic * radial);
        vec3 color;
        color.r = texture2D(tDiffuse, clamp(vUv + delta, 0.002, 0.998)).r;
        color.g = texture2D(tDiffuse, vUv).g;
        color.b = texture2D(tDiffuse, clamp(vUv - delta, 0.002, 0.998)).b;
        float edge = smoothstep(0.12, 1.45, radial);
        color *= (1.0 - edge * uVignette);
        float noise = hash(floor(vUv * vec2(1200.0, 700.0)) + floor(uTime * 24.0));
        color += (noise - 0.5) * uGrain;
        color = max(color, 0.0);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}

export function setFilmicReducedMotion(pass: ShaderPass, reducedMotion: boolean): void {
  pass.uniforms.uGrain.value = reducedMotion ? 0 : FILM_GRADE.grain;
  pass.uniforms.uChromatic.value = reducedMotion ? 0 : FILM_GRADE.chromatic;
}
