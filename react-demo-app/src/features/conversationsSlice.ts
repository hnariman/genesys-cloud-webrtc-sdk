import { createSlice } from '@reduxjs/toolkit';
import { IPendingSession, ISdkConversationUpdateEvent } from '../../../dist/es';

export interface ConversationsState {
  pendingSessions: IPendingSession[],
  activeConversations: ISdkConversationUpdateEvent[]
}

const initialState: ConversationsState = {
  pendingSessions: [],
  activeConversations: []
}

export const converationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    addPendingSession: (state, action) => {
      state.pendingSessions = [...state.pendingSessions, action.payload];
    },
    // Need to check if we already have this conversation in state - if we have this update then don't add to state array.
    addConversation: (state, action) => {
      state.activeConversations = [...state.activeConversations, action.payload];
    }
    // removeConversation: (state) => (state as any).pop()

  }
});

export const { addConversation, addPendingSession } = converationsSlice.actions;
export default converationsSlice.reducer;
