// src/redux/slice/listNameSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import axiosInstance, { endpoints } from 'src/utils/axios-util';

import { deductCredit } from './creditSlice';


export const fetchLists = createAsyncThunk('list/',
  async (params = {}) => {
    try {
      const response = await axiosInstance.get(endpoints.list.get, {
        params
      });
      return {
        stats: response.data.data.stats,
        data: response.data.data,
        totalEmailCount: response.data.data.totalEmailCount
      };
    } catch (error) {
      return error.message;
    }
  },
);

export const searchLists = createAsyncThunk(
  'list/search',
  async (searchQuery = '') => {
    try {
      const response = await axiosInstance.get(endpoints.list.get, {
        params: { search: searchQuery, limit: 100 }
      });
  
      return {
        data: response.data.data,
        stats: response.data.data.stats,
        totalEmailCount: response.data.data.totalEmailCount
      };
    } catch (error) {
      throw error.message;
    }
  }
);
export const fetchListById = createAsyncThunk('list/getList', async (listId) => {
  try {
    const response = await axiosInstance.get(`${endpoints.list.get}/${listId}`)

    return response.data.data
  } catch (error) {
    return error.message
  }
})

export const downloadList = createAsyncThunk(
  'list/downloadList',
  async ({ jobId, downloadType = "all" }, { rejectWithValue }) => {
    try {
      // Make a GET request to download the file
      const response = await axiosInstance.get(`${endpoints.list.download}/${jobId}?type=${downloadType}`, {
        responseType: 'blob', // Important for handling file data
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `download_${jobId}.csv`; // You can customize the filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      // Return a simple success flag instead of the Blob
      return { success: true, jobId };
    } catch (error) {
      // Return error message if the download fails
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteList = createAsyncThunk(
  'list/deleteList',
  async ({ jobId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(endpoints.list.delete, {
        data: {
          jobId,
        },
      });
      return response.data; // Return the server's response for success
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchChartValues = createAsyncThunk(
  'list/fetchChartValues',
  async () => {
    try {
      const response = await axiosInstance.get(endpoints.list.chart)
      return response?.data?.data;
    } catch (error) {
      return error.message;
    }
  }
)

export const startBulkVerification = createAsyncThunk(
  'list/startVerification',
  async (jobId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(endpoints.list.startBulkVerification, {
        jobId,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const pollJobStatus = createAsyncThunk(
  'list/pollJobStatus',
  async ({ jobId }, { dispatch, rejectWithValue }) => {
    const poll = async (resolve, reject) => {
      try {
        const response = await axiosInstance.get(endpoints.list.getStatus, { params: { jobId } });
        const { status } = response.data.data;
        if (status === 'COMPLETED' || status === 'FAILED' || status === 'UNPROCESSED') {
          if (status === 'COMPLETED') {
            dispatch(deductCredit({
              amount: response?.data?.data?.totalEmails
            }))
          }
          resolve(response.data);
        } else {
          setTimeout(() => poll(resolve, reject), 5000); // Poll again in 5 seconds
        }
      } catch (error) {
        reject(rejectWithValue(error.response?.data || error.message));
      }
    };

    return new Promise(poll);
  }
);

const listSlice = createSlice({
  name: 'list',
  initialState: {
    selectedListIndex: 0,
    data: {
      listData: [],
      totalEmailLists: 0,
      page: 1,
      listPerPage: 10
    },
    completedLists: [],
    unprocessedLists: [],
    processingLists: [],
    searchResults: [],
    searchQuery: '',
    stats: {},
    chartValues: {},
    selectedList: {},
    verificationResult: null,
    pollingJob: null, // Track current polling job
    loading: false,      // Add loading state
    error: null,         // Add error state
    downloadLoading: false,  // Track download loading state
    downloadError: null,  // Track download error state
    downloadedFile: null,
  },
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
    },
    setSelectedListIndex: (state, action) => {
      state.selectedListIndex = action.payload;
    },
    setSelectedList: (state, action) => {
      state.selectedList = action.payload;
    },
    setList: (state, action) => {
      state.data.listData = action.payload;
    },
    setCompletedList: (state, action) => {
      state.completedLists = action.payload;
    },
    setUnprocessedList: (state, action) => {
      state.unprocessedLists = action.payload;
    },
    setChartValues: (state, action) => {
      state.chartValues = action.payload;
    }
  }, extraReducers: (builder) => {
    builder
      .addCase(fetchLists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLists.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action?.payload?.data;
        state.completedLists = state.data?.listData?.filter((list) => list?.status === 'COMPLETED');
        state.unprocessedLists = state.data?.listData?.filter((list) => list?.status === 'UNPROCESSED');
        state.processingLists = state.data?.listData?.filter((list) => list?.status === 'PROCESSING');
        state.selectedList = state?.completedLists[0]
      })
      .addCase(fetchLists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchChartValues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChartValues.fulfilled, (state, action) => {
        state.loading = false;
        state.chartValues = action.payload;
      })
      .addCase(fetchChartValues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchListById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchListById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedList = action.payload;
      })
      .addCase(fetchListById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // verification
      .addCase(startBulkVerification.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.verificationResult = null;
      })
      .addCase(startBulkVerification.fulfilled, (state, action) => {
        state.loading = false;
        state.verificationResult = action.payload;
      })
      .addCase(startBulkVerification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 
      .addCase(pollJobStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(pollJobStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedList = state.data.listData.map((list) =>
          list.jobId === action.payload.data.jobId ? { ...list, status: action?.payload?.data?.status } : list
        );
        state.data.listData = updatedList;
        state.pollingJob = null; // Reset current polling job
      })
      .addCase(pollJobStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.pollingJob = null; // Reset current polling job
      })
      // download file 
      .addCase(downloadList.pending, (state) => {
        state.downloadLoading = true;
        state.downloadError = null;
      })
      .addCase(downloadList.fulfilled, (state, action) => {
        state.downloadLoading = false;
        state.lastDownloadedJobId = action.payload.jobId;
      })
      .addCase(downloadList.rejected, (state, action) => {
        state.downloadLoading = false;
        state.downloadError = action.payload;
      })
      // search list
      .addCase(searchLists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchLists.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload.data;
      })
      .addCase(searchLists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { lists, setSelectedListIndex, setList, setSelectedList, setChartValues, unprocessedLists, completedLists, setCompletedList, setUnprocessedList, clearSearch, setSearchQuery } = listSlice.actions;
export default listSlice.reducer;