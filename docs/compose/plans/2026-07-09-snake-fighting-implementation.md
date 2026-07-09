# Snake Fighting 实现计划

> **致代理工作者：** 必须使用 compose:subagent（推荐）或 compose:execute 逐任务执行此计划。步骤使用复选框（`- [ ]`）语法进行跟踪。

**目标：** 实现一款卡通可爱风格的手机端贪吃蛇游戏，支持多种地图主题和特殊道具。

**架构：** React Native + react-native-canvas 实现游戏渲染，Redux 管理游戏状态，AsyncStorage 持久化数据。游戏引擎采用 60fps 游戏循环，通过 Canvas 绘制所有游戏元素。

**技术栈：** React Native, react-native-canvas, @reduxjs/toolkit, @react-native-async-storage/async-storage, react-native-sound

---

## 文件结构

```
snake-fighting/
├── src/
│   ├── components/          # React 组件
│   │   ├── GameCanvas.tsx   # 游戏画布
│   │   ├── ScoreBoard.tsx   # 分数显示
│   │   ├── MenuScreen.tsx   # 菜单界面
│   │   └── GameOver.tsx     # 游戏结束
│   ├── engine/              # 游戏引擎
│   │   ├── GameLoop.ts      # 游戏循环
│   │   ├── Snake.ts         # 蛇的逻辑
│   │   ├── Food.ts          # 食物逻辑
│   │   ├── Collision.ts     # 碰撞检测
│   │   └── Renderer.ts      # Canvas 渲染
│   ├── store/               # Redux 状态
│   │   ├── gameSlice.ts     # 游戏状态
│   │   └── settingsSlice.ts # 设置状态
│   ├── utils/               # 工具函数
│   │   ├── storage.ts       # 本地存储
│   │   └── constants.ts     # 常量定义
│   └── assets/              # 资源文件
│       ├── images/          # 图片资源
│       └── sounds/          # 音效文件
├── App.tsx                  # 主入口
└── package.json
```

---

## 任务 1: 项目初始化

**覆盖：** S1.3, S1.4

**文件：**
- 创建: `package.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js`
- 创建: `App.tsx`, `src/utils/constants.ts`

- [ ] **步骤 1: 初始化 React Native 项目**

```bash
npx react-native init SnakeFighting --template react-native-template-typescript
cd SnakeFighting
```

- [ ] **步骤 2: 安装核心依赖**

```bash
npm install @reduxjs/toolkit react-redux
npm install @react-native-async-storage/async-storage
npm install react-native-canvas
npm install react-native-sound
npm install --save-dev @types/react-native-canvas
```

- [ ] **步骤 3: 创建常量定义文件**

```typescript
// src/utils/constants.ts
export const GRID_SIZE = 20;
export const CELL_SIZE = 16;
export const INITIAL_SNAKE_LENGTH = 3;
export const INITIAL_SPEED = 150;
export const MIN_SPEED = 50;
export const SPEED_INCREMENT = 10;

export const Direction = {
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
} as const;

export type Direction = typeof Direction[keyof typeof Direction];

export const FoodType = {
  NORMAL: 'NORMAL',
  STAR: 'STAR',
  ROCKET: 'ROCKET',
  SHIELD: 'SHIELD',
  MAGNET: 'MAGNET',
} as const;

export type FoodType = typeof FoodType[keyof typeof FoodType];

export const FOOD_POINTS: Record<FoodType, number> = {
  NORMAL: 10,
  STAR: 50,
  ROCKET: 0,
  SHIELD: 0,
  MAGNET: 0,
};

export const THEME_COLORS = {
  classic: {
    background: '#E8F5E9',
    snake: '#4CAF50',
    food: '#F44336',
    special: '#FFD700',
  },
  beach: {
    background: '#FFF8E1',
    snake: '#FF9800',
    food: '#F44336',
    special: '#FFD700',
  },
  ice: {
    background: '#E3F2FD',
    snake: '#2196F3',
    food: '#F44336',
    special: '#FFD700',
  },
  space: {
    background: '#263238',
    snake: '#00BCD4',
    food: '#F44336',
    special: '#FFD700',
  },
} as const;

export type Theme = keyof typeof THEME_COLORS;
```

- [ ] **步骤 4: 验证项目启动**

```bash
npx react-native run-android
# 或
npx react-native run-ios
```

- [ ] **步骤 5: 提交**

```bash
git init
git add .
git commit -m "feat: initialize React Native project with dependencies"
```

---

## 任务 2: Redux 状态管理

**覆盖：** S6.1, S6.2

**文件：**
- 创建: `src/store/index.ts`, `src/store/gameSlice.ts`, `src/store/settingsSlice.ts`

- [ ] **步骤 1: 创建游戏状态切片**

