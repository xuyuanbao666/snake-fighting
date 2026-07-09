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

export const { toggleSound, toggleVibration, setControlType } =
  settingsSlice.actions;

export default settingsSlice.reducer;
