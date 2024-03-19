import { configureStore } from "@reduxjs/toolkit";
import conversationsReducer from './features/conversationsSlice';
import videoReducer from './features/videoSlice';


export const store= configureStore({
  reducer: {
    conversations: conversationsReducer,
    video: videoReducer
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware({serializableCheck: false})
})
