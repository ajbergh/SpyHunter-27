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

  it('adds directional three-stage structural dents only on actual health changes', () => {
    const vehicle = makeTrafficVehicle(true, 0xa1544f, 2);
    const feedback = new VehicleDamageFeedback(vehicle);
    const body = vehicle.children[0] as THREE.Mesh;
    const glass = vehicle.children[1] as THREE.Mesh;
    const geometry = body.geometry;
    const position = geometry.getAttribute('position') as THREE.BufferAttribute;
    const windowPosition = glass.geometry.getAttribute('position') as THREE.BufferAttribute;
    const originalWindowVersion = windowPosition.version;
    const nodes = vehicle.children.length;
    const leftTop = position.getY(1);
    const rightTop = position.getY(2);
    const originalRightX = position.getX(2);
    const originalRightZ = position.getZ(2);
    const material = body.material as THREE.MeshPhysicalMaterial;
    const roughness = material.roughness;
    const clearcoat = material.clearcoat;
    const bumpScale = material.bumpScale;
    const initialVersion = position.version;
    expect(feedback.sculptedPanelCount).toBe(1);
    expect(feedback.damageStage).toBe(0);
    expect(feedback.isDented).toBe(false);
    feedback.step(1 / 60, 4, 4);
    expect(position.version).toBe(initialVersion);

    feedback.hit(1);
    feedback.step(1 / 60, 3, 4);
    expect(feedback.damageStage).toBe(1);
    expect(feedback.isDented).toBe(true);
    expect(position.getY(2)).toBeLessThan(rightTop);
    expect(position.getX(2)).toBeLessThan(originalRightX);
    expect(position.getZ(2)).toBeGreaterThan(originalRightZ);
    // The struck right side dents more than the far-side body panel.
    expect(rightTop - position.getY(2)).toBeGreaterThan(
      leftTop - position.getY(1));
    expect(position.version).toBeGreaterThan(initialVersion);
    expect(windowPosition.version).toBe(originalWindowVersion);
    expect(material.roughness).toBeGreaterThan(roughness);
    expect(material.clearcoat).toBeLessThan(clearcoat);
    expect(material.bumpScale).toBeGreaterThan(bumpScale);
    const lastVersion = position.version;

    for (let i = 0; i < 180; i++) feedback.step(1 / 60, 3, 4);
    expect(position.version).toBe(lastVersion);
    expect(feedback.flashing).toBe(false);
    feedback.hit(-1);
    feedback.step(0, 2, 4);
    expect(feedback.damageStage).toBe(2);
    expect(leftTop - position.getY(1)).toBeGreaterThan(
      rightTop - position.getY(2));
    feedback.hit(-1);
    feedback.step(0, 1, 4);
    expect(feedback.damageStage).toBe(3);
    expect(material.roughness).toBeGreaterThan(roughness);
    expect(vehicle.children).toHaveLength(nodes);
    expect(body.geometry).toBe(geometry);

    feedback.step(0, 4, 4);
    expect(feedback.damageStage).toBe(0);
    expect(feedback.isDented).toBe(false);
    expect(position.getX(2)).toBe(originalRightX);
    expect(position.getY(2)).toBe(rightTop);
    expect(position.getZ(2)).toBe(originalRightZ);
    expect(material.roughness).toBe(roughness);
    expect(material.clearcoat).toBe(clearcoat);
    expect(material.bumpScale).toBe(bumpScale);
  });

  it('handles vehicles without sculpted physical paint and invalid health safely', () => {
    const motorcycle = makeTrafficVehicle(true, 0xb43b50, 4);
    const feedback = new VehicleDamageFeedback(motorcycle);
    const children = motorcycle.children.length;
    expect(feedback.sculptedPanelCount).toBe(0);
    feedback.hit(Number.NaN);
    feedback.step(Number.NaN, Number.NaN, 4);
    expect(feedback.damageStage).toBe(0);
    feedback.hit(1);
    feedback.step(1 / 60, 1, 2);
    expect(feedback.damageStage).toBe(2);
    expect(feedback.isDented).toBe(false);
    expect(motorcycle.children).toHaveLength(children);
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
