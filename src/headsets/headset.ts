import { Observable, Subject, Subscription } from 'rxjs';
import { HeadsetEvents, VendorImplementation } from 'softphone-vendor-headsets';

import GenesysCloudWebrtcSdk from '../client';
import { ExpandedConsumedHeadsetEvents, HeadsetControlsChanged, HeadsetRejection, HeadsetRequest, ISdkHeadsetService, OrchestrationState } from './headset-types';
import { SdkHeadsetBase } from './sdk-headset-base';
import { SdkHeadsetServiceFake } from './sdk-headset-service-fake';
import { HeadsetControlsRejectionReason, HeadsetControlsRequestType, MediaMessageEvent, SessionTypes } from 'genesys-cloud-streaming-client';
import { SdkHeadsetService } from './sdk-headset-service';
import { HeadsetRequestType } from '../types/interfaces';

const REQUEST_PRIORITY: {[key in HeadsetControlsRequestType]: number} = {
  'mediaHelper': 30,
  'prioritized': 20,
  'standard': 10
};

const ORCHESTRATION_WAIT_TIME = 1500;

export class HeadsetProxyService implements ISdkHeadsetService {
  private currentHeadsetService: SdkHeadsetBase;
  private currentEventSubscription: Subscription;
  private headsetEventsSub: Subject<ExpandedConsumedHeadsetEvents>;
  private orchestrationState: OrchestrationState = 'notStarted';
  private orchestrationWaitTimer: NodeJS.Timeout;
  headsetEvents$: Observable<ExpandedConsumedHeadsetEvents>;

  constructor (protected sdk: GenesysCloudWebrtcSdk) {
    this.headsetEventsSub = new Subject();
    this.headsetEvents$ = this.headsetEventsSub.asObservable();
  }

  initialize () {
    if (this.sdk.isGuest) {
      return;
    }

    this.sdk._streamingConnection.messenger.on('mediaMessage', this.handleMediaMessage.bind(this));
    this.setUseHeadsets(!!this.sdk._config.useHeadsets);
  }

  // this is to be called externally to start/stop headsets, not internally
  setUseHeadsets (useHeadsets: boolean) {
    // currently only softphone is supported
    const headsetsIsSupported = this.sdk._config.allowedSessionTypes.includes(SessionTypes.softphone);
    if (useHeadsets && !headsetsIsSupported) {
      this.sdk.logger.warn('setUseHeadsets was called with `true` but headsets are not supported in this configuration. Not activating headsets.');
      useHeadsets = false;
    }

    if (this.currentHeadsetService) {
      // if this is the real headset service, this will clean up the current device
      this.currentHeadsetService.updateAudioInputDevice(null);
    }

    if (this.currentEventSubscription) {
      this.currentEventSubscription.unsubscribe();
    }

    if (useHeadsets) {
      this.currentHeadsetService = new SdkHeadsetService(this.sdk);
      this.currentEventSubscription = this.currentHeadsetService.headsetEvents$.subscribe((event) => this.headsetEventsSub.next(event));
      this.setOrchestrationState('notStarted');

      // select sdk default device or system default if one exists
      const initialDeviceId = this.sdk._config.defaults.audioDeviceId ||
        (this.sdk.media.getAudioDevices().length && this.sdk.media.getAudioDevices()[0].deviceId);

      this.updateAudioInputDevice(initialDeviceId);
    } else {
      this.currentHeadsetService = new SdkHeadsetServiceFake(this.sdk);
    }
  }

  get currentSelectedImplementation (): VendorImplementation {
    return this.currentHeadsetService.currentSelectedImplementation;
  }

