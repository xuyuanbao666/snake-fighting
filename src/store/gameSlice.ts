import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FoodType, Theme } from '../utils/constants';

export type Difficulty = 'easy' | 'hard' | 'hell' | 'impossible';

export const DIFFICULTY_CONFIG = {
  easy: {
    label: '简单',
    emoji: '😊',
    aiCount: 2,
    aiSpeed: 0.09,
    aiIntelligence: 0.3,
    playerSpeed: 0.15,
    foodSpecialChance: 0.15,
    description: 'AI 反应慢，数量少',
  },
  hard: {
    label: '困难',
    emoji: '😤',
    aiCount: 3,
    aiSpeed: 0.13,
    aiIntelligence: 0.6,
    playerSpeed: 0.15,
    foodSpecialChance: 0.1,
    description: 'AI 更快更聪明',
  },
  hell: {
    label: '地狱',
    emoji: '💀',
    aiCount: 4,
    aiSpeed: 0.16,
    aiIntelligence: 0.8,
    playerSpeed: 0.15,
    foodSpecialChance: 0.05,
    description: 'AI 极速围堵',
  },
  impossible: {
    label: '虾连奶',
    emoji: '🦐',
    aiCount: 5,
    aiSpeed: 0.19,
    aiIntelligence: 0.95,
    playerSpeed: 0.14,
    foodSpecialChance: 0.03,
    description: '不可能通关',
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
  foodEaten: number;
}

const initialState: GameState = {
  snake: {
    body: [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ],
    directionAngle: 0,
    speed: 150,
    isShielded: false,
    isBoosted: false,
    isMagnetized: false,
  },
  foods: [
    { position: { x: 15, y: 15 }, type: FoodType.STAR },
    { position: { x: 25, y: 10 }, type: FoodType.STAR },
    { position: { x: 10, y: 25 }, type: FoodType.STAR },
    { position: { x: 30, y: 30 }, type: FoodType.APPLE },
    { position: { x: 5, y: 35 }, type: FoodType.DIAMOND },
  ],
  score: 0,
  highScore: 0,
  isPlaying: false,
  isPaused: false,
  theme: 'classic',
  difficulty: 'easy' as Difficulty,
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
        case Direction.UP:
          head.y--;
          break;
        case Direction.DOWN:
          head.y++;
          break;
        case Direction.LEFT:
          head.x--;
          break;
        case Direction.RIGHT:
          head.x++;
          break;
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
    setDifficulty(state, action: PayloadAction<Difficulty>) {
      state.difficulty = action.payload;
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
      return { ...initialState, highScore, theme, difficulty };
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
  setShielded,
  setBoosted,
  setMagnetized,
  updateSnakeBody,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;
