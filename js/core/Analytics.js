/**
 * Created by lkroepfl on 13.09.2016.
 */

import LicenseCall from '../utils/LicenseCall';
import AnalyticsCall from '../utils/AnalyticsCall';
import Utils from '../utils/Utils';
import Logger from '../utils/Logger';
import AdapterFactory from './AdapterFactory'
import AnalyticsStateMachineFactory from './AnalyticsStateMachineFactory'

class Analytics {
  static PageLoadType = {
    FOREGROUND: 1,
    BACKGROUND: 2
  };
  static LICENSE_CALL_PENDING_TIMEOUT = 200;
  static PAGE_LOAD_TYPE_TIMEOUT       = 200;

  constructor(config) {
    this.config = config;

    this.licenseCall                  = new LicenseCall();
    this.analyticsCall                = new AnalyticsCall();
    this.utils                        = new Utils();
    this.logger                       = new Logger();
    this.adapterFactory               = new AdapterFactory();
    this.analyticsStateMachineFactory = new AnalyticsStateMachineFactory();

    this.droppedSampleFrames = 0;
    this.licensing           = 'waiting';
    this.startupTime         = 0;
    this.pageLoadType        = Analytics.PageLoadType.FOREGROUND;

    this.setPageLoadType();

    this.setupSample();
    this.init();
    this.setupStateMachineCallbacks();
  }

  setPageLoadType() {
    window.setTimeout(() => {
      if (document[this.utils.getHiddenProp()] === true) {
        this.pageLoadType = Analytics.PageLoadType.BACKGROUND;
      }
    }, Analytics.PAGE_LOAD_TYPE_TIMEOUT);
  }

  init() {
    if (this.config.key == '' || !this.utils.validString(this.config.key)) {
      console.error('Invalid analytics license key provided');
      return;
    }

    this.logger.setLogging(this.config.debug || false);

    this.checkLicensing(this.config.key);

    this.setConfigParameters();

    this.setUserId();
  }

  setConfigParameters() {
    this.sample.key          = this.config.key;
    this.sample.playerKey    = this.config.playerKey;
    this.sample.player       = this.config.player;
    this.sample.cdnProvider  = this.config.cdnProvider;
    this.sample.videoId      = this.config.videoId;
    this.sample.customUserId = this.config.userId;

    this.sample.customData1 = this.utils.getCustomDataString(this.config.customData1);
    this.sample.customData2 = this.utils.getCustomDataString(this.config.customData2);
    this.sample.customData3 = this.utils.getCustomDataString(this.config.customData3);
    this.sample.customData4 = this.utils.getCustomDataString(this.config.customData4);
    this.sample.customData5 = this.utils.getCustomDataString(this.config.customData5);

    this.sample.experimentName = this.config.experimentName;
  }

  setUserId() {
    const userId = this.utils.getCookie('bitmovin_analytics_uuid');
    if (!userId || userId === '') {
      document.cookie = 'bitmovin_analytics_uuid=' + this.utils.generateUUID();
      this.sample.userId   = this.utils.getCookie('bitmovin_analytics_uuid');
    } else {
      this.sample.userId = userId;
    }
  }

