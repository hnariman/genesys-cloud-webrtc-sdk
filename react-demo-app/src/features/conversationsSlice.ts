import { createSlice } from '@reduxjs/toolkit';
import { IPendingSession, IStoredConversationState } from '../../../dist/es';

export interface ConversationsState {
  pendingSessions: IPendingSession[],
  activeConversations: { [key: string]: IStoredConversationState };}

const initialState: ConversationsState = {
  pendingSessions: [],
  activeConversations: {}
}

export const converationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    addPendingSession: (state, action) => {
      state.pendingSessions = [...state.pendingSessions, action.payload];
    },
    // check if we already have this conversation in state - if we have this update then don't add to state.
    addConversation: (state, action) => {
      if (state.activeConversations[action.payload.activeConversationId]) {
        return;
      }
      const activeConversations = { ...state.activeConversations };
      activeConversations[action.payload.activeConversationId] = action.payload;
      state.activeConversations = activeConversations;
    }
    // removeConversation: (state) => (state as any).pop()

  }
});

export const { addConversation, addPendingSession } = converationsSlice.actions;
export default converationsSlice.reducer;
