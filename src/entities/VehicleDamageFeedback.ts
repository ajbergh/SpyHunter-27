import * as THREE from 'three';

interface Paint {
  readonly material: THREE.MeshPhysicalMaterial;
  readonly color: THREE.Color;
  readonly emissive: THREE.Color;
  readonly intensity: number;
  readonly roughness: number;
  readonly clearcoat: number;
  readonly bumpScale: number;
}

interface Hull {
  readonly geometry: THREE.BufferGeometry;
  readonly position: THREE.BufferAttribute;
  readonly original: Float32Array;
  readonly frontZ: number;
  readonly length: number;
}

/**
 * Persistent damage for existing, uniquely sculpted traffic body panels.
 * Physical paint wear updates material uniforms, while damage stages dent the
 * existing indexed hull vertices only when health or struck side changes.
 * No new meshes, materials, geometry or hitboxes are created on impacts.
 * Glass, brake lamps, tyres and emissive warning lights are left alone.
 */
export class VehicleDamageFeedback {
  private readonly paint: Paint[] = [];
  private readonly hulls: Hull[] = [];
  private readonly seen = new Set<THREE.MeshPhysicalMaterial>();
  private readonly hot = new THREE.Color(0xff7043);
  private readonly damaged = new THREE.Color(0x514b50);
  private flash = 0;
  private impactSide = 0;
  // New, undamaged meshes already match their original vertex snapshot.
  private appliedStage = 0;
  private appliedSide = 0;

  constructor(vehicle: THREE.Group) {
    vehicle.traverse(object => {
      if (!(object instanceof THREE.Mesh) ||
          !(object.material instanceof THREE.MeshPhysicalMaterial)) return;
      const material = object.material;
      if (material.metalness < 0.3 || material.emissive.getHex() !== 0) return;
      if (!this.seen.has(material)) {
        this.seen.add(material);
        this.paint.push({
          material, color: material.color.clone(),
          emissive: material.emissive.clone(), intensity: material.emissiveIntensity,
          roughness: material.roughness, clearcoat: material.clearcoat,
          bumpScale: material.bumpScale,
        });
      }
      // Body lofts have their own indexed, UV-mapped geometry. Accent meshes,
      // motorcycle wheels and unpainted geometry never receive dents.
      const geometry = object.geometry;
      const pos = geometry.getAttribute('position');
      if (!material.map || !geometry.index || !(pos instanceof THREE.BufferAttribute) ||
          pos.count < 12) return;
      const original = new Float32Array(pos.count * 3);
      let frontZ = Number.POSITIVE_INFINITY, backZ = Number.NEGATIVE_INFINITY;
      for (let i = 0; i < pos.count; i++) {
        const j = i * 3;
        original[j] = pos.getX(i);
        original[j + 1] = pos.getY(i);
        original[j + 2] = pos.getZ(i);
        frontZ = Math.min(frontZ, original[j + 2]);
        backZ = Math.max(backZ, original[j + 2]);
      }
      this.hulls.push({ geometry, position: pos, original, frontZ,
        length: Math.max(0.01, backZ - frontZ) });
    });
  }

  get materialCount(): number { return this.paint.length; }
  get sculptedPanelCount(): number { return this.hulls.length; }
  get damageStage(): number { return Math.max(0, this.appliedStage); }
  get isDented(): boolean { return this.appliedStage > 0 && this.hulls.length > 0; }
  get flashing(): boolean { return this.flash > 0; }

  /** Signed lateral strike location: negative left, positive right. */
  hit(side = 0): void {
    this.flash = 0.38;
    this.impactSide = Number.isFinite(side) ? Math.sign(side) : 0;
  }

  /** Restore pristine geometry and material state on a new mission. */
  reset(): void {
    this.flash = 0;
    this.impactSide = 0;
    this.step(0, 1, 1);
  }

  private dentPanels(stage: number): void {
    for (const hull of this.hulls) {
      const { position, original, frontZ, length, geometry } = hull;
      for (let i = 0; i < position.count; i++) {
        const j = i * 3;
        const x = original[j], y = original[j + 1], z = original[j + 2];
        const front = Math.max(0, 1 - (z - frontZ) / (length * 0.55));
        const side = Math.sign(x);
        const weight = this.impactSide === 0 || side === this.impactSide ? 1 : 0.24;
        const crush = stage * 0.058 * front * weight;
        position.setXYZ(i,
          x - side * crush * 0.70,
          y - crush * (y >= 0.65 ? 1.35 : 0.12),
          z + crush * 0.85);
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
    }
    this.appliedStage = stage;
    this.appliedSide = this.impactSide;
  }

  step(dt: number, hp: number, maxHp: number): void {
    if (Number.isFinite(dt) && dt > 0) this.flash = Math.max(0, this.flash - dt);
    const ratio = maxHp > 0 && Number.isFinite(hp) && Number.isFinite(maxHp)
      ? (maxHp - hp) / maxHp : 0;
    const severity = Math.max(0, Math.min(1, ratio));
    const stage = Math.ceil(severity * 3);
    if (this.appliedStage !== stage || this.appliedSide !== this.impactSide)
      this.dentPanels(stage);
    const heat = Math.min(1, this.flash / 0.38);
    for (const entry of this.paint) {
      entry.material.color.copy(entry.color).lerp(this.damaged, severity * 0.43);
      entry.material.roughness = Math.min(1, entry.roughness + severity * 0.18);
      entry.material.clearcoat = Math.max(0, entry.clearcoat - severity * 0.32);
      entry.material.bumpScale = entry.bumpScale + severity * 0.015;
      entry.material.emissive.copy(entry.emissive).lerp(this.hot, heat * 0.75);
      entry.material.emissiveIntensity = entry.intensity + heat * 1.6;
    }
  }
}
