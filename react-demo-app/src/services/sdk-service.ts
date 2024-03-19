import {
  ISdkConfig,
  GenesysCloudWebrtcSdk,
  ISessionIdAndConversationId,
  ISdkConversationUpdateEvent,
  IEndSessionRequest,
} from "genesys-cloud-webrtc-sdk";
import { v4 } from "uuid";
import { eventService } from "./event-service";
import { GenesysCloudMediaSession } from "genesys-cloud-streaming-client";

let webrtcSdk: GenesysCloudWebrtcSdk;
let pendingSessions: any = [];
let count = 0;

export async function initWebrtcSDK(authData: {
  token: string;
  environment: { clientId: string; uri: string };
}) {
  console.warn("the count", count++);
  const options: ISdkConfig = {
    accessToken: authData.token,
    environment: authData.environment.uri,
    originAppId: v4(),
    originAppName: "webrtc-demo-app",
    optOutOfTelemetry: true,
    logLevel: "info",
  };

  webrtcSdk = new GenesysCloudWebrtcSdk(options);
  (window as any)["webrtcSdk"] = webrtcSdk;
  (window as any)["sdk"] = webrtcSdk;

  connectEventHandlers();

  await webrtcSdk.initialize();
}

function connectEventHandlers() {
  webrtcSdk.on("ready", () => eventService.dispatchEvent("ready", {}));
  webrtcSdk.on("sdkError", (error) =>
    eventService.dispatchEvent("sdkError", error)
  );
  webrtcSdk.on("pendingSession", handlePendingSession);
  webrtcSdk.on("cancelPendingSession", (pendingSession) =>
    eventService.dispatchEvent("cancelPendingSession", pendingSession)
  );
  webrtcSdk.on("handledPendingSession", pendingSessionHandled);
  webrtcSdk.on("sessionStarted", handleSessionStarted);
  webrtcSdk.on("sessionEnded", (session) =>
    eventService.dispatchEvent("sessionEnded", session)
  );
  // webrtcSdk.on('trace', trace);
  webrtcSdk.on("disconnected", handleDisconnected);
  webrtcSdk.on("connected", handleConnected);
  webrtcSdk.on("conversationUpdate", (event: ISdkConversationUpdateEvent) =>
    eventService.dispatchEvent("conversationUpdate", event)
  );
}

export function startSoftphoneSession(phoneNumber: string) {
  if (!phoneNumber) {
    console.error("Must enter a valid phone number.");
    return;
  }
  webrtcSdk.startSoftphoneSession({ phoneNumber });
}

export function endSession(request: IEndSessionRequest) {
  console.warn("the request: ", request);
  webrtcSdk.endSession(request);
}

function handlePendingSession(pendingSession: ISessionIdAndConversationId) {
  // Check if we already have this pending session -> if not add it to array and emit to UI
  const existingPendingSession = pendingSessions.find(
    (s: any) => s.conversationId === pendingSession.conversationId
  );
  if (!existingPendingSession) {
    console.warn("pushing pending", pendingSession);
    pendingSessions.push(pendingSession);
    eventService.dispatchEvent("pendingSession", pendingSession);
  }
}

function pendingSessionHandled(pendingSession: ISessionIdAndConversationId) {
  console.warn("already handled boss", pendingSession);
  eventService.dispatchEvent("handledPendingSession", pendingSession);
}

function handleSessionStarted(session: GenesysCloudMediaSession) {
  // conversationUpdatesToRender[session.conversationId] = session;

  // create metadatas
  // const track = screenStream.getTracks()[0];
  // const { height, width, deviceId } = track.getSettings();
  // const screenRecordingMetadatas = [
  //   {
  //     trackId: track.id,
  //     screenId: deviceId, // some applications give you a deviceId on the track which is uniquely tied to a specific monitor
  //     originX: 0,
  //     originY: 0,
  //     resolutionX: width,
  //     resolutionY: height,
  //   primary: true,
  //   }
  // ];

  // webrtcSdk.acceptSession({
  //   conversationId: session.conversationId,
  //   sessionType: session.sessionType,
  // });
  eventService.dispatchEvent("sessionStarted", session);
}

function handleConnected() {
  console.warn("connected");
}

function handleDisconnected() {
  console.warn("disconnected");
}

function enumerateDevices() {
  return webrtcSdk.media.enumerateDevices(true);
}

export { webrtcSdk, pendingSessions, enumerateDevices };
