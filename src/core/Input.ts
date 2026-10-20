import {
  DEFAULT_BINDINGS, DEFAULT_GAMEPAD_BINDINGS,
  type KeyBindings, type GamepadBindings,
} from '../gameplay/Settings';

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
  private bindings: KeyBindings = { ...DEFAULT_BINDINGS };
  private gamepadBindings: GamepadBindings = { ...DEFAULT_GAMEPAD_BINDINGS };

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  setBindings(bindings: KeyBindings): void {
    this.bindings = { ...bindings };
    this.previous = {};
    this.keys.clear();
  }

  setGamepadBindings(bindings: GamepadBindings): void {
    this.gamepadBindings = { ...bindings };
    this.previous = {};
  }

  read(): Controls {
    const key = (code: string): boolean => this.keys.has(code);
    const bound = (action: keyof KeyBindings): boolean => key(this.bindings[action]);
    const gamepad = navigator.getGamepads?.().find((pad) => pad && pad.mapping === 'standard');
    const axis = gamepad?.axes[0] ?? 0;
    const left = bound('left') || key('ArrowLeft');
    const right = bound('right') || key('ArrowRight');
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
      throttle: bound('throttle') || key('ArrowUp') || pressed(this.gamepadBindings.throttle),
      brake: bound('brake') || key('ArrowDown') || pressed(this.gamepadBindings.brake),
      fire: bound('fire') || pressed(this.gamepadBindings.fire),
      missilePressed: edge('missile', bound('missile') || pressed(this.gamepadBindings.missile)),
      oilPressed: edge('oil', bound('oil') || pressed(this.gamepadBindings.oil)),
      smokePressed: edge('smoke', bound('smoke') || pressed(this.gamepadBindings.smoke)),
      vanPressed: edge('van', bound('van') || pressed(this.gamepadBindings.van)),
      startPressed: edge('start', key('Enter')),
      pausePressed: edge('pause', bound('pause') || key('Escape') || pressed(this.gamepadBindings.pause)),
      mutePressed: edge('mute', key('KeyM')),
    };
  }
}