```typescript
// src/store/gameSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Direction, FoodType, Theme } from '../utils/constants';

export interface Position {
  x: number;
  y: number;
}

export interface Food {
  position: Position;
  type: FoodType;
  timer?: number;
}

export interface GameState {
  snake: {
    body: Position[];
    direction: Direction;
    speed: number;
    isShielded: boolean;
    isBoosted: boolean;
    isMagnetized: boolean;
  };
  food: {
    current: Food;
    special: Food | null;
  };
  score: number;
  highScore: number;
  isPlaying: boolean;
  isPaused: boolean;
  theme: Theme;
  foodEaten: number;
}

const initialState: GameState = {
  snake: {
    body: [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ],
    direction: Direction.RIGHT,
    speed: 150,
    isShielded: false,
    isBoosted: false,
    isMagnetized: false,
  },
  food: {
    current: { position: { x: 15, y: 15 }, type: FoodType.NORMAL },
    special: null,
  },
  score: 0,
  highScore: 0,
  isPlaying: false,
  isPaused: false,
  theme: 'classic',
  foodEaten: 0,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setDirection(state, action: PayloadAction<Direction>) {
      const opposite: Record<Direction, Direction> = {
        UP: Direction.DOWN,
        DOWN: Direction.UP,
        LEFT: Direction.RIGHT,
        RIGHT: Direction.LEFT,
      };
      if (action.payload !== opposite[state.snake.direction]) {
        state.snake.direction = action.payload;
      }
    },
    moveSnake(state) {
      const head = { ...state.snake.body[0] };
      switch (state.snake.direction) {
        case Direction.UP: head.y--; break;
        case Direction.DOWN: head.y++; break;
        case Direction.LEFT: head.x--; break;
        case Direction.RIGHT: head.x++; break;
      }
      state.snake.body.unshift(head);
      state.snake.body.pop();
    },
    growSnake(state) {
      const tail = state.snake.body[state.snake.body.length - 1];
      state.snake.body.push({ ...tail });
    },
    setFood(state, action: PayloadAction<Food>) {
      state.food.current = action.payload;
    },
    setSpecialFood(state, action: PayloadAction<Food | null>) {
      state.food.special = action.payload;
    },
    addScore(state, action: PayloadAction<number>) {
      state.score += action.payload;
      if (state.score > state.highScore) {
        state.highScore = state.score;
      }
    },
    incrementFoodEaten(state) {
      state.foodEaten++;
      if (state.foodEaten % 5 === 0) {
        state.snake.speed = Math.max(50, state.snake.speed - 10);
      }
    },
    setPlaying(state, action: PayloadAction<boolean>) {
      state.isPlaying = action.payload;
    },
    setPaused(state, action: PayloadAction<boolean>) {
      state.isPaused = action.payload;
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
    },
    setShielded(state, action: PayloadAction<boolean>) {
      state.snake.isShielded = action.payload;
    },
    setBoosted(state, action: PayloadAction<boolean>) {
      state.snake.isBoosted = action.payload;
    },
    setMagnetized(state, action: PayloadAction<boolean>) {
      state.snake.isMagnetized = action.payload;
    },
    resetGame(state) {
      return initialState;
    },
  },
});

export const {
  setDirection, moveSnake, growSnake, setFood, setSpecialFood,
  addScore, incrementFoodEaten, setPlaying, setPaused, setTheme,
  setShielded, setBoosted, setMagnetized, resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;
```

- [ ] **步骤 2: 创建设置状态切片**

```typescript
// src/store/settingsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Settings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  controlType: 'swipe' | 'buttons';
}

const initialState: Settings = {
  soundEnabled: true,
  vibrationEnabled: true,
  controlType: 'swipe',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleSound(state) {
      state.soundEnabled = !state.soundEnabled;
    },
    toggleVibration(state) {
      state.vibrationEnabled = !state.vibrationEnabled;
    },
    setControlType(state, action: PayloadAction<'swipe' | 'buttons'>) {
      state.controlType = action.payload;
    },
  },
});

export const { toggleSound, toggleVibration, setControlType } = settingsSlice.actions;

export default settingsSlice.reducer;
```

- [ ] **步骤 3: 创建 Redux Store**

```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './gameSlice';
import settingsReducer from './settingsSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

- [ ] **步骤 4: 验证 Redux 集成**

在 `App.tsx` 中添加 Redux Provider 并检查无报错。

- [ ] **步骤 5: 提交**

```bash
git add src/store/
git commit -m "feat: add Redux state management for game and settings"
```

---

## 任务 3: 游戏引擎 - 蛇的逻辑

**覆盖：** S3.1, S3.2

**文件：**
- 创建: `src/engine/Snake.ts`, `src/engine/Snake.test.ts`

- [ ] **步骤 1: 编写蛇的移动测试**

```typescript
// src/engine/Snake.test.ts
import { Snake } from './Snake';
import { Direction, GRID_SIZE } from '../utils/constants';

