import * as THREE from 'three';
import type { Biome } from '../world/WorldPlan';

/**
 * Reusable seeded, non-photographic microtexture for procedural road surfaces.
 * UVs are in world-space units so recycled 30m tiles never reveal a seam.
 */
export function grainAt(x: number, y: number, seed: number): number {
  let n = Math.imul((x + 1) | 0, 374761393) ^
    Math.imul((y + 1) | 0, 668265263) ^
    Math.imul((seed + 1) | 0, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

export const PAVEMENT_STYLE = {
  forest: { base: 177, contrast: 54, wetness: 0.12, roughness: 0.91 },
  desert: { base: 185, contrast: 47, wetness: 0.08, roughness: 0.94 },
  snow: { base: 201, contrast: 41, wetness: 0.26, roughness: 0.84 },
  city: { base: 181, contrast: 58, wetness: 0.76, roughness: 0.33 },
  water: { base: 195, contrast: 32, wetness: 0.6, roughness: 0.28 },
} as const;

export function pavementPixel(x: number, y: number, biome: Biome): number {
  const style = PAVEMENT_STYLE[biome];
  const fine = grainAt(x, y, 19) - 0.5;
  const coarse = grainAt(Math.floor(x / 8), Math.floor(y / 8), 71) - 0.5;
  const groove = (x % 37 === 0 || (biome === 'city' && x % 23 === 0)) ? -12 : 0;
  return Math.max(18, Math.min(255, Math.round(
    style.base + fine * style.contrast + coarse * 20 + groove,
  )));
}

export function makePavementTexture(biome: Biome): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas2D required for procedural pavement texture');
  const image = context.createImageData(128, 128);
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const v = pavementPixel(x, y, biome);
      const n = (y * 128 + x) * 4;
      image.data[n] = v;
      image.data[n + 1] = v;
      image.data[n + 2] = v;
      image.data[n + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Materials/textures are shared by tiles; only geometries are recycled. */
export class PavementMaterials {
  readonly textures: Partial<Record<Biome, THREE.CanvasTexture>> = {};
  readonly road: Partial<Record<Biome, THREE.MeshStandardMaterial>> = {};

  get(biome: Biome, color: number): THREE.MeshStandardMaterial {
    let material = this.road[biome];
    if (!material) {
      const style = PAVEMENT_STYLE[biome];
      const texture = makePavementTexture(biome);
      this.textures[biome] = texture;
      material = new THREE.MeshStandardMaterial({
        color,
        map: texture,
        side: THREE.DoubleSide,
        roughness: style.roughness,
        metalness: style.wetness * 0.35,
      });
      this.road[biome] = material;
    }
    return material;
  }

  setQuality(high: boolean): void {
    for (const tex of Object.values(this.textures)) {
      tex.anisotropy = high ? 8 : 2;
      tex.needsUpdate = true;
    }
  }

  owns(material: THREE.Material): boolean {
    return Object.values(this.road).includes(material as THREE.MeshStandardMaterial);
  }
}
