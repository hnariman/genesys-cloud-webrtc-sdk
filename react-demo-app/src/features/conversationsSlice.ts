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
    updateConversations: (state, action) => {
      const { activeConversationId, conversationsToAdd, conversationsToRemove } = action.payload;
      // check if we already have this conversation in state before we add it
    if (!state.activeConversations[activeConversationId]) {
        state.activeConversations[activeConversationId] = conversationsToAdd;
      }
      // remove conversations from state
      for (const id in conversationsToRemove) {
        delete state.activeConversations[id];
      }
    },

  }
});

export const { updateConversations, addPendingSession } = converationsSlice.actions;
export default converationsSlice.reducer;