describe('Snake', () => {
  let snake: Snake;

  beforeEach(() => {
    snake = new Snake();
  });

  it('should initialize with correct length', () => {
    expect(snake.body.length).toBe(3);
  });

  it('should move right by default', () => {
    const initialHead = { ...snake.body[0] };
    snake.move();
    expect(snake.body[0].x).toBe(initialHead.x + 1);
    expect(snake.body[0].y).toBe(initialHead.y);
  });

  it('should change direction', () => {
    snake.setDirection(Direction.DOWN);
    snake.move();
    expect(snake.body[0].y).toBe(11);
  });

  it('should not reverse direction', () => {
    snake.setDirection(Direction.LEFT);
    expect(snake.direction).toBe(Direction.RIGHT);
  });

  it('should grow when eating', () => {
    snake.grow();
    expect(snake.body.length).toBe(4);
  });

  it('should detect wall collision', () => {
    snake.body[0] = { x: 0, y: 0 };
    snake.setDirection(Direction.LEFT);
    snake.move();
    expect(snake.checkWallCollision()).toBe(true);
  });

  it('should detect self collision', () => {
    snake.body = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
      { x: 4, y: 5 },
    ];
    expect(snake.checkSelfCollision()).toBe(true);
  });
});
```

- [ ] **步骤 2: 运行测试确认失败**

```bash
npm test -- src/engine/Snake.test.ts
```

- [ ] **步骤 3: 实现蛇的逻辑**

```typescript
// src/engine/Snake.ts
import { Direction, GRID_SIZE, Position } from '../utils/constants';

export class Snake {
  body: Position[];
  direction: Direction;

  constructor() {
    this.body = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    this.direction = Direction.RIGHT;
  }

  setDirection(newDirection: Direction): void {
    const opposites: Record<Direction, Direction> = {
      [Direction.UP]: Direction.DOWN,
      [Direction.DOWN]: Direction.UP,
      [Direction.LEFT]: Direction.RIGHT,
      [Direction.RIGHT]: Direction.LEFT,
    };
    if (newDirection !== opposites[this.direction]) {
      this.direction = newDirection;
    }
  }

  move(): void {
    const head = { ...this.body[0] };
    switch (this.direction) {
      case Direction.UP: head.y--; break;
      case Direction.DOWN: head.y++; break;
      case Direction.LEFT: head.x--; break;
      case Direction.RIGHT: head.x++; break;
    }
    this.body.unshift(head);
    this.body.pop();
  }

  grow(): void {
    const tail = this.body[this.body.length - 1];
    this.body.push({ ...tail });
  }

  checkWallCollision(): boolean {
    const head = this.body[0];
    return head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE;
  }

  checkSelfCollision(): boolean {
    const head = this.body[0];
    return this.body.slice(1).some(
      segment => segment.x === head.x && segment.y === head.y
    );
  }

  getHead(): Position {
    return this.body[0];
  }
}
```

- [ ] **步骤 4: 运行测试确认通过**

```bash
npm test -- src/engine/Snake.test.ts
```

- [ ] **步骤 5: 提交**

```bash
git add src/engine/Snake.ts src/engine/Snake.test.ts
git commit -m "feat: implement snake movement and collision detection"
```

---

## 任务 4: 游戏引擎 - 食物逻辑

**覆盖：** S3.3, S3.4

**文件：**
- 创建: `src/engine/Food.ts`, `src/engine/Food.test.ts`

- [ ] **步骤 1: 编写食物生成测试**

```typescript
// src/engine/Food.test.ts
import { Food } from './Food';
import { FoodType, GRID_SIZE, Position } from '../utils/constants';

describe('Food', () => {
  let food: Food;

  beforeEach(() => {
    food = new Food();
  });

  it('should generate food at random position', () => {
    const pos = food.generate([]);
    expect(pos.x).toBeGreaterThanOrEqual(0);
    expect(pos.x).toBeLessThan(GRID_SIZE);
    expect(pos.y).toBeGreaterThanOrEqual(0);
    expect(pos.y).toBeLessThan(GRID_SIZE);
  });

  it('should not generate food on snake body', () => {
    const snakeBody: Position[] = Array.from({ length: 400 }, (_, i) => ({
      x: i % GRID_SIZE,
      y: Math.floor(i / GRID_SIZE),
    }));
    expect(() => food.generate(snakeBody)).toThrow();
  });

  it('should generate special food with probability', () => {
    const types: FoodType[] = [];
    for (let i = 0; i < 100; i++) {
      types.push(food.getRandomType(100));
    }
    expect(types).toContain(FoodType.STAR);
  });

  it('should increase special food chance with score', () => {
    const lowScoreTypes: FoodType[] = [];
    const highScoreTypes: FoodType[] = [];
    
    for (let i = 0; i < 100; i++) {
      lowScoreTypes.push(food.getRandomType(0));
      highScoreTypes.push(food.getRandomType(500));
    }
    
    const lowSpecial = lowScoreTypes.filter(t => t !== FoodType.NORMAL).length;
    const highSpecial = highScoreTypes.filter(t => t !== FoodType.NORMAL).length;
    expect(highSpecial).toBeGreaterThanOrEqual(lowSpecial);
  });
});
```

- [ ] **步骤 2: 运行测试确认失败**

```bash
npm test -- src/engine/Food.test.ts
```

- [ ] **步骤 3: 实现食物逻辑**

```typescript
// src/engine/Food.ts
import { FoodType, GRID_SIZE, Position } from '../utils/constants';

