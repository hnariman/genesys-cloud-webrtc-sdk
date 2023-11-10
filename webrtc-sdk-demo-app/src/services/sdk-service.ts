import  { ISdkConfig, GenesysCloudWebrtcSdk, SdkError } from 'genesys-cloud-webrtc-sdk';
import { v4 } from 'uuid';
import { eventService } from './event-service';

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
  console.warn('we got the number', phoneNumber);
  webrtcSdk.startSoftphoneSession({ phoneNumber });
}

function handlePendingSession(session: any) {
  console.warn('we have a pending session!')
  // Check if we already have this pending session -> if not add it to array.
  const existingPendingSession = pendingSessions.find((s: any) => s.conversationId === session.conversationId);
  if (!existingPendingSession) {
    pendingSessions.push(session);
  }
}

function pendingSessionHandled() {
  console.warn('aready handled boss');
}

function handleSessionStarted() {
  console.warn('handle session started!')
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
