import  { ISdkConfig, GenesysCloudWebrtcSdk, SdkError } from 'genesys-cloud-webrtc-sdk';
import { v4 } from 'uuid';
import { eventService } from './event-service';

let webrtcSdk: GenesysCloudWebrtcSdk;

export async function initWebrtcSDK (authData: { token: string, environment:  { clientId: string, uri: string }}) {
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
}

function ready() {
  eventService.dispatchEvent('ready', {});
}

function handleSdkError(error: SdkError) {
  console.error(error);
}
