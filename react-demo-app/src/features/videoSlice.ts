import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  videoElement: HTMLVideoElement,
  audioElement: HTMLAudioElement,
  localVideoElement: HTMLVideoElement,
  activeSession: {}
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
    },
    addSession(state, action) {
      state.activeSession = action.payload;
    },
    removeSession(state) {
      state.activeSession = {};
    }
  }
});

export const { setElements, updateLocalVideo, addSession, removeSession } = videoSlice.actions;
export default videoSlice.reducer;
