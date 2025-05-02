import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  userId: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  userId: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload;
      state.isAuthenticated = true; // Set authenticated when userId is set
    },
    logout: (state) => {
      state.userId = null; // Clear userId on logout
      state.isAuthenticated = false;
    },
  },
});

export const { setUserId, logout } = authSlice.actions;
export default authSlice.reducer;
