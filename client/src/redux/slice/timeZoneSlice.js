import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import axiosInstance, { endpoints } from 'src/utils/axios-util';
import formatTimezoneDisplay from 'src/utils/format-timezone-display-util';

// ----------------------------------------------
// Async Thunks
// ----------------------------------------------

// Fetch all available timezones
export const fetchTimeZones = createAsyncThunk(
  'timeZone/fetchTimeZones',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(endpoints.timeZone.get);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data || 'Failed to fetch timezones');
    }
  }
);

// Save selected timezone
export const saveTimeZone = createAsyncThunk(
  'timeZone/saveTimeZone',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(endpoints.timeZone.save, {
        timezone: data.key,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data || 'Failed to save timezone');
    }
  }
);

// ----------------------------------------------
// Slice
// ----------------------------------------------

const timeZoneSlice = createSlice({
  name: 'timeZone',
  initialState: {
    timeZones: [],
    loading: false,
    error: null,
    selectedTimeZone: {
      key: '',
      value: '',
      display: '',
    },
  },

  reducers: {
    setSelectedTimeZone: (state, action) => {
      const tz = action.payload;
      state.selectedTimeZone = {
        ...tz,
        display: formatTimezoneDisplay(tz),
      };
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch timezones
      .addCase(fetchTimeZones.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimeZones.fulfilled, (state, action) => {
        state.loading = false;
        const timeZones = action.payload?.data || [];
        state.timeZones = timeZones.map((tz) => ({
          ...tz,
          key: tz.key,
          display: formatTimezoneDisplay(tz),
        }));
      })
      .addCase(fetchTimeZones.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Save selected timezone
      .addCase(saveTimeZone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveTimeZone.fulfilled, (state, action) => {
        state.loading = false;
        const savedTimeZone = action.payload;
        state.selectedTimeZone = {
          ...savedTimeZone,
          display: formatTimezoneDisplay(savedTimeZone),
        };
      })
      .addCase(saveTimeZone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ----------------------------------------------
// Exports
// ----------------------------------------------

export const { setSelectedTimeZone } = timeZoneSlice.actions;
export default timeZoneSlice.reducer;
