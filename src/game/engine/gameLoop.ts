export type GameLoopCallback = (deltaTime: number) => void;

export interface GameLoopOptions {
  fixedTimeStep?: number;
  maxDeltaTime?: number;
}

export class GameLoop {
  private lastTime: number = 0;
  private accumulator: number = 0;
  private running: boolean = false;
  private animationFrameId: number | null = null;
  private callbacks: Set<GameLoopCallback> = new Set();
  
  private readonly fixedTimeStep: number;
  private readonly maxDeltaTime: number;
  private readonly targetFPS: number = 60;

  constructor(options: GameLoopOptions = {}) {
    this.fixedTimeStep = options.fixedTimeStep ?? (1000 / this.targetFPS);
    this.maxDeltaTime = options.maxDeltaTime ?? 100;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  onUpdate(callback: GameLoopCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private loop = (): void => {
    if (!this.running) return;

    const currentTime = performance.now();
    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (deltaTime > this.maxDeltaTime) {
      deltaTime = this.maxDeltaTime;
    }

    this.accumulator += deltaTime;

    while (this.accumulator >= this.fixedTimeStep) {
      for (const callback of this.callbacks) {
        callback(this.fixedTimeStep);
      }
      this.accumulator -= this.fixedTimeStep;
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  getDeltaTime(): number {
    return this.fixedTimeStep;
  }
}

export const createGameLoop = (options?: GameLoopOptions): GameLoop => {
  return new GameLoop(options);
};
