import  { ISdkConfig, GenesysCloudWebrtcSdk, SdkError, ISessionIdAndConversationId } from 'genesys-cloud-webrtc-sdk';
import { v4 } from 'uuid';
import { eventService } from './event-service';
import { GenesysCloudMediaSession } from 'genesys-cloud-streaming-client';

let webrtcSdk: GenesysCloudWebrtcSdk;
let pendingSessions: any = [];
let count = 0;

export async function initWebrtcSDK (authData: { token: string, environment:  { clientId: string, uri: string }}) {
  console.warn('the count', count++)
  const options: ISdkConfig = {
    accessToken: authData.token,
    environment: authData.environment.uri,
    originAppId: v4(),
    originAppName: 'webrtc-demo-app',
    optOutOfTelemetry: true,
    logLevel: 'info'
  }

  webrtcSdk = new GenesysCloudWebrtcSdk(options);
  (window as any).webrtcSdk = webrtcSdk;
  (window as any).sdk = webrtcSdk;

  connectEventHandlers();


  await webrtcSdk.initialize()
}

function connectEventHandlers() {
  webrtcSdk.on('ready', ready);
  webrtcSdk.on('sdkError', handleSdkError)
  webrtcSdk.on('pendingSession', handlePendingSession);
  webrtcSdk.on('cancelPendingSession', handlePendingSessionCancelled);
  webrtcSdk.on('handledPendingSession', pendingSessionHandled);
  webrtcSdk.on('sessionStarted', handleSessionStarted);
  webrtcSdk.on('sessionEnded', handleSessionEnded);
  // webrtcSdk.on('trace', trace);
  webrtcSdk.on('disconnected', handleDisconnected);
  webrtcSdk.on('connected', handleConnected);
}

function ready() {
  eventService.dispatchEvent('ready', {});
}

export function startSoftphoneSession (phoneNumber: string) {
  if (!phoneNumber) {
    console.error('Must enter a valid phone number.');
    return;
  }
  webrtcSdk.startSoftphoneSession({ phoneNumber });
}

function handlePendingSession(pendingSession: ISessionIdAndConversationId) {
  console.warn('we have a pending session!', pendingSession)
  // Check if we already have this pending session -> if not add it to array and emit to UI
  const existingPendingSession = pendingSessions.find((s: any) => s.conversationId === pendingSession.conversationId);
  if (!existingPendingSession) {
    pendingSessions.push(pendingSession);
    eventService.dispatchEvent('pendingSession', pendingSessions);
  }
}

function pendingSessionHandled(pendingSession: ISessionIdAndConversationId) {
  console.warn('already handled boss', pendingSession);
  // Remove pending session from global pendingSessions array and emit new array to UI
  pendingSessions = pendingSessions.filter((s: any) => s.conversationId !== pendingSession.conversationId);
  eventService.dispatchEvent('pendingSession', pendingSessions);
}

function handleSessionStarted(session: GenesysCloudMediaSession) {
  console.warn('handle session started!', session)
// conversationUpdatesToRender[session.conversationId] = session;

session.on('connectionState', () => console.warn('state'));

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

webrtcSdk.acceptSession({ conversationId: session.conversationId, sessionType: session.sessionType });
}

function handleSessionEnded() {
  console.warn('handle session ended!')
}

function handlePendingSessionCancelled() {
  console.warn('cancelled');
}

function handleConnected() {
  console.warn('connected');
}

function handleDisconnected() {
  console.warn('disconnected')
}

function handleSdkError(error: SdkError) {
  console.error(error);
}



export { webrtcSdk, pendingSessions }
