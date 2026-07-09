import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FoodType, Theme } from '../utils/constants';

export type Difficulty = 'easy' | 'hard' | 'hell' | 'impossible';
export type GameMode = 'classic' | 'endless';

export const DIFFICULTY_CONFIG = {
  easy: {
    label: '简单',
    emoji: '😊',
    aiCount: 3,
    aiSpeed: 0.09,
    aiIntelligence: 0.3,
    playerSpeed: 0.15,
    description: 'AI 反应慢，数量少',
  },
  hard: {
    label: '困难',
    emoji: '😤',
    aiCount: 5,
    aiSpeed: 0.13,
    aiIntelligence: 0.6,
    playerSpeed: 0.15,
    description: 'AI 更快更聪明',
  },
  hell: {
    label: '地狱',
    emoji: '💀',
    aiCount: 7,
    aiSpeed: 0.16,
    aiIntelligence: 0.8,
    playerSpeed: 0.15,
    description: 'AI 极速围堵',
  },
  impossible: {
    label: '虾连奶',
    emoji: '🦐',
    aiCount: 10,
    aiSpeed: 0.19,
    aiIntelligence: 0.95,
    playerSpeed: 0.14,
    description: '不可能通关',
  },
} as const;

export const GAME_MODE_CONFIG = {
  classic: {
    label: '经典模式',
    emoji: '🎮',
    description: '撞墙即死，吃食物得分',
    wallDeath: true,
  },
  endless: {
    label: '无尽模式',
    emoji: '♾️',
    description: '穿墙不死，难度递增',
    wallDeath: false,
  },
} as const;

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
    directionAngle: number;
    speed: number;
    isShielded: boolean;
    isBoosted: boolean;
    isMagnetized: boolean;
  };
  foods: Food[];
  score: number;
  highScore: number;
  isPlaying: boolean;
  isPaused: boolean;
  theme: Theme;
  difficulty: Difficulty;
  gameMode: GameMode;
  orientation: 'portrait' | 'landscape';
  foodEaten: number;
}

const initialState: GameState = {
  snake: {
    body: [
      { x: 50, y: 50 },
      { x: 49, y: 50 },
      { x: 48, y: 50 },
    ],
    directionAngle: 0,
    speed: 150,
    isShielded: false,
    isBoosted: false,
    isMagnetized: false,
  },
  foods: [],
  score: 0,
  highScore: 0,
  isPlaying: false,
  isPaused: false,
  theme: 'classic',
  difficulty: 'easy',
  gameMode: 'classic',
  orientation: 'portrait' as const,
  foodEaten: 0,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setDirectionAngle(state, action: PayloadAction<number>) {
      state.snake.directionAngle = action.payload;
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
    setFoods(state, action: PayloadAction<Food[]>) {
      state.foods = action.payload;
    },
    addFood(state, action: PayloadAction<Food>) {
      state.foods.push(action.payload);
    },
    removeFood(state, action: PayloadAction<number>) {
      state.foods.splice(action.payload, 1);
    },
    addScore(state, action: PayloadAction<number>) {
      state.score += action.payload;
      if (state.score > state.highScore) {
        state.highScore = state.score;
      }
    },
    incrementFoodEaten(state) {
      state.foodEaten++;
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
    setDifficulty(state, action: PayloadAction<Difficulty>) {
      state.difficulty = action.payload;
    },
    setGameMode(state, action: PayloadAction<GameMode>) {
      state.gameMode = action.payload;
    },
    toggleOrientation(state) {
      state.orientation = state.orientation === 'portrait' ? 'landscape' : 'portrait';
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
    updateSnakeBody(state, action: PayloadAction<Position[]>) {
      state.snake.body = action.payload;
    },
    resetGame(state) {
      const highScore = state.highScore;
      const theme = state.theme;
      const difficulty = state.difficulty;
      const gameMode = state.gameMode;
      return { ...initialState, highScore, theme, difficulty, gameMode };
    },
  },
});

export const {
  setDirectionAngle,
  moveSnake,
  growSnake,
  setFoods,
  addFood,
  removeFood,
  addScore,
  incrementFoodEaten,
  setPlaying,
  setPaused,
  setTheme,
  setDifficulty,
  setGameMode,
  toggleOrientation,
  setShielded,
  setBoosted,
  setMagnetized,
  updateSnakeBody,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;
