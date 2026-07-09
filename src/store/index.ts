import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    // Game reducers will be added in subsequent tasks
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
