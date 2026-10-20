export interface Controls {
  steer: number;
  throttle: boolean;
  brake: boolean;
  fire: boolean;
  startPressed: boolean;
  pausePressed: boolean;
  mutePressed: boolean;
}

export class Input {
  private keys = new Set<string>();
  private previous = { start: false, pause: false, mute: false };

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
    const throttle = key('KeyW') || key('ArrowUp') || pressed(7);
    const brake = key('KeyS') || key('ArrowDown') || pressed(6);
    const fire = key('Space') || pressed(0);
    const start = key('Enter');
    const pause = key('KeyP') || key('Escape') || pressed(9);
    const mute = key('KeyM');
    const snapshot: Controls = {
      steer: Math.max(-1, Math.min(1, keyboardSteer || stick)), throttle, brake, fire,
      startPressed: start && !this.previous.start,
      pausePressed: pause && !this.previous.pause,
      mutePressed: mute && !this.previous.mute,
    };
    this.previous = { start, pause, mute };
    return snapshot;
  }
}
