'use strict';

const test = require('ava');
const sinon = require('sinon');
const nock = require('nock');
const WildEmitter = require('wildemitter');

const PureCloudWebrtcSdk = require('../../src/client');

test.beforeEach(() => {

});

const MOCK_USER = {
  chat: { jabberId: 'hubert.j.farnsworth@planetexpress.mypurecloud.com' }
};

const MOCK_ORG = {
  thirdPartyOrgId: '3000'
};

test('constructor | throws if options are not provided', t => {
  t.throws(() => {
    const sdk = new PureCloudWebrtcSdk(); // eslint-disable-line
  });
});

test('constructor | throws if accessToken is not provided', t => {
  t.throws(() => {
    const sdk = new PureCloudWebrtcSdk({ environment: 'mypurecloud.com' }); // eslint-disable-line
  });
});

test('constructor | throws if environment is not valid', t => {
  const sdk1 = new PureCloudWebrtcSdk({ accessToken: '1234', environment: 'mypurecloud.con' }); // eslint-disable-line
  const sdk2 = new PureCloudWebrtcSdk({  // eslint-disable-line
    accessToken: '1234',
    environment: 'mypurecloud.con',
    logger: { warn: sinon.stub() }
  });

  sinon.assert.calledOnce(sdk2.logger.warn);
});

test('constructor | sets up options with defaults', t => {
  const sdk = new PureCloudWebrtcSdk({ accessToken: '1234' });
  t.is(sdk.logger, console);
  t.is(sdk._accessToken, '1234');
  t.is(sdk._environment, 'mypurecloud.com');
  t.is(sdk._autoConnectSessions, true);
  t.is(typeof sdk._customIceServersConfig, 'undefined');
  t.is(sdk._iceTransportPolicy, 'all');
});

test('constructor | sets up options when provided', t => {
  const logger = {};
  const iceServers = [];
  const sdk = new PureCloudWebrtcSdk({
    accessToken: '1234',
    environment: 'mypurecloud.ie',
    autoConnectSessions: false,
    iceServers,
    iceTransportPolicy: 'relay',
    logger
  });

  t.is(sdk.logger, logger);
  t.is(sdk._accessToken, '1234');
  t.is(sdk._environment, 'mypurecloud.ie');
  t.is(sdk._autoConnectSessions, false);
  t.is(sdk._customIceServersConfig, iceServers);
  t.is(sdk._iceTransportPolicy, 'relay');
});

function mockApis ({ failOrg, failUser, failStreaming, withMedia } = {}) {
  const api = nock('https://api.mypurecloud.com');

  let getOrg;
  if (failOrg) {
    getOrg = api.get('/api/v2/organizations/me').reply(401);
  } else {
    getOrg = api.get('/api/v2/organizations/me').reply(200, MOCK_ORG);
  }

  let getUser;
  if (failUser) {
    getUser = api.get('/api/v2/users/me').reply(401);
  } else {
    getUser = api.get('/api/v2/users/me').reply(200, MOCK_USER);
  }

  if (withMedia) {
    global.window = global.window || {};
    window.navigator = window.navigator || {};
    window.navigator.mediaDevices = window.navigator.mediaDevices || {};
    window.navigator.mediaDevices.getUserMedia = () => Promise.resolve(withMedia);
  }

  global.document = {
    createElement: sinon.stub().returns({
      addEventListener: (evt, callback) => setTimeout(callback, 10),
      classList: { add () {} }
    }),
    querySelector () {},
    body: {
      append () {}
    },
    head: {
      appendChild: sinon.stub().callsFake((script) => {
        global.window = global.window || {};
        global.window.Realtime = class extends WildEmitter {
          connect () {
            this.emit('connected');
            this.emit('rtcIceServers');
          }
        };
        if (failStreaming) {
          console.log('Failing the streaming connection');
          script.onerror(new Error('Intentional error loading script'));
        }
      })
    }
  };

  const sdk = new PureCloudWebrtcSdk({ accessToken: '1234', logger: { log () {}, error () {}, warn () {}, debug () {} } });

  return { getOrg, getUser, sdk };
}

test('initialize | fetches org and person details, sets up the streaming connection', async t => {
  const { getOrg, getUser, sdk } = mockApis();

  await sdk.initialize();
  getOrg.done();
  getUser.done();
  t.truthy(sdk._streamingConnection);
});

test('initialize | throws if getting the org fails', t => {
  const { sdk } = mockApis({ failOrg: true });

  return sdk.initialize().then(() => t.fail()).catch(() => t.pass());
});

test('initialize | throws if getting the user fails', t => {
  const { sdk } = mockApis({ failUser: true });

  return sdk.initialize().then(t => t.fail()).catch(() => t.pass());
});

test.serial('initialize | throws if setting up streaming connection fails', t => {
  const { sdk } = mockApis({ failStreaming: true });

  return sdk.initialize().then(() => t.fail()).catch(() => t.pass());
});

