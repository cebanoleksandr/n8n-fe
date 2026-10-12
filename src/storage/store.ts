import { configureStore } from '@reduxjs/toolkit';
import alertSlice from './alertSlice';

export const store = configureStore({
  reducer: {
    alert: alertSlice,
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;