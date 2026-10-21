import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { makeInterceptor, makeTrafficVehicle, makeSpeedboat } from './VehicleModels';

function stats(group: THREE.Group): { meshes: number; vertices: number; physicallyBased: number } {
  let meshes = 0, vertices = 0, physicallyBased = 0;
  group.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    meshes++;
    vertices += object.geometry.getAttribute('position').count;
    if (object.material instanceof THREE.MeshPhysicalMaterial) physicallyBased++;
  });
  return { meshes, vertices, physicallyBased };
}

describe('authored vehicle silhouette quality', () => {
  it('interceptor features an original sculpted body and clearcoat canopy', () => {
    const vehicle = makeInterceptor();
    const info = stats(vehicle);
    expect(info.meshes).toBeGreaterThan(30);
    expect(info.vertices).toBeGreaterThan(500);
    expect(info.physicallyBased).toBeGreaterThanOrEqual(2);
    const hood = vehicle.children.find(o => o instanceof THREE.Mesh &&
      o.material instanceof THREE.MeshPhysicalMaterial) as THREE.Mesh;
    expect((hood.material as THREE.MeshPhysicalMaterial).envMapIntensity).toBeLessThan(0.5);
    const ground = vehicle.getObjectByName('GroundContactOcclusion') as THREE.Mesh;
    expect(ground).toBeDefined();
    expect(ground.material).toBeInstanceOf(THREE.ShaderMaterial);
    expect((ground.material as THREE.ShaderMaterial).transparent).toBe(true);
    expect(vehicle.children.some(o => o instanceof THREE.Mesh &&
      o.geometry instanceof THREE.BufferGeometry &&
      o.geometry.index !== null &&
      o.geometry.getAttribute('position').count >= 32)).toBe(true);
  });
  it('hostile, armored and civilian cars retain distinct detailed hull dimensions', () => {
    const civilian = stats(makeTrafficVehicle(false, 0x447799, 0));
    const armored = stats(makeTrafficVehicle(true, 0x992244, 2));
    expect(armored.physicallyBased).toBeGreaterThanOrEqual(2);
    expect(civilian.physicallyBased).toBeGreaterThanOrEqual(2);
    expect(armored.meshes).toBeGreaterThan(15);
    expect(stats(makeSpeedboat(false)).meshes).toBeGreaterThan(3);
  });
});