export class Food {
  generate(snakeBody: Position[]): Position {
    const available: Position[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const isOccupied = snakeBody.some(
          segment => segment.x === x && segment.y === y
        );
        if (!isOccupied) {
          available.push({ x, y });
        }
      }
    }
    if (available.length === 0) {
      throw new Error('No available positions for food');
    }
    return available[Math.floor(Math.random() * available.length)];
  }

  getRandomType(score: number): FoodType {
    const specialChance = Math.min(0.3, 0.05 + score / 1000);
    if (Math.random() < specialChance) {
      const types = [FoodType.STAR, FoodType.ROCKET, FoodType.SHIELD, FoodType.MAGNET];
      return types[Math.floor(Math.random() * types.length)];
    }
    return FoodType.NORMAL;
  }
}
```

- [ ] **步骤 4: 运行测试确认通过**

```bash
npm test -- src/engine/Food.test.ts
```

- [ ] **步骤 5: 提交**

```bash
git add src/engine/Food.ts src/engine/Food.test.ts
git commit -m "feat: implement food generation and special food types"
```

---

## 任务 5: 游戏引擎 - 碰撞检测

**覆盖：** S3.2, S3.3, S7.1

**文件：**
- 创建: `src/engine/Collision.ts`, `src/engine/Collision.test.ts`

- [ ] **步骤 1: 编写碰撞检测测试**

```typescript
// src/engine/Collision.test.ts
import { Collision } from './Collision';
import { Position, FoodType } from '../utils/constants';

describe('Collision', () => {
  it('should detect food collision', () => {
    const head: Position = { x: 5, y: 5 };
    const food: Position = { x: 5, y: 5 };
    expect(Collision.checkFoodCollision(head, food)).toBe(true);
  });

  it('should not detect food collision when apart', () => {
    const head: Position = { x: 5, y: 5 };
    const food: Position = { x: 6, y: 5 };
    expect(Collision.checkFoodCollision(head, food)).toBe(false);
  });

  it('should detect magnet attraction', () => {
    const head: Position = { x: 5, y: 5 };
    const food: Position = { x: 7, y: 5 };
    expect(Collision.isInMagnetRange(head, food)).toBe(true);
  });

  it('should not detect magnet attraction when far', () => {
    const head: Position = { x: 5, y: 5 };
    const food: Position = { x: 10, y: 10 };
    expect(Collision.isInMagnetRange(head, food)).toBe(false);
  });
});
```

- [ ] **步骤 2: 运行测试确认失败**

```bash
npm test -- src/engine/Collision.test.ts
```

- [ ] **步骤 3: 实现碰撞检测**

```typescript
// src/engine/Collision.ts
import { Position } from '../utils/constants';

export class Collision {
  static checkFoodCollision(head: Position, food: Position): boolean {
    return head.x === food.x && head.y === food.y;
  }

  static isInMagnetRange(head: Position, food: Position, range: number = 3): boolean {
    const dx = Math.abs(head.x - food.x);
    const dy = Math.abs(head.y - food.y);
    return dx <= range && dy <= range;
  }
}
```

- [ ] **步骤 4: 运行测试确认通过**

```bash
npm test -- src/engine/Collision.test.ts
```

- [ ] **步骤 5: 提交**

```bash
git add src/engine/Collision.ts src/engine/Collision.test.ts
git commit -m "feat: implement collision detection system"
```

---

## 任务 6: 游戏引擎 - 渲染器

**覆盖：** S4.1, S4.2, S4.3, S4.4

**文件：**
- 创建: `src/engine/Renderer.ts`, `src/engine/Renderer.test.ts`

- [ ] **步骤 1: 编写渲染器测试**

```typescript
// src/engine/Renderer.test.ts
import { Renderer } from './Renderer';
import { Theme } from '../utils/constants';

