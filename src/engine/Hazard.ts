import { GRID_SIZE, Position } from '../utils/constants';

export type BuffType = 'speed' | 'shield' | 'magnet' | 'doubleScore';

export interface ActiveBuff {
  type: BuffType;
  duration: number; // frames remaining
  startTime: number;
}

export const BUFF_CONFIG: Record<BuffType, { duration: number; label: string; emoji: string; color: string }> = {
  speed: { duration: 300, label: '加速', emoji: '⚡', color: '#FFD700' },
  shield: { duration: 300, label: '护盾', emoji: '🛡️', color: '#2196F3' },
  magnet: { duration: 300, label: '磁铁', emoji: '🧲', color: '#E91E63' },
  doubleScore: { duration: 300, label: '双倍分', emoji: '✖️2', color: '#FF9800' },
};

export function getRandomBuff(): BuffType {
  const buffs: BuffType[] = ['speed', 'shield', 'magnet', 'doubleScore'];
  return buffs[Math.floor(Math.random() * buffs.length)];
}

export class Trap {
  position: Position;
  type: 'spike' | 'poison' | 'slow';
  radius: number;
  active: boolean;
  timer: number;

  constructor(position: Position, type: 'spike' | 'poison' | 'slow') {
    this.position = position;
    this.type = type;
    this.radius = type === 'poison' ? 2 : 1.5;
    this.active = true;
    this.timer = 600; // 10 seconds at 60fps
  }

  update(): void {
    this.timer--;
    if (this.timer <= 0) {
      this.active = false;
    }
  }

  isInRange(pos: Position): boolean {
    if (!this.active) return false;
    const dx = pos.x - this.position.x;
    const dy = pos.y - this.position.y;
    return dx * dx + dy * dy < this.radius * this.radius;
  }
}

export class PoisonFog {
  // Fog shrinks the playable area over time
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  shrinkRate: number;
  tickCounter: number;
  warningZone: number;

  constructor() {
    this.minX = 2;
    this.minY = 2;
    this.maxX = GRID_SIZE - 2;
    this.maxY = GRID_SIZE - 2;
    this.shrinkRate = 0.001; // shrink per frame - slower
    this.tickCounter = 0;
    this.warningZone = 4;
  }

  update(): void {
    this.tickCounter++;
    // Shrink every frame slowly
    if (this.tickCounter % 2 === 0) {
      this.minX += this.shrinkRate;
      this.minY += this.shrinkRate;
      this.maxX -= this.shrinkRate;
      this.maxY -= this.shrinkRate;
    }
  }

  isInSafeZone(pos: Position): boolean {
    return pos.x >= this.minX && pos.x <= this.maxX &&
           pos.y >= this.minY && pos.y <= this.maxY;
  }

  isInWarningZone(pos: Position): boolean {
    return (
      pos.x < this.minX + this.warningZone || pos.x > this.maxX - this.warningZone ||
      pos.y < this.minY + this.warningZone || pos.y > this.maxY - this.warningZone
    ) && this.isInSafeZone(pos);
  }

  getSafeWidth(): number {
    return Math.max(0, this.maxX - this.minX);
  }

  getSafeHeight(): number {
    return Math.max(0, this.maxY - this.minY);
  }
}

export class TrapManager {
  traps: Trap[];
  spawnTimer: number;
  maxTraps: number;
  private snakeBody: Position[] = [];

  constructor() {
    this.traps = [];
    this.spawnTimer = 0;
    this.maxTraps = 8;
  }

  update(snakeBody: Position[], aiBodies: Position[][]): void {
    this.snakeBody = snakeBody;
    // Update existing traps
    for (const trap of this.traps) {
      trap.update();
    }
    // Remove inactive traps
    this.traps = this.traps.filter(t => t.active);

    // Spawn new traps
    this.spawnTimer--;
    if (this.spawnTimer <= 0 && this.traps.length < this.maxTraps) {
      this.spawnTrap(aiBodies);
      this.spawnTimer = 120 + Math.floor(Math.random() * 180); // 2-5 seconds
    }
  }

  private spawnTrap(aiBodies: Position[][]): void {
    const allOccupied = [
      ...this.snakeBody.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) })),
      ...aiBodies.flat().map(p => ({ x: Math.round(p.x), y: Math.round(p.y) })),
      ...this.traps.map(t => ({ x: Math.round(t.position.x), y: Math.round(t.position.y) })),
    ];

    for (let attempt = 0; attempt < 50; attempt++) {
      const x = 3 + Math.random() * (GRID_SIZE - 6);
      const y = 3 + Math.random() * (GRID_SIZE - 6);
      const isOccupied = allOccupied.some(o =>
        Math.abs(o.x - x) < 3 && Math.abs(o.y - y) < 3
      );
      if (!isOccupied) {
        const types: ('spike' | 'poison' | 'slow')[] = ['spike', 'poison', 'slow'];
        const type = types[Math.floor(Math.random() * types.length)];
        this.traps.push(new Trap({ x, y }, type));
        return;
      }
    }
  }

  checkCollision(pos: Position): Trap | null {
    for (const trap of this.traps) {
      if (trap.isInRange(pos)) {
        return trap;
      }
    }
    return null;
  }
}
