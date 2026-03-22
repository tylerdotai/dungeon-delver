export interface Vector2 {
  x: number;
  y: number;
}

export interface InputState {
  keys: Set<string>;
  mousePosition: Vector2;
  mouseDown: boolean;
  mouseClicked: boolean;
  mobileDirection: Vector2;
}

export type InputCallback = (state: InputState) => void;

export class InputManager {
  private state: InputState = {
    keys: new Set(),
    mousePosition: { x: 0, y: 0 },
    mouseDown: false,
    mouseClicked: false,
    mobileDirection: { x: 0, y: 0 },
  };
  
  private callbacks: Set<InputCallback> = new Set();
  private canvas: HTMLCanvasElement;
  private boundHandlers: {
    keydown: (e: KeyboardEvent) => void;
    keyup: (e: KeyboardEvent) => void;
    mousedown: (e: MouseEvent) => void;
    mouseup: (e: MouseEvent) => void;
    mousemove: (e: MouseEvent) => void;
    contextmenu: (e: MouseEvent) => void;
  };

  private readonly keyMap: Map<string, string[]> = new Map([
    ['up', ['KeyW', 'ArrowUp']],
    ['down', ['KeyS', 'ArrowDown']],
    ['left', ['KeyA', 'ArrowLeft']],
    ['right', ['KeyD', 'ArrowRight']],
  ]);

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.boundHandlers = {
      keydown: this.handleKeyDown.bind(this),
      keyup: this.handleKeyUp.bind(this),
      mousedown: this.handleMouseDown.bind(this),
      mouseup: this.handleMouseUp.bind(this),
      mousemove: this.handleMouseMove.bind(this),
      contextmenu: (e: MouseEvent) => e.preventDefault(),
    };
  }

  attach(): void {
    window.addEventListener('keydown', this.boundHandlers.keydown);
    window.addEventListener('keyup', this.boundHandlers.keyup);
    this.canvas.addEventListener('mousedown', this.boundHandlers.mousedown);
    this.canvas.addEventListener('mouseup', this.boundHandlers.mouseup);
    this.canvas.addEventListener('mousemove', this.boundHandlers.mousemove);
    this.canvas.addEventListener('contextmenu', this.boundHandlers.contextmenu);
  }

  detach(): void {
    window.removeEventListener('keydown', this.boundHandlers.keydown);
    window.removeEventListener('keyup', this.boundHandlers.keyup);
    this.canvas.removeEventListener('mousedown', this.boundHandlers.mousedown);
    this.canvas.removeEventListener('mouseup', this.boundHandlers.mouseup);
    this.canvas.removeEventListener('mousemove', this.boundHandlers.mousemove);
    this.canvas.removeEventListener('contextmenu', this.boundHandlers.contextmenu);
  }

  getState(): InputState {
    return { 
      ...this.state, 
      keys: new Set(Array.from(this.state.keys)) 
    };
  }

  isKeyPressed(direction: 'up' | 'down' | 'left' | 'right'): boolean {
    const keys = this.keyMap.get(direction) ?? [];
    return keys.some(key => this.state.keys.has(key));
  }

  getMovementVector(): Vector2 {
    const keyboardX = (this.isKeyPressed('right') ? 1 : 0) - (this.isKeyPressed('left') ? 1 : 0);
    const keyboardY = (this.isKeyPressed('down') ? 1 : 0) - (this.isKeyPressed('up') ? 1 : 0);
    return {
      x: keyboardX + this.state.mobileDirection.x,
      y: keyboardY + this.state.mobileDirection.y,
    };
  }

  setMobileDirection(dir: Vector2): void {
    this.state.mobileDirection = dir;
  }

  onInput(callback: InputCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  update(): void {
    this.state.mouseClicked = false;
    for (const callback of this.callbacks) {
      callback(this.getState());
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
      this.state.keys.add(e.code);
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.state.keys.delete(e.code);
  }

  private handleMouseDown(e: MouseEvent): void {
    this.state.mouseDown = true;
    this.state.mouseClicked = true;
    this.updateMousePosition(e);
  }

  private handleMouseUp(): void {
    this.state.mouseDown = false;
  }

  private handleMouseMove(e: MouseEvent): void {
    this.updateMousePosition(e);
  }

  private updateMousePosition(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.state.mousePosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }
}

export const createInputManager = (canvas: HTMLCanvasElement): InputManager => {
  return new InputManager(canvas);
};

let globalInputManager: InputManager | null = null;

export const setGlobalInputManager = (manager: InputManager): void => {
  globalInputManager = manager;
};

export const getGlobalInputManager = (): InputManager | null => {
  return globalInputManager;
};
