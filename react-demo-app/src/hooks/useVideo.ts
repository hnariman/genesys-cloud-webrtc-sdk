import { useEffect } from "react";
import { eventService } from "../services/event-service";
import { useDispatch } from "react-redux";
import { updateLocalVideo } from "../features/videoSlice";

export default function useHandleSessionStarted() {
  const dispatch = useDispatch();

  function setupVideoElements(session) {
    if (session.sessionType === "collaborateVideo") {
      const audioElement = audioVideoElements.audioElement;
      const videoElement = audioVideoElements.videoElement;
      const localVideoElement = audioVideoElements.localVideoElement;
      if (audioElement && videoElement) {
        let mediaStream = new MediaStream();
        mediaStream = await sdk.media.startMedia();

        session.once('incomingMedia', () => {
          const localVideoAttr = {
            autoPlay: true,
            volume: 0,
            srcObject: session._outboundStream
          }
          dispatch(updateLocalVideo(localVideoAttr))
        });
        console.warn('here we have the media stream: ', mediaStream);
        sdk.acceptSession({ conversationId: session.conversationId, audioElement, videoElement, mediaStream });
      }
    }
  }

  useEffect(() => {

  }, [dispatch]);

  return { setupVideoElements }
}
