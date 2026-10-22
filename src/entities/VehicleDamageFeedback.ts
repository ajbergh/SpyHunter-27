import * as THREE from 'three';

interface Paint {
  readonly material: THREE.MeshPhysicalMaterial;
  readonly color: THREE.Color;
  readonly emissive: THREE.Color;
  readonly intensity: number;
}

/**
 * Per-vehicle paint feedback. Cache original material state only once.
 * Do not touch brake lamps, glass, tires or particle materials. No meshes,
 * textures, geometry or colors are allocated on simulation frames.
 */
export class VehicleDamageFeedback {
  private readonly paint: Paint[] = [];
  private readonly hot = new THREE.Color(0xff7043);
  private readonly damaged = new THREE.Color(0x65525b);
  private flash = 0;

  constructor(vehicle: THREE.Group) {
    const seen = new Set<THREE.MeshPhysicalMaterial>();
    vehicle.traverse(object => {
      if (!(object instanceof THREE.Mesh) ||
          !(object.material instanceof THREE.MeshPhysicalMaterial)) return;
      const material = object.material;
      if (seen.has(material) || material.metalness < 0.3 ||
          material.emissive.getHex() !== 0) return;
      seen.add(material);
      this.paint.push({
        material, color: material.color.clone(),
        emissive: material.emissive.clone(), intensity: material.emissiveIntensity,
      });
    });
  }

  get materialCount(): number { return this.paint.length; }
  get flashing(): boolean { return this.flash > 0; }

  hit(): void {
    this.flash = 0.38;
  }

  step(dt: number, hp: number, maxHp: number): void {
    if (Number.isFinite(dt) && dt > 0) this.flash = Math.max(0, this.flash - dt);
    const severity = maxHp > 0 ? Math.max(0, Math.min(1, (maxHp - hp) / maxHp)) : 0;
    const heat = Math.min(1, this.flash / 0.38);
    for (const entry of this.paint) {
      entry.material.color.copy(entry.color).lerp(this.damaged, severity * 0.33);
      entry.material.emissive.copy(entry.emissive).lerp(this.hot, heat * 0.75);
      entry.material.emissiveIntensity = entry.intensity + heat * 1.6;
    }
  }
}
