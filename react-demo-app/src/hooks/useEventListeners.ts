import { useEffect } from 'react';
import { eventService } from '../services/event-service';
import { useDispatch, useSelector } from 'react-redux';
import { addConversation, addPendingSession } from '../features/conversationsSlice';
import { useNavigate } from 'react-router-dom';
import { ISdkConversationUpdateEvent } from '../../../dist/es';

export default function useEventListners() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const conversations = useSelector((state) => state.conversations.activeConversations);

  // TODO: Create an array that stores all events received and the order they were received in.
  useEffect(() => {
    eventService.addEventListener('ready', () => navigate('/dashboard'));
    eventService.addEventListener('pendingSession', (event) => console.warn('hook pending: ', event.detail));
    eventService.addEventListener('conversationUpdate', (event) => {
      // const conversationUpdate: ISdkConversationUpdateEvent = event.detail;
      dispatch(addConversation(event.detail))
    });
    eventService.addEventListener('cancelPendingSession', (event) => console.warn('pending cancelled inside hook', event));
    eventService.addEventListener('handledPendingSession', (event) => console.warn('handled pending inside hook', event));
    eventService.addEventListener('sessionStarted', (event) => console.warn('session started inside hook', event));
    eventService.addEventListener('sdkError', (event) => console.warn('sdk error inside hook', event));
    eventService.addEventListener('sessionEnded', (event) => console.warn('session ended inside hook', event));
    eventService.addEventListener('disconnected', (event) => console.warn('disconnected inside hook', event));
    eventService.addEventListener('connected', (event) => console.warn('connected inside hook', event));

    // webrtcSdk.on('error', error);
    // webrtcSdk.on('terminated', terminated);
    // webrtcSdk.on('changeConnectionState', changeConnectionState);
    // webrtcSdk.on('changeInterrupted', changeInterrupted);
    // webrtcSdk.on('changeActive', changeActive);
    // webrtcSdk.on('endOfCandidates', endOfCandidates);
    // webrtcSdk.on('disconnected', disconnected);
    // webrtcSdk.on('connected', connected);
    // webrtcSdk.on('conversationUpdate', handleConversationUpdate);
    // webrtcSdk.on('station', handleStationUpdate);
    // webrtcSdk.on('resolutionUpdated', handleResolutionUpdate);


    return () => {
      eventService.removeEventListener('ready', () => navigate('/dashboard'));
      eventService.removeEventListener('pendingSession', (event) => console.warn('we should log something:', event));
      eventService.removeEventListener('conversationUpdate', (event) => dispatch(addConversation(event.detail)));
      eventService.removeEventListener('cancelPendingSession', (event) => console.warn('pending cancelled inside hook', event));
      eventService.removeEventListener('handledPendingSession', (event) => console.warn('handled pending inside hook', event));
      eventService.removeEventListener('sessionStarted', (event) => console.warn('session started inside hook', event));
      eventService.removeEventListener('sdkError', (event) => console.warn('sdk error inside hook', event));
      eventService.removeEventListener('sessionEnded', (event) => console.warn('session ended inside hook', event));
      eventService.removeEventListener('disconnected', (event) => console.warn('disconnected inside hook', event));
      eventService.removeEventListener('connected', (event) => console.warn('connected inside hook', event));
    }

  }, [dispatch, navigate]);
}
