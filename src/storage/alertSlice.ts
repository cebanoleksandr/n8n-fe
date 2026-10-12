import { createSlice } from '@reduxjs/toolkit';

interface AlertState {
  text: string;
  mode: 'success' | 'error' | 'info' | 'warning';
}

const initialState: AlertState = {
  text: '',
  mode: 'success',
};

const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    setAlertAC: (state, action: { payload: { text: string, mode: 'success' | 'error' | 'info' | 'warning' } }) => {
      state.text = action.payload.text;
      state.mode = action.payload.mode;
    },
    removeAlertAC: (state) => {
      state.text = '';
    },
  },
});

export const { setAlertAC, removeAlertAC } = alertSlice.actions;
export default alertSlice.reducer;
