export interface Controls {
  steer: number;
  throttle: boolean;
  brake: boolean;
  fire: boolean;
  missilePressed: boolean;
  oilPressed: boolean;
  smokePressed: boolean;
  vanPressed: boolean;
  startPressed: boolean;
  pausePressed: boolean;
  mutePressed: boolean;
}

export class Input {
  private keys = new Set<string>();
  private previous: Record<string, boolean> = {};

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  read(): Controls {
    const key = (code: string): boolean => this.keys.has(code);
    const gamepad = navigator.getGamepads?.().find((pad) => pad && pad.mapping === 'standard');
    const axis = gamepad?.axes[0] ?? 0;
    const left = key('KeyA') || key('ArrowLeft');
    const right = key('KeyD') || key('ArrowRight');
    const keyboardSteer = Number(right) - Number(left);
    const stick = Math.abs(axis) > 0.15 ? axis : 0;
    const pressed = (index: number): boolean => Boolean(gamepad?.buttons[index]?.pressed);
    const edge = (name: string, active: boolean): boolean => {
      const fired = active && !this.previous[name];
      this.previous[name] = active;
      return fired;
    };
    return {
      steer: Math.max(-1, Math.min(1, keyboardSteer || stick)),
      throttle: key('KeyW') || key('ArrowUp') || pressed(7),
      brake: key('KeyS') || key('ArrowDown') || pressed(6),
      fire: key('Space') || pressed(0),
      missilePressed: edge('missile', key('KeyQ') || pressed(1)),
      oilPressed: edge('oil', key('KeyE') || pressed(2)),
      smokePressed: edge('smoke', key('KeyR') || pressed(3)),
      vanPressed: edge('van', key('KeyF') || pressed(4)),
      startPressed: edge('start', key('Enter')),
      pausePressed: edge('pause', key('KeyP') || key('Escape') || pressed(9)),
      mutePressed: edge('mute', key('KeyM')),
    };
  }
}