describe('Renderer', () => {
  let canvas: any;
  let ctx: any;

  beforeEach(() => {
    ctx = {
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn(() => ({ width: 50 })),
    };
    canvas = {
      getContext: jest.fn(() => ctx),
      width: 320,
      height: 320,
    };
  });

  it('should initialize with canvas', () => {
    const renderer = new Renderer(canvas);
    expect(renderer).toBeDefined();
  });

  it('should draw snake segment', () => {
    const renderer = new Renderer(canvas);
    renderer.drawSnakeSegment(10, 10, '#4CAF50');
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it('should draw food', () => {
    const renderer = new Renderer(canvas);
    renderer.drawFood(5, 5, 'NORMAL');
    expect(ctx.arc).toHaveBeenCalled();
  });

  it('should clear canvas', () => {
    const renderer = new Renderer(canvas);
    renderer.clear();
    expect(ctx.clearRect).toHaveBeenCalled();
  });
});
```

- [ ] **步骤 2: 运行测试确认失败**

```bash
npm test -- src/engine/Renderer.test.ts
```

- [ ] **步骤 3: 实现渲染器**

```typescript
// src/engine/Renderer.ts
import { CELL_SIZE, THEME_COLORS, Theme, FoodType, GRID_SIZE } from '../utils/constants';
import { Position } from '../store/gameSlice';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
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

    // 眼睛
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
      case FoodType.NORMAL:
        this.ctx.fillStyle = colors.food;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, CELL_SIZE / 2 - 1, 0, Math.PI * 2);
        this.ctx.fill();
        // 叶子
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY - CELL_SIZE / 2, 3, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case FoodType.STAR:
        this.ctx.fillStyle = colors.special;
        this.drawStar(centerX, centerY, 5, CELL_SIZE / 2, CELL_SIZE / 4);
        break;

      case FoodType.ROCKET:
        this.ctx.fillStyle = '#FF5722';
        this.drawRocket(centerX, centerY);
        break;

      case FoodType.SHIELD:
        this.ctx.fillStyle = '#2196F3';
        this.drawShield(centerX, centerY);
        break;

      case FoodType.MAGNET:
        this.ctx.fillStyle = '#E91E63';
        this.drawMagnet(centerX, centerY);
        break;
    }
  }

  private drawStar(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): void {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;

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
    this.ctx.stroke();
    this.ctx.fillRect(cx - CELL_SIZE / 3, cy, CELL_SIZE / 6, CELL_SIZE / 3);
    this.ctx.fillRect(cx + CELL_SIZE / 6, cy, CELL_SIZE / 6, CELL_SIZE / 3);
  }
}
```

- [ ] **步骤 4: 运行测试确认通过**

```bash
npm test -- src/engine/Renderer.test.ts
```

- [ ] **步骤 5: 提交**

```bash
git add src/engine/Renderer.ts src/engine/Renderer.test.ts
git commit -m "feat: implement Canvas renderer with theme support"
```

---

## 任务 7: 游戏引擎 - 游戏循环

**覆盖：** S5.3

**文件：**
- 创建: `src/engine/GameLoop.ts`, `src/engine/GameLoop.test.ts`

- [ ] **步骤 1: 编写游戏循环测试**

```typescript
// src/engine/GameLoop.test.ts
import { GameLoop } from './GameLoop';