  setupStateMachineCallbacks() {
    this.stateMachineCallbacks = {
      setup: (time, state, event) => {
        this.sample.impressionId = this.utils.generateUUID();
        this.setDuration(time);
        this.setState(state);
        this.sample.playerStartupTime = time;
        this.sample.pageLoadType      = this.pageLoadType;

        if (window.performance && window.performance.timing) {
          const loadTime           = this.utils.getCurrentTimestamp() - window.performance.timing.navigationStart;
          this.sample.pageLoadTime = loadTime;
          this.logger.log('Page loaded in ' + loadTime);
        }

        this.startupTime = time;

        this.setPlaybackSettingsFromLoadedEvent(event);

        this.sendAnalyticsRequestAndClearValues();

        this.sample.pageLoadType = this.pageLoadType;
        this.sample.pageLoadTime = 0;
      },

      ready: this.utils.noOp,

      startup: (time, state) => {
        this.setDuration(time);
        this.sample.videoStartupTime = time;
        this.setState(state);

        this.startupTime += time;
        this.sample.startupTime = this.startupTime;

        this.sendAnalyticsRequestAndClearValues();
      },

      playing: (time, state, event) => {
        this.setDuration(time);
        this.setState(state);
        this.sample.played = time;

        this.setDroppedFrames(event);

        this.sendAnalyticsRequestAndClearValues();
      },

      playingAndBye: (time, state, event) => {
        this.setDuration(time);
        this.setState(state);
        this.sample.played = time;

        this.setDroppedFrames(event);

        this.sendUnloadRequest();
      },

      heartbeat: (time, state, event) => {
        this.setDroppedFrames(event);
        this.setState(state);
        this.setDuration(time);

        this.sample.played = this.sample.duration;

        this.sendAnalyticsRequestAndClearValues();
      },

      qualitychange: (time, state) => {
        this.setDuration(time);
        this.setState(state);

        this.sendAnalyticsRequestAndClearValues();
      },

      'qualitychange_pause': (time, state) => {
        this.setDuration(time);
        this.setState(state);

        this.sendAnalyticsRequestAndClearValues();
      },

      videoChange: (event) => {
        this.stateMachineCallbacks.setVideoTimeEndFromEvent(event);
        this.stateMachineCallbacks.setVideoTimeStartFromEvent(event);
        this.setPlaybackVideoPropertiesFromEvent(event);
      },

      audioChange: (event) => {
        this.stateMachineCallbacks.setVideoTimeEndFromEvent(event);
        this.stateMachineCallbacks.setVideoTimeStartFromEvent(event);
        this.sample.audioBitrate = event.bitrate;
      },

      pause: (time, state, event) => {
        this.setDuration(time);
        this.setState(state);

        this.sample.paused = time;

        this.sendAnalyticsRequestAndClearValues();
      },

      'paused_seeking': (time, state, event) => {
        this.setDuration(time);
        this.setState(state);

        this.sample.seeked = time;

        this.sendAnalyticsRequestAndClearValues();
      },

      'play_seeking': this.utils.noOp,

      'end_play_seeking': (time, state, event) => {
        this.setState(state);
        this.setDuration(time);

        this.sample.seeked = time;

        this.sendAnalyticsRequestAndClearValues();
      },

      rebuffering: (time, state, event) => {
        this.setDuration(time);
        this.setState(state);

        this.sample.buffered = time;

        this.sendAnalyticsRequestAndClearValues();
      },

      error: (event) => {
        this.setVideoTimeEndFromEvent(event);
        this.setVideoTimeStartFromEvent(event);

        this.sample.errorCode    = event.code;
        this.sample.errorMessage = event.message;

        this.sendAnalyticsRequestAndClearValues();

        delete this.sample.errorCode;
        delete this.sample.errorMessage;
      },

      end: (time, state, event) => {
        this.sample.impressionId = this.utils.generateUUID();
      },

      ad: (time, state, event) => {
        this.setDuration(time);
        this.setState(state);
        this.sample.ad = time;

        this.setDroppedFrames(event);

        this.sendAnalyticsRequestAndClearValues();
      },

      setVideoTimeEndFromEvent: (event) => {
        if (this.utils.validNumber(event.currentTime)) {
          this.sample.videoTimeEnd = this.utils.calculateTime(event.currentTime);
        }
      },

      setVideoTimeStartFromEvent: (event) => {
        if (this.utils.validNumber(event.currentTime)) {
          this.sample.videoTimeStart = this.utils.calculateTime(event.currentTime);
        }
      }
    };
  }

  register = (player) => {
    this.adapter = this.adapterFactory.getAdapter(player, this.record);
    if (!this.adapter) {
      this.logger.error('Could not detect player.');
      return;
    }

    this.analyticsStateMachine = this.analyticsStateMachineFactory.getAnalyticsStateMachine(player, this.stateMachineCallbacks, this.logger.isLogging());
  };

  record = (eventType, eventObject) => {
    eventObject = eventObject || {};

    this.analyticsStateMachine.callEvent(eventType, eventObject, this.utils.getCurrentTimestamp());
  };

  setDuration(duration) {
    this.sample.duration = duration;
  }

  setState(state) {
    this.sample.state = state;
  }

  setPlaybackVideoPropertiesFromEvent(event) {
    if (this.utils.validNumber(event.width)) {
      this.sample.videoPlaybackWidth = event.width;
    }
    if (this.utils.validNumber(event.height)) {
      this.sample.videoPlaybackHeight = event.height;
    }
    if (this.utils.validNumber(event.bitrate)) {
      this.sample.videoBitrate = event.bitrate;
    }
  }

  setDroppedFrames = (event) => {
    if (this.utils.validNumber(event.droppedFrames)) {
      this.sample.droppedFrames = this.getDroppedFrames(event.droppedFrames);
    }
  };

