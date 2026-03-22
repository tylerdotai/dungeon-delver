export interface Camera {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RenderObject {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.camera = { x: 0, y: 0, width, height };
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.camera.width, this.camera.height);
  }

  setCamera(x: number, y: number): void {
    this.camera.x = x;
    this.camera.y = y;
  }

  drawRect(obj: RenderObject): void {
    const screenX = obj.x - this.camera.x;
    const screenY = obj.y - this.camera.y;
    this.ctx.fillStyle = obj.color;
    this.ctx.fillRect(screenX, screenY, obj.width, obj.height);
  }

  getCamera(): Camera {
    return { ...this.camera };
  }
}

export const createRenderer = (ctx: CanvasRenderingContext2D, width: number, height: number): Renderer => {
  return new Renderer(ctx, width, height);
};
