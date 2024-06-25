import { createSlice } from '@reduxjs/toolkit';
import { IPendingSession, IStoredConversationState } from '../../../dist/es';

interface IConversationsState {
  pendingSessions: IPendingSession[],
  activeConversations: IActiveConversationsState
}

interface IActiveConversationsState {
  [key: string]: IStoredConversationState;
}

const initialState: IConversationsState = {
  pendingSessions: [],
  activeConversations: {}
}

export const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    updatePendingSessions: (state, action) => {
      const existingSession = state.pendingSessions.find(session => session.id === action.payload.id);
      if (!existingSession) {
        state.pendingSessions = [...state.pendingSessions, action.payload];
        console.warn(state.pendingSessions);
      }
    },
    removePendingSession: (state, action) => {
      const updatedPendingSessions = state.pendingSessions.filter(session => session.conversationId !== action.payload.conversationId);
      state.pendingSessions = updatedPendingSessions;
    },
    updateConversations: (state, action) => {
      const currentConversations = action.payload.current;
      state.activeConversations = currentConversations;
    },
    removeConversations: (state, action) => {
      const removedConversations = action.payload.removed;
      for (const id in removedConversations) {
        delete state.activeConversations[id];
      }
    }
  }
})

export const { updatePendingSessions, removePendingSession, updateConversations } = conversationsSlice.actions;
export default conversationsSlice.reducer;
