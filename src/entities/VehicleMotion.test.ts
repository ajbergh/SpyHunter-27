import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { makeInterceptor, makeMotorcycle, makeSpeedboat, makeTrafficVehicle } from './VehicleModels';
import { VehicleMotionRig } from './VehicleMotion';

function wheelPivots(group: THREE.Group): THREE.Group[] {
  const result: THREE.Group[] = [];
  group.traverse(node => {
    if (node instanceof THREE.Group && node.name.endsWith('WheelPivot')) result.push(node);
  });
  return result;
}

describe('arcade vehicle visual drivetrain', () => {
  it('keeps an original set of rotating/steering wheel hubs in each sculpted car', () => {
    const car = makeInterceptor();
    const rig = new VehicleMotionRig(car);
    expect(rig.wheelCount).toBe(4);
    expect(rig.brakeLampCount).toBe(2);
    const pivots = wheelPivots(car);
    expect(pivots).toHaveLength(4);
    expect(pivots.every(p => p.children.length === 3)).toBe(true);
    const original = pivots.map(p => p.children[0].geometry);
    rig.step(1 / 60, 36, 1, true);
    expect(pivots.every(p => p.rotation.x < 0)).toBe(true);
    expect(pivots.filter(p => p.name === 'FrontWheelPivot').every(p => p.rotation.y > 0)).toBe(true);
    expect(pivots.filter(p => p.name === 'RearWheelPivot').every(p => p.rotation.y === 0)).toBe(true);
    expect(pivots.map(p => p.children[0].geometry)).toEqual(original);
    const lamps = car.getObjectsByProperty('name', 'BrakeLamp') as THREE.Mesh[];
    expect(lamps).toHaveLength(2);
    expect(lamps.every(l => (l.material as THREE.MeshStandardMaterial).emissiveIntensity > 0.98)).toBe(true);
    rig.reset();
    expect(pivots.every(p => p.rotation.x === 0 && p.rotation.y === 0)).toBe(true);
    expect(lamps.every(l => (l.material as THREE.MeshStandardMaterial).emissiveIntensity === 0.98)).toBe(true);
  });

  it('is simulation-time deterministic, clamps invalid values and resets braking glow', () => {
    const car = makeTrafficVehicle(false, 0x567d90);
    const rig = new VehicleMotionRig(car);
    const pivot = wheelPivots(car)[0];
    const originalPosition = pivot.position.clone();
    rig.step(1 / 60, 25, 0.5, true);
    const angle = pivot.rotation.x;
    const angleSteer = pivot.rotation.y;
    rig.reset();
    rig.step(1 / 60, 25, 0.5, true);
    expect(pivot.rotation.x).toBe(angle);
    expect(pivot.rotation.y).toBe(angleSteer);
    rig.step(Number.NaN, 70, 0.5, true);
    expect(pivot.rotation.x).toBe(angle);
    rig.step(1 / 60, Number.NaN, Number.POSITIVE_INFINITY, false);
    expect(Number.isFinite(pivot.rotation.x)).toBe(true);
    expect(Number.isFinite(pivot.rotation.y)).toBe(true);
    expect(pivot.position.equals(originalPosition)).toBe(true);
    const lamp = car.getObjectByName('BrakeLamp') as THREE.Mesh;
    for (let n = 0; n < 40; n++) rig.step(1 / 60, 22, 0, false);
    expect((lamp.material as THREE.MeshStandardMaterial).emissiveIntensity).toBeCloseTo(0.98, 4);
  });

  it('provides animations for civilian, armored, motorcycle and switchblade vehicles but not boats', () => {
    for (const variant of [0, 2, 4, 6]) {
      const rig = new VehicleMotionRig(makeTrafficVehicle(true, 0x557799, variant));
      expect(rig.wheelCount).toBe(variant === 4 ? 2 : 4);
      expect(rig.brakeLampCount).toBe(variant === 4 ? 1 : 2);
    }
    const bike = makeMotorcycle(false, 0x335577);
    expect(new VehicleMotionRig(bike).wheelCount).toBe(2);
    const boat = new VehicleMotionRig(makeSpeedboat(false));
    expect(boat.wheelCount).toBe(0);
    expect(boat.brakeLampCount).toBe(0);
    boat.step(1 / 60, 37, 1, true);
  });
});
