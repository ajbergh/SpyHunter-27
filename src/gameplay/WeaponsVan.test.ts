import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { WeaponsVan } from './WeaponsVan';

describe('weapons van', () => {
  it('docks only when the player is physically aligned with the rear ramp', () => {
    const van = new WeaponsVan(new THREE.Scene());
    expect(van.call()).toBe(true);
    expect(van.call()).toBe(false);
    let docked = false;
    for (let i = 0; i < 450; i++) {
      if (van.step(1 / 60, 35, 6.4) === 'docked') { docked = true; break; }
    }
    expect(docked).toBe(true);
    expect(van.isDocking).toBe(true);
  });
  it('reports missed docking when driver fails to align', () => {
    const van = new WeaponsVan(new THREE.Scene());
    van.call();
    let missed = false;
    for (let i = 0; i < 450; i++) {
      if (van.step(1 / 60, 35, -6.4) === 'missed') { missed = true; break; }
    }
    expect(missed).toBe(true);
    expect(van.isDocking).toBe(false);
  });
  it('gives lane guidance exactly once during a misaligned pass', () => {
    const van = new WeaponsVan(new THREE.Scene());
    van.call();
    let hints = 0;
    let missed = false;
    for (let i=0;i<450;i++) {
      const event = van.step(1/60, 35, 1);
      if (event === 'align-lane') hints++;
      if (event === 'missed') { missed = true; break; }
    }
    expect(hints).toBe(1);
    expect(missed).toBe(true);
  });
  it('gives speed guidance once to drivers aligned with the ramp but too slow', () => {
    const van = new WeaponsVan(new THREE.Scene());
    van.call();
    let speedHints=0;
    for(let i=0;i<700;i++){
      const event=van.step(1/60,10,6.4);
      if(event==='adjust-speed')speedHints++;
      if(event==='missed')break;
    }
    expect(speedHints).toBe(1);
  });
  it('never reports a near miss on a successfully aligned approach', () => {
    const van = new WeaponsVan(new THREE.Scene());
    van.call();
    const events: string[] = [];
    for(let i=0;i<500;i++){
      const event=van.step(1/60,35,6.4);
      if(event)events.push(event);
      if(event==='docked')break;
    }
    expect(events).toEqual(['docked']);
  });

});