  setPlaybackSettingsFromLoadedEvent(loadedEvent) {
    if (this.utils.validBoolean(loadedEvent.isLive)) {
      this.sample.isLive = loadedEvent.isLive;
    }
    if (this.utils.validString(loadedEvent.version)) {
      this.sample.version = this.sample.player + '-' + loadedEvent.version;
    }
    if (this.utils.validString(loadedEvent.type)) {
      this.sample.playerTech = loadedEvent.type;
    }
    if (this.utils.validNumber(loadedEvent.duration)) {
      this.sample.videoDuration = this.utils.calculateTime(loadedEvent.duration);
    }
    if (this.utils.validString(loadedEvent.streamType)) {
      this.sample.streamFormat = loadedEvent.streamType;
    }
    if (this.utils.validString(loadedEvent.mpdUrl)) {
      this.sample.mpdUrl = loadedEvent.mpdUrl;
    }
    if (this.utils.validString(loadedEvent.m3u8Url)) {
      this.sample.m3u8Url = loadedEvent.m3u8Url;
    }
    if (this.utils.validString(loadedEvent.progUrl)) {
      this.sample.progUrl = loadedEvent.progUrl;
    }
    if (this.utils.validNumber(loadedEvent.videoWindowWidth)) {
      this.sample.videoWindowWidth = loadedEvent.videoWindowWidth;
    }
    if (this.utils.validNumber(loadedEvent.videoWindowHeight)) {
      this.sample.videoWindowHeight = loadedEvent.videoWindowHeight;
    }
  }

  setupSample() {
    this.sample = {
      domain             : this.utils.sanitizePath(window.location.hostname),
      path               : this.utils.sanitizePath(window.location.pathname),
      language           : navigator.language || navigator.userLanguage,
      userAgent          : navigator.userAgent,
      screenWidth        : screen.width,
      screenHeight       : screen.height,
      isLive             : false,
      isCasting          : false,
      videoDuration      : 0,
      size               : 'WINDOW',
      time               : 0,
      videoWindowWidth   : 0,
      videoWindowHeight  : 0,
      droppedFrames      : 0,
      played             : 0,
      buffered           : 0,
      paused             : 0,
      ad                 : 0,
      seeked             : 0,
      videoPlaybackWidth : 0,
      videoPlaybackHeight: 0,
      videoBitrate       : 0,
      audioBitrate       : 0,
      videoTimeStart     : 0,
      videoTimeEnd       : 0,
      videoStartupTime   : 0,
      duration           : 0,
      startupTime        : 0,
      analyticsVersion   : '{{VERSION}}'
    };
  }

  checkLicensing(key) {
    this.licenseCall.sendRequest(key, this.sample.domain, this.sample.analyticsVersion, ::this.handleLicensingResponse);
  }

  handleLicensingResponse(licensingResponse) {
    if (licensingResponse.status === 'granted') {
      this.licensing = 'granted';
    } else {
      this.licensing = 'denied';
      this.logger.log('Analytics license denied, reason: ' + licensingResponse.message);
    }
  }

  sendAnalyticsRequest() {
    if (this.licensing === 'denied') {
      return;
    }

    if (this.licensing === 'granted') {
      this.sample.time = this.utils.getCurrentTimestamp();
      this.analyticsCall.sendRequest(this.sample, this.utils.noOp);
    } else if (this.licensing === 'waiting') {
      this.sample.time = this.utils.getCurrentTimestamp();

      this.logger.log('Licensing callback still pending, waiting...');

      const copySample = {...this.sample};

      window.setTimeout(() => {
        this.analyticsCall.sendRequest(copySample, this.utils.noOp);
      }, Analytics.LICENSE_CALL_PENDING_TIMEOUT);
    }
  }

  sendAnalyticsRequestAndClearValues() {
    this.sendAnalyticsRequest();
    this.clearValues();
  }

  sendUnloadRequest() {
    if (this.licensing === 'denied') {
      return;
    }

    if (typeof navigator.sendBeacon === 'undefined') {
      this.sendAnalyticsRequestSynchronous();
    }
    else {
      const success = navigator.sendBeacon(this.analyticsCall.getAnalyticsServerUrl() + '/analytics',
        JSON.stringify(this.sample));
      if (!success) {
        this.sendAnalyticsRequestSynchronous();
      }
    }
  }

  sendAnalyticsRequestSynchronous() {
    if (this.licensing === 'denied') {
      return;
    }

    this.analyticsCall.sendRequestSynchronous(this.sample, this.utils.noOp);
  }

  clearValues() {
    this.sample.ad       = 0;
    this.sample.paused   = 0;
    this.sample.played   = 0;
    this.sample.seeked   = 0;
    this.sample.buffered = 0;

    this.sample.playerStartupTime = 0;
    this.sample.videoStartupTime  = 0;
    this.sample.startupTime       = 0;

    this.sample.duration      = 0;
    this.sample.droppedFrames = 0;
    this.sample.pageLoadType  = 0;
  }

  getDroppedFrames(frames) {
    if (frames != undefined && frames != 0) {
      const droppedFrames = frames - this.droppedSampleFrames;
      this.droppedSampleFrames = frames;
      return droppedFrames;
    }
    else {
      return 0;
    }
  }
}

export default Analytics
