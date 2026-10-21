import * as THREE from 'three';

/**
 * Original automotive material atlas. Shared across every instance to avoid
 * duplicating vehicle textures as traffic streams. No external asset fetches.
 */
export type PaintStyle = 'interceptor' | 'traffic';

const WIDTH = 512;
const HEIGHT = 256;
const cache = new Map<PaintStyle, {
  albedo: THREE.DataTexture;
  roughness: THREE.DataTexture;
  height: THREE.DataTexture;
}>();

function hash(x: number, y: number, seed: number): number {
  let v = Math.imul(x + seed, 374761393) ^ Math.imul(y + seed * 17, 668265263);
  v = Math.imul(v ^ (v >>> 13), 1274126177);
  return ((v ^ (v >>> 16)) >>> 0) / 4294967295;
}

export interface SurfaceSample {
  readonly color: number;
  readonly roughness: number;
  readonly height: number;
}

/**
 * UV scheme: U spans the nose-to-tail length; V wraps from left lower flank
 * through the upper body to the right lower flank. Lines/stamps in material
 * space simulate stamped seams and weathering rather than painted boxes.
 */
export function vehicleSurfaceAt(u: number, v: number, style: PaintStyle): SurfaceSample {
  const x = Math.max(0, Math.min(WIDTH - 1, Math.floor(u * WIDTH)));
  const y = Math.max(0, Math.min(HEIGHT - 1, Math.floor(v * HEIGHT)));
  const n = hash(x, y, style === 'interceptor' ? 19 : 43);
  const fine = (n - 0.5) * (style === 'interceptor' ? 13 : 22);
  const seamPositions = style === 'interceptor'
    ? [0.13, 0.33, 0.54, 0.72, 0.91]
    : [0.16, 0.43, 0.69, 0.89];
  const nearest = Math.min(...seamPositions.map(t => Math.abs(u - t)));
  const panelSeam = nearest < 0.0022;
  const shoulder = Math.abs(v - 0.333) < 0.004 || Math.abs(v - 0.667) < 0.004;
  const roofStripe = style === 'interceptor' &&
    v > 0.44 && v < 0.56 && u > 0.22 && u < 0.92;
  const fineCarbon = roofStripe && ((x + Math.floor(y / 3)) % 11) < 2;
  const fastener = seamPositions.some(t => Math.abs(u - t) < 0.007) &&
    Math.abs(v - 0.23) < 0.007;
  const base = style === 'interceptor' ? 244 : 236;
  const tint = roofStripe ? (fineCarbon ? 70 : 95) :
    panelSeam ? 112 : shoulder ? 173 : fastener ? 72 : base + fine;
  const roughness = Math.round(
    roofStripe ? 153 : panelSeam ? 190 : (style === 'interceptor' ? 120 : 154) + (n - 0.5) * 39,
  );
  const height = Math.round(panelSeam ? 60 : fastener ? 240 : 134 + fine * 0.35);
  return {
    color: Math.max(0, Math.min(255, Math.round(tint))),
    roughness: Math.max(0, Math.min(255, roughness)),
    height: Math.max(0, Math.min(255, height)),
  };
}

function texture(bytes: Uint8Array, isColor: boolean): THREE.DataTexture {
  const map = new THREE.DataTexture(bytes, WIDTH, HEIGHT, THREE.RGBAFormat);
  map.wrapS = THREE.ClampToEdgeWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.magFilter = THREE.LinearFilter;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.generateMipmaps = true;
  map.anisotropy = 4;
  if (isColor) map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;
  return map;
}

export function vehiclePaintTextures(style: PaintStyle): {
  albedo: THREE.DataTexture;
  roughness: THREE.DataTexture;
  height: THREE.DataTexture;
} {
  const existing = cache.get(style);
  if (existing) return existing;

  const color = new Uint8Array(WIDTH * HEIGHT * 4);
  const roughness = new Uint8Array(color.length);
  const height = new Uint8Array(color.length);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const sample = vehicleSurfaceAt((x + 0.5) / WIDTH, (y + 0.5) / HEIGHT, style);
      const i = (y * WIDTH + x) * 4;
      for (let c = 0; c < 3; c++) {
        color[i + c] = sample.color;
        roughness[i + c] = sample.roughness;
        height[i + c] = sample.height;
      }
      color[i + 3] = roughness[i + 3] = height[i + 3] = 255;
    }
  }
  const maps = {
    albedo: texture(color, true),
    roughness: texture(roughness, false),
    height: texture(height, false),
  };
  cache.set(style, maps);
  return maps;
}

export function autoPaintDetailBudget(): { uniqueAtlases: number; bytesPerAtlas: number } {
  return { uniqueAtlases: 2, bytesPerAtlas: WIDTH * HEIGHT * 4 * 3 };
}
