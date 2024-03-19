import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  videoElement: null,
  audioElement: null
}

export const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setElements(state, action) {
      state.videoElement = action.payload.video;
      state.audioElement = action.payload.audio;
    }
  }
});

export const { setElements } = videoSlice.actions;
export default videoSlice.reducer;