  updateAudioInputDevice (newMicDeviceId: string): void {
    if (!this.sdk._config.useHeadsets) {
      return;
    }

    // if deviceId is falsey, we will pass it to the headset service so it deactivates the service
    //
    // updating the input device to a supported device triggers the activation of the headset controls so
    // we only want to update the device if we have headset controls
    if (!newMicDeviceId || this.orchestrationState === 'hasControls') {
      return this.currentHeadsetService.updateAudioInputDevice(newMicDeviceId);
    }

    // if the device is a supported device and we don't have controls yet, start the orchestration and let
    // it assign the device afterwards
    const device = this.sdk.media.findCachedDeviceByIdAndKind(newMicDeviceId, 'audioinput');
    const isSupported = device && this.currentHeadsetService.deviceIsSupported({ micLabel: device.label });
    if (isSupported && (this.orchestrationState === 'notStarted' || this.orchestrationState === 'negotiating')) {
      this.startHeadsetOrchestration(device);
    }
  }

  private async startHeadsetOrchestration (deviceToActiveOnSuccess: MediaDeviceInfo) {
    clearTimeout(this.orchestrationWaitTimer);
    this.setOrchestrationState('negotiating');

    this.orchestrationWaitTimer = setTimeout(() => {
      this.sdk.logger.info('No rejections received during orchestration, taking headsetCallControls');

      this.sendControlsChangedMessage(true);
      this.setOrchestrationState('hasControls');
      this.updateAudioInputDevice(deviceToActiveOnSuccess.deviceId);
    }, ORCHESTRATION_WAIT_TIME) as unknown as NodeJS.Timeout;

    this.sdk.logger.info('Starting headsetCallControls orchestration');

    const headsetControlsRequest: HeadsetRequest = {
      jsonrpc: '2.0',
      method: 'headsetControlsRequest',
      params: {
        requestType: this.sdk._config.headsetRequestType || 'standard'
      }
    };
    
    this.sdk._streamingConnection.messenger.broadcastMessage({
      mediaMessage: headsetControlsRequest
    });
  }

  private setOrchestrationState (state: OrchestrationState) {
    if (state === this.orchestrationState) {
      return;
    }
    
    this.sdk.logger.debug('Headset Orchestration state change', { oldState: this.orchestrationState, newState: state });

    if (state === 'alternativeClient') {
      clearTimeout(this.orchestrationWaitTimer);
    }

    this.orchestrationState = state;
    this.headsetEventsSub.next({
      event: HeadsetEvents.deviceConnectionStatusChanged,
      payload: this.orchestrationState
    });
  }

  // this fn handles xmpp messages needed to orchestrate which client/instance gets to have headset controls
  private handleMediaMessage (msg: MediaMessageEvent) {
    if (!this.sdk._config.useHeadsets) {
      return;
    }

    // I cant think of a case where we would care to handle the message if it is an echo from this client
    if (msg.fromMyClient) {
      return;
    }
    
    switch(msg.mediaMessage.method) {
      case 'headsetControlsRequest':
        this.handleHeadsetControlsRequest(msg);
        break;
      case 'headsetControlsRejection':
        this.handleHeadsetControlsRejection(msg);
        break;
      case 'headsetControlsChanged':
        this.handleHeadsetControlsChanged(msg);
        break;
    }
  }

  private getRequestPriority (requestType: HeadsetRequestType | string | undefined): number {
    let priority = REQUEST_PRIORITY[requestType];
    if (!priority) {
      this.sdk.logger.warn('Unable to resolve requestType priority, defaulting to standard', { requestType });
      priority = REQUEST_PRIORITY.standard;
    }

    return priority;
  }

