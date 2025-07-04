import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import axios, { endpoints } from 'src/utils/axios-util';

import { setSelectedTimeZone } from './timeZoneSlice';

// Initial state
const initialState = {
    user: null, // To store user data (name, email, etc.)
    status: 'idle', // Status of the login process ('idle', 'loading', 'succeeded', 'failed')
    error: null, // Error message in case of login failure
};

// Async thunk to check user session
export const fetchUserSession = createAsyncThunk(
    'auth/fetchUserSession',
    async (_, { rejectWithValue, dispatch }) => {
        try {
            const response = await axios.get(endpoints.auth.me);
            dispatch(setSelectedTimeZone(response.data.data.user.timeZone));
            return response.data.data; // Extract the user data from the response
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message)
        }
    }
);

// Async thunk for logging out
export const logoutUser = createAsyncThunk(
    'auth/logoutUser',
    async (_, { rejectWithValue }) => {
        try {

            await axios.get(endpoints.auth.logout);
            return null; // Successfully logged out, no user data to return
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);


// User Slice
const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null; // Clear user data
            state.status = 'idle';
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Check user session
            .addCase(fetchUserSession.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchUserSession.fulfilled, (state, action) => {
                const userData = action.payload.user;
                state.user = {
                    ...userData,
                    displayName: `${userData.first_name} ${userData.last_name}`, // Combine first_name and last_name
                };
                state.status = 'authenticated';
            })
            .addCase(fetchUserSession.rejected, (state, action) => {
                state.user = null;
                state.status = 'unauthenticated';
                state.error = action.payload || action.error.message;
            })
            // Logout
            .addCase(logoutUser.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.status = 'unauthenticated';
                state.error = null;
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.error = action.payload || action.error.message;
                state.status = 'failed';
            });
    }
});

// Export actions and reducer
export const { logout } = userSlice.actions;
export default userSlice.reducer;