describe('GameLoop', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should start game loop', () => {
    const onUpdate = jest.fn();
    const loop = new GameLoop(onUpdate);
    loop.start();
    jest.advanceTimersByTime(150);
    expect(onUpdate).toHaveBeenCalled();
  });

  it('should stop game loop', () => {
    const onUpdate = jest.fn();
    const loop = new GameLoop(onUpdate);
    loop.start();
    loop.stop();
    jest.advanceTimersByTime(300);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('should update at correct speed', () => {
    const onUpdate = jest.fn();
    const loop = new GameLoop(onUpdate, 200);
    loop.start();
    jest.advanceTimersByTime(200);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(200);
    expect(onUpdate).toHaveBeenCalledTimes(2);
  });

  it('should change speed', () => {
    const onUpdate = jest.fn();
    const loop = new GameLoop(onUpdate, 200);
    loop.start();
    loop.setSpeed(100);
    jest.advanceTimersByTime(100);
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **步骤 2: 运行测试确认失败**

```bash
npm test -- src/engine/GameLoop.test.ts
```

- [ ] **步骤 3: 实现游戏循环**

```typescript
// src/engine/GameLoop.ts
export class GameLoop {
  private onUpdate: () => void;
  private speed: number;
  private intervalId: NodeJS.Timeout | null = null;
  private lastUpdate: number = 0;

  constructor(onUpdate: () => void, speed: number = 150) {
    this.onUpdate = onUpdate;
    this.speed = speed;
  }

  start(): void {
    if (this.intervalId) return;
    this.lastUpdate = Date.now();
    this.intervalId = setInterval(() => {
      const now = Date.now();
      if (now - this.lastUpdate >= this.speed) {
        this.onUpdate();
        this.lastUpdate = now;
      }
    }, 16);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }
}
```

- [ ] **步骤 4: 运行测试确认通过**

```bash
npm test -- src/engine/GameLoop.test.ts
```

- [ ] **步骤 5: 提交**

```bash
git add src/engine/GameLoop.ts src/engine/GameLoop.test.ts
git commit -m "feat: implement game loop with speed control"
```

---

## 任务 8: 本地存储

**覆盖：** S6.3

**文件：**
- 创建: `src/utils/storage.ts`, `src/utils/storage.test.ts`

- [ ] **步骤 1: 编写存储测试**

```typescript
// src/utils/storage.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Storage } from './storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save high score', async () => {
    await Storage.saveHighScore('classic', 100);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('highScore_classic', '100');
  });

  it('should get high score', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('100');
    const score = await Storage.getHighScore('classic');
    expect(score).toBe(100);
  });

  it('should return 0 for non-existent high score', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const score = await Storage.getHighScore('classic');
    expect(score).toBe(0);
  });

  it('should save settings', async () => {
    const settings = { soundEnabled: true, vibrationEnabled: false };
    await Storage.saveSettings(settings);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('settings', JSON.stringify(settings));
  });

  it('should get settings', async () => {
    const settings = { soundEnabled: true, vibrationEnabled: false };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(settings));
    const result = await Storage.getSettings();
    expect(result).toEqual(settings);
  });
});
```

- [ ] **步骤 2: 运行测试确认失败**

```bash
npm test -- src/utils/storage.test.ts
```

- [ ] **步骤 3: 实现存储逻辑**

```typescript
// src/utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from './constants';

export class Storage {
  static async saveHighScore(theme: Theme, score: number): Promise<void> {
    await AsyncStorage.setItem(`highScore_${theme}`, score.toString());
  }

  static async getHighScore(theme: Theme): Promise<number> {
    const score = await AsyncStorage.getItem(`highScore_${theme}`);
    return score ? parseInt(score, 10) : 0;
  }

  static async saveSettings(settings: {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    controlType: 'swipe' | 'buttons';
  }): Promise<void> {
    await AsyncStorage.setItem('settings', JSON.stringify(settings));
  }

  static async getSettings(): Promise<{
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    controlType: 'swipe' | 'buttons';
  }> {
    const settings = await AsyncStorage.getItem('settings');
    return settings ? JSON.parse(settings) : {
      soundEnabled: true,
      vibrationEnabled: true,
      controlType: 'swipe',
    };
  }
}
```

- [ ] **步骤 4: 运行测试确认通过**

```bash
npm test -- src/utils/storage.test.ts
```

- [ ] **步骤 5: 提交**

```bash
git add src/utils/storage.ts src/utils/storage.test.ts
git commit -m "feat: implement local storage for scores and settings"
```

---

## 任务 9: UI 组件 - 游戏画布

**覆盖：** S5.1, S5.2, S5.4

**文件：**
- 创建: `src/components/GameCanvas.tsx`

- [ ] **步骤 1: 创建游戏画布组件**

```typescript
// src/components/GameCanvas.tsx
import React, { useRef, useEffect, useCallback } from 'react';
import { View, PanResponder, Dimensions, StyleSheet } from 'react-native';
import Canvas from 'react-native-canvas';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setDirection, moveSnake, growSnake, setFood, addScore, incrementFoodEaten, setPlaying, setPaused, setShielded, setBoosted, setMagnetized, setSpecialFood } from '../store/gameSlice';
import { Renderer } from '../engine/Renderer';
import { Snake } from '../engine/Snake';
import { Food } from '../engine/Food';
import { Collision } from '../engine/Collision';
import { GameLoop } from '../engine/GameLoop';
import { Direction, CELL_SIZE, GRID_SIZE, FoodType } from '../utils/constants';

const { width: screenWidth } = Dimensions.get('window');
const canvasSize = Math.floor(screenWidth / CELL_SIZE) * CELL_SIZE;

export const GameCanvas: React.FC = () => {
  const dispatch = useDispatch();
  const canvasRef = useRef<Canvas>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const snakeRef = useRef<Snake>(new Snake());
  const foodRef = useRef<Food>(new Food());
  const gameLoopRef = useRef<GameLoop | null>(null);

  const { snake, food, score, isPlaying, isPaused, theme } = useSelector(
    (state: RootState) => state.game
  );

  useEffect(() => {
    if (canvasRef.current) {
      rendererRef.current = new Renderer(canvasRef.current, theme);
    }
  }, [theme]);

  const generateNewFood = useCallback(() => {
    const newFoodPos = foodRef.current.generate(snakeRef.current.body);
    const newFoodType = foodRef.current.getRandomType(score);
    dispatch(setFood({ position: newFoodPos, type: newFoodType }));
  }, [dispatch, score]);

  const handleGameUpdate = useCallback(() => {
    if (!rendererRef.current) return;

    dispatch(moveSnake());
    snakeRef.current.move();

    if (snakeRef.current.checkWallCollision() || snakeRef.current.checkSelfCollision()) {
      if (!snake.isShielded) {
        gameLoopRef.current?.stop();
        dispatch(setPlaying(false));
        return;
      }
    }

    const head = snakeRef.current.getHead();
    if (Collision.checkFoodCollision(head, food.current.position)) {
      dispatch(growSnake());
      snakeRef.current.grow();
      dispatch(addScore(food.current.type === FoodType.STAR ? 50 : 10));
      dispatch(incrementFoodEaten());
      generateNewFood();
    }

    rendererRef.current.clear();
    rendererRef.current.drawSnakeHead(head.x, head.y, theme);
    rendererRef.current.drawSnakeBody(snakeRef.current.body.slice(1), theme);
    rendererRef.current.drawFood(food.current.position.x, food.current.position.y, food.current.type);

    if (food.special) {
      rendererRef.current.drawFood(food.special.position.x, food.special.position.y, food.special.type);
    }
  }, [dispatch, food, generateNewFood, snake.isShielded, theme]);

  useEffect(() => {
    if (isPlaying && !isPaused) {
      gameLoopRef.current = new GameLoop(handleGameUpdate, snake.speed);
      gameLoopRef.current.start();
    }
    return () => {
      gameLoopRef.current?.stop();
    };
  }, [isPlaying, isPaused, snake.speed, handleGameUpdate]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        if (Math.abs(dx) > Math.abs(dy)) {
          dispatch(setDirection(dx > 0 ? Direction.RIGHT : Direction.LEFT));
        } else {
          dispatch(setDirection(dy > 0 ? Direction.DOWN : Direction.UP));
        }
      },
    })
  ).current;

  const handleCanvasInit = useCallback((canvas: Canvas) => {
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvasRef.current = canvas;
    rendererRef.current = new Renderer(canvas, theme);
  }, [theme]);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Canvas
        ref={handleCanvasInit}
        style={{ width: canvasSize, height: canvasSize }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **步骤 2: 验证组件渲染**

在 App.tsx 中使用 GameCanvas 组件并检查无报错。

- [ ] **步骤 3: 提交**

```bash
git add src/components/GameCanvas.tsx
git commit -m "feat: implement GameCanvas with gesture controls"
```

---

## 任务 10: UI 组件 - 分数显示

**覆盖：** S4.5

**文件：**
- 创建: `src/components/ScoreBoard.tsx`

- [ ] **步骤 1: 创建分数显示组件**

```typescript
// src/components/ScoreBoard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setPaused } from '../store/gameSlice';

export const ScoreBoard: React.FC = () => {
  const dispatch = useDispatch();
  const { score, highScore, isPaused } = useSelector((state: RootState) => state.game);

  return (
    <View style={styles.container}>
      <View style={styles.scoreContainer}>
        <Text style={styles.label}>分数</Text>
        <Text style={styles.score}>{score}</Text>
      </View>
      <TouchableOpacity
        style={styles.pauseButton}
        onPress={() => dispatch(setPaused(!isPaused))}
      >
        <Text style={styles.pauseText}>{isPaused ? '▶' : '⏸'}</Text>
      </TouchableOpacity>
      <View style={styles.scoreContainer}>
        <Text style={styles.label}>最高分</Text>
        <Text style={styles.score}>{highScore}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    marginHorizontal: 10,
    marginTop: 10,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  pauseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseText: {
    fontSize: 20,
    color: '#FFF',
  },
});
```

- [ ] **步骤 2: 验证组件渲染**

在 App.tsx 中使用 ScoreBoard 组件并检查无报错。

- [ ] **步骤 3: 提交**

```bash
git add src/components/ScoreBoard.tsx
git commit -m "feat: implement ScoreBoard component"
```

---

## 任务 11: UI 组件 - 菜单界面

**覆盖：** S4.5

**文件：**
- 创建: `src/components/MenuScreen.tsx`

- [ ] **步骤 1: 创建菜单界面组件**

```typescript
// src/components/MenuScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setPlaying, resetGame, setTheme } from '../store/gameSlice';
import { Theme, THEME_COLORS } from '../utils/constants';

export const MenuScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { highScore, theme } = useSelector((state: RootState) => state.game);

  const handleStart = () => {
    dispatch(resetGame());
    dispatch(setPlaying(true));
  };

  const themes: Theme[] = ['classic', 'beach', 'ice', 'space'];

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>🐍</Text>
        <Text style={styles.title}>Snake Fighting</Text>
      </View>

      <View style={styles.themeContainer}>
        {themes.map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.themeButton,
              { backgroundColor: THEME_COLORS[t].snake },
              theme === t && styles.themeButtonActive,
            ]}
            onPress={() => dispatch(setTheme(t))}
          >
            <Text style={styles.themeText}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.startButton} onPress={handleStart}>
        <Text style={styles.startText}>开始游戏</Text>
      </TouchableOpacity>

      <View style={styles.highScoreContainer}>
        <Text style={styles.highScoreLabel}>最高分</Text>
        <Text style={styles.highScore}>{highScore}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 10,
  },
  themeContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  themeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  themeButtonActive: {
    borderWidth: 2,
    borderColor: '#FFF',
  },
  themeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  highScoreContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  highScoreLabel: {
    fontSize: 14,
    color: '#666',
  },
  highScore: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF9800',
  },
});
```

- [ ] **步骤 2: 验证组件渲染**

在 App.tsx 中使用 MenuScreen 组件并检查无报错。

- [ ] **步骤 3: 提交**

```bash
git add src/components/MenuScreen.tsx
git commit -m "feat: implement MenuScreen with theme selection"
```

---

## 任务 12: UI 组件 - 游戏结束界面

**覆盖：** S4.5

**文件：**
- 创建: `src/components/GameOver.tsx`

- [ ] **步骤 1: 创建游戏结束界面**

```typescript
// src/components/GameOver.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { resetGame, setPlaying } from '../store/gameSlice';