test('initialize sets up event proxies', async t => {
  const { sdk } = mockApis();
  await sdk.initialize();

  const eventsToVerify = [
    { name: 'error', trigger: 'error', args: [new Error('test'), {}] },
    { name: 'trace', trigger: 'traceRtcSession' },
    {
      name: 'handledPendingSession',
      trigger: 'handledIncomingRtcSession',
      args: [{ sessionId: 1 }],
      transformedArgs: [ 1 ]
    },
    {
      name: 'cancelPendingSession',
      trigger: 'cancelIncomingRtcSession',
      args: [{ sessionId: 1 }],
      transformedArgs: [ 1 ]
    },
    // { name: 'error', trigger: 'rtcSessionError' },
    { name: 'disconnected', trigger: 'disconnected', args: [], transformedArgs: [ 'Streaming API connection disconnected' ] }
  ];

  sdk._streamingConnection.emit('rtcIceServers');

  async function awaitEvent (sdk, eventName, trigger, args = [], transformedArgs) {
    if (!transformedArgs) {
      transformedArgs = args;
    }
    const promise = new Promise(resolve => {
      const handler = (...eventArgs) => {
        t.deepEqual(transformedArgs, eventArgs, `Args match for ${eventName}`);
        sdk.off(eventName, handler);
        resolve();
      };
      sdk.on(eventName, handler);
    });
    if (typeof trigger === 'string') {
      sdk._streamingConnection.emit(trigger, ...args);
    } else {
      trigger(args);
    }
    await promise;
  }

  return Promise.all(eventsToVerify.map(e => awaitEvent(sdk, e.name, e.trigger, e.args, e.transformedArgs)));
});

test('connected | returns the streaming client connection status', async t => {
  const { sdk } = mockApis();
  await sdk.initialize();

  sdk._streamingConnection.connected = true;
  t.true(sdk.connected);
  sdk._streamingConnection.connected = false;
  t.false(sdk.connected);
});

test('acceptPendingSession | proxies the call to the streaming connection', async t => {
  const { sdk } = mockApis();
  await sdk.initialize();

  sdk._streamingConnection.acceptRtcSession = sinon.stub();

  sdk.acceptPendingSession('4321');
  sinon.assert.calledOnce(sdk._streamingConnection.acceptRtcSession);
  sinon.assert.calledWithExactly(sdk._streamingConnection.acceptRtcSession, '4321');
  t.plan(0);
});

test('rejectPendingSession | proxies the call to the streaming connection', async t => {
  const { sdk } = mockApis();
  await sdk.initialize();

  sdk._streamingConnection.rejectRtcSession = sinon.stub();

  sdk.rejectPendingSession('4321');
  sinon.assert.calledOnce(sdk._streamingConnection.rejectRtcSession);
  sinon.assert.calledWithExactly(sdk._streamingConnection.rejectRtcSession, '4321');
  t.plan(0);
});

test('disconnect | proxies the call to the streaming connection', async t => {
  const { sdk } = mockApis();
  await sdk.initialize();

  sdk._streamingConnection.disconnect = sinon.stub();

  sdk.disconnect();
  sinon.assert.calledOnce(sdk._streamingConnection.disconnect);
  t.plan(0);
});

test('_customIceServersConfig | gets reset if the client refreshes ice servers', async t => {
  const { sdk } = mockApis();
  await sdk.initialize();
  const mockIceServers = [{ urls: [ 'turn:mycustomturn.com' ] }];
  sdk._customIceServersConfig = mockIceServers;

  sdk._streamingConnection.sessionManager = {
    iceServers: [{ urls: ['turn:mypurecloud.com'] }]
  };

  sdk._streamingConnection.emit('rtcIceServers');
  t.is(sdk._streamingConnection.sessionManager.iceServers, mockIceServers);
});

test('onPendingSession | emits a pendingSession event and accepts the session', async t => {
  const { sdk } = mockApis();
  await sdk.initialize();

  sinon.stub(sdk, 'acceptPendingSession');
  const pendingSession = new Promise(resolve => {
    sdk.on('pendingSession', resolve);
  });

  sdk._streamingConnection.emit('requestIncomingRtcSession', {
    sessionId: '1077',
    autoAnswer: true,
    conversationId: 'deadbeef-guid',
    fromJid: '+15558675309@gjoll.mypurecloud.com/instance-id'
  });

  const sessionInfo = await pendingSession;
  t.is(sessionInfo.id, '1077');
  t.is(sessionInfo.conversationId, 'deadbeef-guid');
  t.is(sessionInfo.address, '+15558675309');
  t.is(sessionInfo.autoAnswer, true);
  sinon.assert.calledOnce(sdk.acceptPendingSession);
  sinon.assert.calledWithExactly(sdk.acceptPendingSession, '1077');
});

