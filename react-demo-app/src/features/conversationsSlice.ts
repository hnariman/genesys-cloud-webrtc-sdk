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
    updatePendingSessions: (state, action) => {
      const existingSession = state.pendingSessions.find(session => session.id === action.payload.id);
      if (!existingSession) {
        state.pendingSessions = [...state.pendingSessions, action.payload];
      }
    },
    updateConversations: (state, action) => {
      const { conversationsToAdd, conversationsToRemove } = action.payload;
      // check if we already have this conversation in state before we add it
      if (!state.activeConversations[conversationsToAdd]) {
        state.activeConversations = conversationsToAdd;
      }
      // remove conversations from state
      for (const id in conversationsToRemove) {
        delete state.activeConversations[id];
      }
    },
    // If a pending session has been accepted we need to remove it from state.
    removePendingSession: (state, action) => {
      const updatedPendingSessions = state.pendingSessions.filter(session => session.conversationId !== action.payload.conversationId);
      state.pendingSessions = updatedPendingSessions;
    }

  }
});

export const { updateConversations, updatePendingSessions, removePendingSession } = converationsSlice.actions;
export default converationsSlice.reducer;