export const GameOver: React.FC = () => {
  const dispatch = useDispatch();
  const { score, highScore, theme } = useSelector((state: RootState) => state.game);

  const handleRestart = () => {
    dispatch(resetGame());
    dispatch(setPlaying(true));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `我在 Snake Fighting 中获得了 ${score} 分！来挑战我吧！`,
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  const isNewHighScore = score >= highScore && score > 0;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>游戏结束</Text>
        
        {isNewHighScore && (
          <Text style={styles.newHighScore}>🎉 新纪录！</Text>
        )}

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>得分</Text>
          <Text style={styles.score}>{score}</Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>最高分</Text>
          <Text style={styles.highScore}>{highScore}</Text>
        </View>

        <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
          <Text style={styles.restartText}>重新开始</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareText}>分享成绩</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 20,
  },
  newHighScore: {
    fontSize: 20,
    color: '#FFD700',
    marginBottom: 15,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
  },
  score: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  highScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  restartButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  restartText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  shareButton: {
    marginTop: 15,
  },
  shareText: {
    color: '#2196F3',
    fontSize: 16,
  },
});
```

- [ ] **步骤 2: 验证组件渲染**

在 App.tsx 中使用 GameOver 组件并检查无报错。

- [ ] **步骤 3: 提交**

```bash
git add src/components/GameOver.tsx
git commit -m "feat: implement GameOver component with share functionality"
```

---

## 任务 13: 音效系统

**覆盖：** S7.3

**文件：**
- 创建: `src/utils/sound.ts`

- [ ] **步骤 1: 创建音效管理器**

```typescript
// src/utils/sound.ts
import Sound from 'react-native-sound';

