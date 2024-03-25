import { useEffect } from "react";
import { eventService } from "../services/event-service";
import { useDispatch, useSelector } from "react-redux";
import {
  removePendingSession,
  updateConversations,
  updatePendingSessions,
} from "../features/conversationsSlice";
import { useNavigate } from "react-router-dom";
import {
  ISdkConversationUpdateEvent,
  IStoredConversationState,
} from "../../../dist/es";
import { updateLocalVideo, addSession, removeSession } from "../features/videoSlice";

interface IConversationsToAddOrRemove {
  conversationsToAdd: {
    [key: string]: IStoredConversationState;
  };
  conversationsToRemove: {
    [key: string]: IStoredConversationState;
  };
}

export default function useEventListners() {
  const sdk = (window as any).sdk;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const audioVideoElements = useSelector((state) => state.video);

  function createConversationsList(event: ISdkConversationUpdateEvent) {
    const conversationsToAddOrRemove: IConversationsToAddOrRemove = {
      conversationsToAdd: {},
      conversationsToRemove: {},
    };
    event.current.forEach((update) => {
      conversationsToAddOrRemove.conversationsToAdd[update.conversationId] =
        update;
    });

    event.removed.forEach((update) => {
      conversationsToAddOrRemove.conversationsToRemove[update.conversationId] =
        update;
    });

    return conversationsToAddOrRemove;
  }

  // TODO: Create an array that stores all events received and the order they were received in.
  useEffect(() => {
    eventService.addEventListener("ready", handleReady);
    eventService.addEventListener("pendingSession", handlePending);
    eventService.addEventListener(
      "conversationUpdate",
      handleConversationUpdate
    );
    eventService.addEventListener(
      "cancelPendingSession",
      handleCancelPendingSession
    );
    eventService.addEventListener(
      "handledPendingSession",
      handledPendingSession
    );
    eventService.addEventListener("sessionStarted", handleSessionStarted);
    eventService.addEventListener("sdkError", handleSdkError);
    eventService.addEventListener("sessionEnded", handleSessionEnded);
    eventService.addEventListener("disconnected", handleDisconnected);
    eventService.addEventListener("connected", handleConnected);

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
      eventService.removeEventListener("ready", handleReady);
      eventService.removeEventListener("pendingSession", handlePending);
      eventService.removeEventListener(
        "conversationUpdate",
        handleConversationUpdate
      );
      eventService.removeEventListener(
        "cancelPendingSession",
        handleCancelPendingSession
      );
      eventService.removeEventListener(
        "handledPendingSession",
        handledPendingSession
      );
      eventService.removeEventListener("sessionStarted", handleSessionStarted);
      eventService.removeEventListener("sdkError", handleSdkError);
      eventService.removeEventListener("sessionEnded", handleSessionEnded);
      eventService.removeEventListener("disconnected", handleDisconnected);
      eventService.removeEventListener("connected", handleConnected);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, navigate, audioVideoElements]);

  // TODO: probably need to extract some of these into their own custom hooks.
  // Event handlers.
  const handleReady = () => navigate("/dashboard");
  const handlePending = (event) => {
    console.warn("hook pending: ", event.detail);
    dispatch(updatePendingSessions(event.detail));
  };
  const handleConversationUpdate = (event) => {
    const conversationUpdate: ISdkConversationUpdateEvent = event.detail;
    const conversationToAddOrRemove =
      createConversationsList(conversationUpdate);
    dispatch(updateConversations(conversationToAddOrRemove));
  };
  const handleCancelPendingSession = (event) =>
    dispatch(removePendingSession(event.detail));
  const handledPendingSession = (event) =>
    dispatch(removePendingSession(event.detail));
  const handleSessionStarted = async (event) => {
    const session = event.detail;
    if (session.sessionType === "collaborateVideo") {
      dispatch(addSession(session));
      const audioElement = audioVideoElements.audioElement;
      const videoElement = audioVideoElements.videoElement;
      if (audioElement && videoElement) {
        let mediaStream = new MediaStream();
        mediaStream = await sdk.media.startMedia();

        session.once("incomingMedia", () => {
          const localVideoAttr = {
            autoPlay: true,
            volume: 0,
            srcObject: session._outboundStream,
          };
          dispatch(updateLocalVideo(localVideoAttr));
          console.warn(audioVideoElements.localVideoElement);
        });
        sdk.acceptSession({
          conversationId: session.conversationId,
          audioElement,
          videoElement,
          mediaStream,
        });
      }
    }
  };
  const handleSdkError = (event) =>
    console.warn("sdk error inside hook", event);
  const handleSessionEnded = (event) =>{
    const session = event.detail;
    if (session.sessionType === "collaborateVideo") {
      dispatch(removeSession());
    }
  }
  const handleDisconnected = (event) =>
    console.warn("disconnected inside hook", event);
  const handleConnected = (event) =>
    console.warn("connected inside hook", event);
}