  // in all these handlers we need to handle if we are receiving the message during negotiation or during a headset connected state
  private handleHeadsetControlsRequest (msg: MediaMessageEvent) {
    const mediaMessage = msg.mediaMessage as HeadsetRequest;
    this.sdk.logger.debug('Received headsetControlsRequest message', { requestType: mediaMessage.params.requestType });

    // if incoming request is lower priority, reject
    if (this.getRequestPriority(mediaMessage.params.requestType) < this.getRequestPriority(this.sdk._config.headsetRequestType)) {
      this.sendControlsRejectionMessage(msg, this.sdk._config.headsetRequestType === 'mediaHelper' ? 'mediaHelper' : 'priority');
    }

    // if incoming request is same or higher priority
    if (this.getRequestPriority(mediaMessage.params.requestType) >= this.getRequestPriority(this.sdk._config.headsetRequestType)) {
      // we are in the negotiating state, we want to yield
      if (this.orchestrationState === 'negotiating') {
        this.sdk.logger.info('Yielding headset controls to requestor', { requestType: mediaMessage.params.requestType });
        this.setOrchestrationState('alternativeClient');

      // if we have persistent connection enabled and we have an active call, reject
      } else if (this.sdk.station?.webRtcPersistentEnabled && this.sdk.sessionManager.getAllActiveSessions().filter(s => s.sessionType === 'softphone').length) {
        this.sendControlsRejectionMessage(msg, 'activeCall');
      }
    }
  }

  private handleHeadsetControlsRejection (msg: MediaMessageEvent) {
    const mediaMessage = msg.mediaMessage as HeadsetRejection;

    if (this.orchestrationState === 'negotiating') {
      this.sdk.logger.info('Received headsetControlsRejection message', { reason: mediaMessage.params.reason });
      this.setOrchestrationState('alternativeClient');
    }
  }

  private handleHeadsetControlsChanged (msg: MediaMessageEvent) {
    const mediaMessage = msg.mediaMessage as HeadsetControlsChanged;

    const hasControlOrWaitingForControl = (['hasControls', 'negotiating'] as OrchestrationState[]).includes(this.orchestrationState);

    // if some other client has taken control, we yield
    if (mediaMessage.params.hasControls && hasControlOrWaitingForControl) {
      this.currentHeadsetService.updateAudioInputDevice(null);

      if (this.orchestrationState === 'hasControls') {
        this.sendControlsChangedMessage(false);
      }

      this.setOrchestrationState('alternativeClient');
    }
  }

  private sendControlsRejectionMessage (request: MediaMessageEvent, reason: HeadsetControlsRejectionReason) {
    this.sdk._streamingConnection.messenger.broadcastMessage({
      mediaMessage: {
        jsonrpc: '2.0',
        method: 'headsetControlsRejection',
        params: {
          requestId: request.id,
          reason
        }
      }
    });
  }

  private sendControlsChangedMessage (hasControls: boolean) {
    this.sdk._streamingConnection.messenger.broadcastMessage({
      mediaMessage: {
        jsonrpc: '2.0',
        method: 'headsetControlsChanged',
        params: {
          hasControls
        }
      }
    });
  }

  showRetry (): boolean {
    return this.currentHeadsetService.showRetry();
  }

  retryConnection (micDeviceLabel: string): Promise<void> {
    return this.currentHeadsetService.retryConnection(micDeviceLabel);
  }

  setRinging (callInfo: { conversationId: string, contactName?: string }, hasOtherActiveCalls: boolean): Promise<void> {
    return this.currentHeadsetService.setRinging(callInfo, hasOtherActiveCalls);
  }

  outgoingCall (callInfo: { conversationId: string, contactName: string }): Promise<void> {
    return this.currentHeadsetService.outgoingCall(callInfo);
  }

  endCurrentCall (conversationId: string): Promise<void> {
    return this.currentHeadsetService.endCurrentCall(conversationId);
  }

  endAllCalls (): Promise<void> {
    return this.currentHeadsetService.endAllCalls();
  }
  
  answerIncomingCall (conversationId: string, autoAnswer: boolean): Promise<void> {
    return this.currentHeadsetService.answerIncomingCall(conversationId, autoAnswer);
  }

  rejectIncomingCall (conversationId: string): Promise<void> {
    return this.currentHeadsetService.rejectIncomingCall(conversationId);
  }

  setMute (isMuted: boolean): Promise<void> {
    return this.currentHeadsetService.setMute(isMuted);
  }

  setHold (conversationId: string, isHeld: boolean): Promise<void> {
    return this.currentHeadsetService.setHold(conversationId, isHeld);
  }
}