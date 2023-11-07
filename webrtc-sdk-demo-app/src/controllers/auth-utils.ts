import platformClient from 'purecloud-platform-client-v2';

const client = platformClient.ApiClient.instance;
const persitentName = 'sdk_test';

export const environments = {
  'dca': {
    // clientId: '2c75d833-922b-4324-9d0e-6c20b9c714b2', // created in valve-telphony org, dca
    clientId: '2e10c888-5261-45b9-ac32-860a1e67eff8',
    uri: 'inindca.com'
  },
  'pca-us': {
    clientId: '6b9f791c-86ef-4f7a-af85-3f3520dd0975', // created in torontohackathon org
    uri: 'mypurecloud.com'
  }
};

export async function checkAuthToken(auth: any) {
  const token = auth.token;
  if (!auth.token) {
    console.error('No token found!');
    return;
  }
  window.location.hash = `#access_token=${token}&env=${auth.env}`;
  authenticateFromUrlToken();
}

export function authenticateFromUrlToken () {
  const urlParams = getCurrentUrlParams();
  if (!urlParams) {
    return;
  }
  const environment = (environments as any)[(urlParams as any).env];
  const token = (urlParams as any)['access_token'];

  client.setPersistSettings(true, persitentName);
  client.setEnvironment(environment.uri);

  window.localStorage.setItem(`${persitentName}_auth_data`, JSON.stringify({ accessToken: token }));
  (platformClient.ApiClient as any).instance.authentications['PureCloud OAuth'].accessToken = token;
  (window as any).conversationsAPI = new platformClient.ConversationsApi();

}


function getCurrentUrlParams() {
  let params = null;
      const urlParts = window.location.href.split('#');

      if (urlParts[1]) {
        const urlParamsArr = urlParts[1].split('&');

        if (urlParamsArr.length) {
          params = {};
          for (let i = 0; i < urlParamsArr.length; i++) {
            const currParam = urlParamsArr[i].split('=');
            const key = currParam[0];
            const value = currParam[1];
            (params as any)[key] = value;
          }
        }
      }
      return params;
}
