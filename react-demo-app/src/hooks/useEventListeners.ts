import { useEffect } from 'react';
import { eventService } from '../services/event-service';
import { useDispatch } from 'react-redux';
import { updateConversations, addPendingSession } from '../features/conversationsSlice';
import { useNavigate } from 'react-router-dom';
import { ISdkConversationUpdateEvent, IStoredConversationState } from '../../../dist/es';

interface IConversationsToAddOrRemove {
  activeConversationId: string;
  conversationsToAdd: {
    [key: string]: IStoredConversationState;
  };
  conversationsToRemove: {
    [key: string]: IStoredConversationState;
  }
}

export default function useEventListners() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function createConversationsList (event: ISdkConversationUpdateEvent) {
    const conversationsToAddOrRemove: IConversationsToAddOrRemove = {
      activeConversationId: '',
      conversationsToAdd: {},
      conversationsToRemove: {}
    }
    conversationsToAddOrRemove.activeConversationId = event.activeConversationId;
    event.current.forEach(update => {
      conversationsToAddOrRemove.conversationsToAdd[update.conversationId] = update;
    });

    event.removed.forEach(update => {
      conversationsToAddOrRemove.conversationsToRemove[update.conversationId] = update;
    });

    return conversationsToAddOrRemove;
  }

  // TODO: Create an array that stores all events received and the order they were received in.
  useEffect(() => {
    eventService.addEventListener('ready', handleReady);
    eventService.addEventListener('pendingSession', handlePending);
    eventService.addEventListener('conversationUpdate', handleConversationUpdate);
    eventService.addEventListener('cancelPendingSession', handleCancelPendingSession);
    eventService.addEventListener('handledPendingSession', handledPendingSession);
    eventService.addEventListener('sessionStarted', handleSessionStarted);
    eventService.addEventListener('sdkError', handleSdkError);
    eventService.addEventListener('sessionEnded', handleSessionEnded);
    eventService.addEventListener('disconnected', handleDisconnected);
    eventService.addEventListener('connected', handleConnected);

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
      eventService.removeEventListener('ready', handleReady);
      eventService.removeEventListener('pendingSession', handlePending);
      eventService.removeEventListener('conversationUpdate', handleConversationUpdate);
      eventService.removeEventListener('cancelPendingSession', handleCancelPendingSession);
      eventService.removeEventListener('handledPendingSession', handledPendingSession);
      eventService.removeEventListener('sessionStarted', handleSessionStarted);
      eventService.removeEventListener('sdkError', handleSdkError);
      eventService.removeEventListener('sessionEnded', handleSessionEnded);
      eventService.removeEventListener('disconnected', handleDisconnected);
      eventService.removeEventListener('connected', handleConnected);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, navigate]);

  // Event handlers.
  const handleReady = () => navigate('/dashboard');
  const handlePending = (event) => console.warn('hook pending: ', event.detail);
  const handleConversationUpdate = (event) => {
    const conversationUpdate: ISdkConversationUpdateEvent = event.detail;
    const conversationToAddOrRemove = createConversationsList(conversationUpdate);
    dispatch(updateConversations(conversationToAddOrRemove));
  };
  const handleCancelPendingSession = (event) => console.warn('pending cancelled inside hook', event);
  const handledPendingSession =  (event) => console.warn('handled pending inside hook', event);
  const handleSessionStarted = (event) => console.warn('session started inside hook', event);
  const handleSdkError = (event) => console.warn('sdk error inside hook', event);
  const handleSessionEnded = (event) => console.warn('session ended inside hook', event);
  const handleDisconnected = (event) => console.warn('disconnected inside hook', event);
  const handleConnected = (event) => console.warn('connected inside hook', event);
}
