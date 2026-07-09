export const GRID_SIZE = 40;
export const CELL_SIZE = 16;
export const VIEWPORT_CELLS = 20;
export const INITIAL_SNAKE_LENGTH = 3;
export const INITIAL_SPEED = 150;
export const MIN_SPEED = 50;
export const SPEED_INCREMENT = 10;

export interface Position {
  x: number;
  y: number;
}

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
