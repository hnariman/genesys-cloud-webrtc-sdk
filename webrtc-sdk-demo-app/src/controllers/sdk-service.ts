import  { ISdkConfig, GenesysCloudWebrtcSdk } from 'genesys-cloud-webrtc-sdk';
import { v4 } from 'uuid';

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

  try {
    await webrtcSdk.initialize()
  } catch (error) {
    console.error(error);
  }
}