Sound.setCategory('Playback');

export class SoundManager {
  private sounds: Map<string, Sound> = new Map();
  private enabled: boolean = true;

  constructor() {
    this.loadSounds();
  }

  private loadSounds(): void {
    const soundFiles = {
      eat: 'eat.mp3',
      special: 'special.mp3',
      gameOver: 'game_over.mp3',
      move: 'move.mp3',
    };

    Object.entries(soundFiles).forEach(([key, file]) => {
      const sound = new Sound(file, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log(`Failed to load sound ${file}:`, error);
        }
      });
      this.sounds.set(key, sound);
    });
  }

  play(name: string): void {
    if (!this.enabled) return;
    const sound = this.sounds.get(name);
    if (sound) {
      sound.stop();
      sound.play();
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  release(): void {
    this.sounds.forEach((sound) => sound.release());
  }
}

export const soundManager = new SoundManager();
```

- [ ] **步骤 2: 集成音效到游戏逻辑**

在 GameCanvas.tsx 中添加音效播放：
- 吃到普通食物时播放 `eat`
- 吃到特殊食物时播放 `special`
- 游戏结束时播放 `gameOver`

- [ ] **步骤 3: 提交**

```bash
git add src/utils/sound.ts
git commit -m "feat: implement sound manager for game effects"
```

---

## 任务 14: 主应用集成

**覆盖：** 所有模块

**文件：**
- 修改: `App.tsx`

- [ ] **步骤 1: 创建主应用组件**

```typescript
// App.tsx
import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { Provider, useSelector } from 'react-redux';
import { store, RootState } from './src/store';
import { MenuScreen } from './src/components/MenuScreen';
import { GameCanvas } from './src/components/GameCanvas';
import { ScoreBoard } from './src/components/ScoreBoard';
import { GameOver } from './src/components/GameOver';

const GameContent: React.FC = () => {
  const { isPlaying } = useSelector((state: RootState) => state.game);

  if (!isPlaying) {
    return <MenuScreen />;
  }

  return (
    <>
      <ScoreBoard />
      <GameCanvas />
    </>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#E8F5E9" />
        <GameContent />
      </SafeAreaView>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
});

export default App;
```

- [ ] **步骤 2: 验证完整游戏流程**

测试以下流程：
1. 启动应用 → 显示菜单
2. 点击开始 → 显示游戏画布和分数
3. 滑动控制蛇移动
4. 吃食物 → 分数增加
5. 撞墙/撞自己 → 显示游戏结束
6. 重新开始 → 回到游戏

- [ ] **步骤 3: 提交**

```bash
git add App.tsx
git commit -m "feat: integrate all components into main app"
```

---

## 任务 15: 最终测试和优化

**覆盖：** S8.1, S8.2, S8.3, S8.4

**文件：**
- 测试所有功能

- [ ] **步骤 1: 运行完整测试套件**

```bash
npm test
```

- [ ] **步骤 2: 性能测试**

检查：
- 60fps 稳定运行
- 内存使用正常
- 电池消耗合理

- [ ] **步骤 3: 兼容性测试**

测试：
- iOS 13+
- Android 8+
- 不同屏幕尺寸

- [ ] **步骤 4: 用户体验测试**

检查：
- 手势操作流畅
- 动画效果正常
- 音效配合准确

- [ ] **步骤 5: 最终提交**

```bash
git add .
git commit -m "feat: complete Snake Fighting game implementation"
```

---

## 自检清单

- [ ] 所有单元测试通过
- [ ] 游戏逻辑正确实现
- [ ] 视觉设计符合卡通可爱风格
- [ ] 音效系统正常工作
- [ ] 本地存储功能正常
- [ ] 性能表现良好
- [ ] 代码无明显错误
