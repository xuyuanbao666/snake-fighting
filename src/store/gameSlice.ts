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
    updateSnakeBody(state, action: PayloadAction<Position[]>) {
      state.snake.body = action.payload;
    },
    resetGame(state) {
      const highScore = state.highScore;
      const theme = state.theme;
      return { ...initialState, highScore, theme };
    },
  },
});

export const {
  setDirection,
  moveSnake,
  growSnake,
  setFood,
  setSpecialFood,
  addScore,
  incrementFoodEaten,
  setPlaying,
  setPaused,
  setTheme,
  setShielded,
  setBoosted,
  setMagnetized,
  updateSnakeBody,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;
