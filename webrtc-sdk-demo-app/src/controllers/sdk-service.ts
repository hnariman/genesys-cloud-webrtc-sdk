import  { ISdkConfig, GenesysCloudWebrtcSdk } from 'genesys-cloud-webrtc-sdk';

let webrtcSdk: GenesysCloudWebrtcSdk;

export async function initWebrtcSDK (authData: { token: string, environment:  { clientId: string, uri: string }}) {
  console.warn(authData);
  const options: ISdkConfig = {
    accessToken: authData.token,
    environment: authData.environment.uri,
    originAppId: 'react-demo',
    originAppName: 'react-demo',
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
