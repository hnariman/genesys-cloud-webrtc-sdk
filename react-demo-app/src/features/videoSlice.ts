import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  videoElement: HTMLVideoElement,
  audioElement: HTMLAudioElement,
  localVideoElement: HTMLVideoElement
}

export const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setElements(state, action) {
      state.videoElement = action.payload.video;
      state.audioElement = action.payload.audio;
      state.localVideoElement = action.payload.localVideo;
    },
    updateLocalVideo(state, action) {
      if (state.localVideoElement && state.localVideoElement instanceof HTMLVideoElement) {
        state.localVideoElement.setAttribute('autoplay', action.payload.autoPlay);
        state.localVideoElement.volume = action.payload.volume;
        state.localVideoElement.srcObject = action.payload.srcObject;
      }
    }
  }
});

export const { setElements, updateLocalVideo } = videoSlice.actions;
export default videoSlice.reducer;
