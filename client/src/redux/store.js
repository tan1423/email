import { configureStore } from '@reduxjs/toolkit';

import userReducer from "./slice/userSlice"
import listReducer from './slice/listSlice'
import creditReducer from './slice/creditSlice'
import fileUploadReducer from './slice/uploadSlice';
import timeZoneReducer from './slice/timeZoneSlice';

export const store = configureStore({
  reducer: {
    fileUpload: fileUploadReducer,
    user: userReducer,
    credits: creditReducer,
    list: listReducer,
    timeZone: timeZoneReducer,

  },
});

export default store;
