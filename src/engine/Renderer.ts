import { CELL_SIZE, THEME_COLORS, Theme, FoodType } from '../utils/constants';
import { Position } from '../store/gameSlice';

export class Renderer {
  private ctx: any;
  private canvas: any;
  private theme: Theme;

  constructor(canvas: any, theme: Theme = 'classic') {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = theme;
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
  }

  clear(): void {
    const colors = THEME_COLORS[this.theme];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = colors.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawSnakeSegment(x: number, y: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      x * CELL_SIZE,
      y * CELL_SIZE,
      CELL_SIZE - 1,
      CELL_SIZE - 1
    );
  }

  drawSnakeBody(body: Position[], theme: Theme): void {
    const colors = THEME_COLORS[theme];
    body.forEach((segment, index) => {
      const alpha = 1 - (index / body.length) * 0.5;
      this.ctx.globalAlpha = alpha;
      this.drawSnakeSegment(segment.x, segment.y, colors.snake);
    });
    this.ctx.globalAlpha = 1;
  }

  drawSnakeHead(x: number, y: number, theme: Theme): void {
    const colors = THEME_COLORS[theme];
    this.ctx.fillStyle = colors.snake;
    this.ctx.beginPath();
    this.ctx.arc(
      x * CELL_SIZE + CELL_SIZE / 2,
      y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.arc(
      x * CELL_SIZE + CELL_SIZE * 0.3,
      y * CELL_SIZE + CELL_SIZE * 0.3,
      2,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(
      x * CELL_SIZE + CELL_SIZE * 0.7,
      y * CELL_SIZE + CELL_SIZE * 0.3,
      2,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
  }

  drawFood(x: number, y: number, type: FoodType): void {
    const colors = THEME_COLORS[this.theme];
    const centerX = x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = y * CELL_SIZE + CELL_SIZE / 2;

    switch (type) {
      case FoodType.STAR:
        this.ctx.fillStyle = '#FFD700';
        this.drawStar(centerX, centerY, 5, CELL_SIZE / 2, CELL_SIZE / 4);
        break;

      case FoodType.APPLE:
        this.ctx.fillStyle = '#F44336';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, CELL_SIZE / 2 - 1, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY - CELL_SIZE / 2, 3, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case FoodType.DIAMOND:
        this.ctx.fillStyle = '#00BCD4';
        this.drawDiamond(centerX, centerY);
        break;
    }
  }

  private drawDiamond(cx: number, cy: number): void {
    const size = CELL_SIZE / 2;
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - size);
    this.ctx.lineTo(cx + size, cy);
    this.ctx.lineTo(cx, cy + size);
    this.ctx.lineTo(cx - size, cy);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawStar(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): void {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      this.ctx.lineTo(
        cx + Math.cos(rot) * outerRadius,
        cy + Math.sin(rot) * outerRadius
      );
      rot += step;
      this.ctx.lineTo(
        cx + Math.cos(rot) * innerRadius,
        cy + Math.sin(rot) * innerRadius
      );
      rot += step;
    }

    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawRocket(cx: number, cy: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - CELL_SIZE / 2);
    this.ctx.lineTo(cx + CELL_SIZE / 3, cy + CELL_SIZE / 3);
    this.ctx.lineTo(cx - CELL_SIZE / 3, cy + CELL_SIZE / 3);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawShield(cx: number, cy: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - CELL_SIZE / 2);
    this.ctx.lineTo(cx + CELL_SIZE / 2, cy - CELL_SIZE / 4);
    this.ctx.lineTo(cx + CELL_SIZE / 2, cy + CELL_SIZE / 4);
    this.ctx.lineTo(cx, cy + CELL_SIZE / 2);
    this.ctx.lineTo(cx - CELL_SIZE / 2, cy + CELL_SIZE / 4);
    this.ctx.lineTo(cx - CELL_SIZE / 2, cy - CELL_SIZE / 4);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawMagnet(cx: number, cy: number): void {
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, CELL_SIZE / 3, 0, Math.PI);
    this.ctx.fill();
    this.ctx.fillRect(cx - CELL_SIZE / 3, cy, CELL_SIZE * 2 / 3, CELL_SIZE / 4);
  }
}