test('onPendingSession | emits a pendingSession event but does not accept the session if autoAnswer is false', async t => {
  const { sdk } = mockApis();
  await sdk.initialize();

  sinon.stub(sdk, 'acceptPendingSession');
  const pendingSession = new Promise(resolve => {
    sdk.on('pendingSession', resolve);
  });

  sdk._streamingConnection.emit('requestIncomingRtcSession', {
    sessionId: '1077',
    autoAnswer: false,
    conversationId: 'deadbeef-guid',
    fromJid: '+15558675309@gjoll.mypurecloud.com/instance-id'
  });

  const sessionInfo = await pendingSession;
  t.is(sessionInfo.id, '1077');
  t.is(sessionInfo.conversationId, 'deadbeef-guid');
  t.is(sessionInfo.address, '+15558675309');
  t.is(sessionInfo.autoAnswer, false);
  sinon.assert.notCalled(sdk.acceptPendingSession);
});

class MockSession extends WildEmitter {
  constructor () {
    super();
    this.streams = [];
  }
  accept () { }
  addStream () { }
}

test.serial('onSession | starts media, attaches it to the session, attaches it to the dom, accepts the session, and emits a started event', async t => {
  const mockOutboundStream = {};
  const { sdk } = mockApis({ withMedia: mockOutboundStream });
  await sdk.initialize();

  const sandbox = sinon.createSandbox();
  sandbox.spy(global.window.navigator.mediaDevices, 'getUserMedia');
  const bodyAppend = new Promise(resolve => {
    sandbox.stub(global.document.body, 'append').callsFake(resolve);
  });

  const sessionStarted = new Promise(resolve => sdk.on('sessionStarted', resolve));

  const mockSession = new MockSession();
  mockSession.streams = [{
    getTracks: () => [{}]
  }];
  sandbox.stub(mockSession, 'addStream');
  sandbox.stub(mockSession, 'accept');

  sdk._streamingConnection.emit('incomingRtcSession', mockSession);
  await sessionStarted;

  sinon.assert.calledOnce(mockSession.addStream);
  sinon.assert.calledOnce(mockSession.accept);
  sinon.assert.calledOnce(global.window.navigator.mediaDevices.getUserMedia);

  const attachedAudioElement = await bodyAppend;
  t.is(attachedAudioElement.srcObject, mockSession.streams[0]);

  sandbox.restore();
});

test.serial('onSession | uses existing media, attaches it to the session, attaches it to the dom in existing element when ready, and emits a started event', async t => {
  const mockOutboundStream = {};
  const mockAudioElement = { classList: { add () {} } };
  const { sdk } = mockApis({ withMedia: {} });
  await sdk.initialize();
  sdk.pendingStream = mockOutboundStream;
  sdk._autoConnectSessions = false;

  const sandbox = sinon.createSandbox();
  sandbox.spy(global.window.navigator.mediaDevices, 'getUserMedia');
  sandbox.stub(global.document, 'querySelector').returns(mockAudioElement);
  sandbox.stub(global.document.body, 'append');

  const sessionStarted = new Promise(resolve => sdk.on('sessionStarted', resolve));

  const mockSession = new MockSession();
  sinon.stub(mockSession, 'addStream');
  sinon.stub(mockSession, 'accept');

  sdk._streamingConnection.emit('incomingRtcSession', mockSession);
  await sessionStarted;

  sinon.assert.calledOnce(mockSession.addStream);
  sinon.assert.calledWithExactly(mockSession.addStream, mockOutboundStream);
  sinon.assert.notCalled(mockSession.accept);
  sinon.assert.notCalled(global.window.navigator.mediaDevices.getUserMedia);

  const mockInboundStream = {};
  mockSession.emit('peerStreamAdded', mockSession, mockInboundStream);
  t.is(mockAudioElement.srcObject, mockInboundStream);
  sinon.assert.notCalled(global.document.body.append);

  sandbox.restore();
});

test.serial('onSession | uses existing media, attaches it to the session, attaches it to the dom in _pendingAudioElement element when ready, and emits a started event', async t => {
  const mockOutboundStream = {};
  const mockAudioElement = { classList: { add () {} } };
  const { sdk } = mockApis({ withMedia: {} });
  await sdk.initialize();
  sdk.pendingStream = mockOutboundStream;
  sdk._autoConnectSessions = false;
  sdk._pendingAudioElement = mockAudioElement;

  const sandbox = sinon.createSandbox();
  sandbox.spy(global.window.navigator.mediaDevices, 'getUserMedia');
  sandbox.stub(global.document.body, 'append');

  const sessionStarted = new Promise(resolve => sdk.on('sessionStarted', resolve));

  const mockSession = new MockSession();
  sinon.stub(mockSession, 'addStream');
  sinon.stub(mockSession, 'accept');

  sdk._streamingConnection.emit('incomingRtcSession', mockSession);
  await sessionStarted;

  sinon.assert.calledOnce(mockSession.addStream);
  sinon.assert.calledWithExactly(mockSession.addStream, mockOutboundStream);
  sinon.assert.notCalled(mockSession.accept);
  sinon.assert.notCalled(global.window.navigator.mediaDevices.getUserMedia);

  const mockInboundStream = {};
  mockSession.emit('peerStreamAdded', mockSession, mockInboundStream);
  t.is(mockAudioElement.srcObject, mockInboundStream);
  sinon.assert.notCalled(global.document.body.append);

  sandbox.restore();
});
