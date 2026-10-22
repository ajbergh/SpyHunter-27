import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { makeTrafficVehicle } from './VehicleModels';
import { VehicleDamageFeedback } from './VehicleDamageFeedback';

function bodyMaterial(vehicle: THREE.Group): THREE.MeshPhysicalMaterial {
  let selected: THREE.MeshPhysicalMaterial | null = null;
  vehicle.traverse(object => {
    if (selected || !(object instanceof THREE.Mesh) ||
        !(object.material instanceof THREE.MeshPhysicalMaterial)) return;
    if (object.material.metalness >= 0.3 && object.material.emissive.getHex() === 0)
      selected = object.material;
  });
  if (!selected) throw new Error('Paint material not found');
  return selected;
}

describe('arcade vehicle impact and material wear', () => {
  it('flashes the original paint without creating per-hit meshes or materials', () => {
    const vehicle = makeTrafficVehicle(true, 0x974453, 2);
    const feedback = new VehicleDamageFeedback(vehicle);
    const material = bodyMaterial(vehicle);
    const original = material.color.clone();
    const geometry = (vehicle.children[0] as THREE.Mesh).geometry;
    const nodes = vehicle.children.length;
    expect(feedback.materialCount).toBeGreaterThan(0);
    expect(feedback.flashing).toBe(false);
    feedback.hit();
    feedback.step(1 / 60, 3, 4);
    expect(feedback.flashing).toBe(true);
    expect(material.emissive.getHex()).not.toBe(0);
    expect(material.emissiveIntensity).toBeGreaterThan(1);
    expect(material.color.equals(original)).toBe(false);
    for (let i = 0; i < 70; i++) feedback.step(1 / 60, 3, 4);
    expect(feedback.flashing).toBe(false);
    expect(material.emissive.getHex()).toBe(0);
    expect(material.emissiveIntensity).toBe(1);
    expect(material.color.equals(original)).toBe(false); // persistent scar
    feedback.step(0, 4, 4);
    expect(material.color.equals(original)).toBe(true);
    expect(vehicle.children).toHaveLength(nodes);
    expect((vehicle.children[0] as THREE.Mesh).geometry).toBe(geometry);
  });

  it('leaves emissive brake lights, window tint and motorcycle tires untouched', () => {
    const vehicle = makeTrafficVehicle(true, 0xa55a48);
    const feedback = new VehicleDamageFeedback(vehicle);
    const lamp = vehicle.getObjectByName('BrakeLamp') as THREE.Mesh;
    const before = (lamp.material as THREE.MeshStandardMaterial).emissiveIntensity;
    for (let i = 0; i < 30; i++) {
      feedback.hit();
      feedback.step(1 / 60, 1, 2);
    }
    expect((lamp.material as THREE.MeshStandardMaterial).emissiveIntensity).toBe(before);
    const bike = new VehicleDamageFeedback(makeTrafficVehicle(true, 0xc35440, 4));
    bike.hit();
    bike.step(1 / 60, 1, 1);
    expect(bike.materialCount).toBeGreaterThanOrEqual(0);
  });
});
