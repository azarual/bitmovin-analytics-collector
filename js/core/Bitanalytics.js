/**
 * Created by lkroepfl on 13.09.2016.
 */

global.bitmovin.analytics = function(config) {
  var licenseCall    = new LicenseCall();
  var analyticsCall  = new AnalyticsCall();
  var utils          = new Utils();
  var logger         = new Logger();
  var adapterFactory = new AdapterFactory();
  var adapter;
  var analyticsStateMachine;

  var PageLoadType = {
    FOREGROUND: 1,
    BACKGROUND: 2
  };

  var droppedSampleFrames = 0;

  var licensing                    = 'waiting';
  var LICENSE_CALL_PENDING_TIMEOUT = 200;
  var PAGE_LOAD_TYPE_TIMEOUT       = 200;

  var sample;
  var startupTime  = 0;
  var pageLoadType = PageLoadType.FOREGROUND;

  window.setTimeout(function() {
    if (document[utils.getHiddenProp()] === true) {
      pageLoadType = PageLoadType.BACKGROUND;
    }
  }, PAGE_LOAD_TYPE_TIMEOUT);

  setupSample();
  init();

  function init() {
    if (config.key == '' || !utils.validString(config.key)) {
      console.error('Invalid analytics license key provided');
      return;
    }

    logger.setLogging(config.debug || false);

    checkLicensing(config.key);

    sample.key          = config.key;
    sample.playerKey    = config.playerKey;
    sample.player       = config.player;
    sample.cdnProvider  = config.cdnProvider;
    sample.videoId      = config.videoId;
    sample.customUserId = config.userId;

    sample.customData1 = utils.getCustomDataString(config.customData1);
    sample.customData2 = utils.getCustomDataString(config.customData2);
    sample.customData3 = utils.getCustomDataString(config.customData3);
    sample.customData4 = utils.getCustomDataString(config.customData4);
    sample.customData5 = utils.getCustomDataString(config.customData5);

    sample.experimentName = config.experimentName;

    var userId = utils.getCookie('bitmovin_analytics_uuid');
    if (userId == '') {
      document.cookie = 'bitmovin_analytics_uuid=' + utils.generateUUID();
      sample.userId   = utils.getCookie('bitmovin_analytics_uuid');
    }
    else {
      sample.userId = userId;
    }
  }

  var register = function(player) {
    adapter = adapterFactory.getAdapter(player);

    if (adapter) {
      adapter.setEventCallback(record);
    } else {
      logger.error('Could not detect player.');
    }
  };

  function record(eventType, eventObject) {
    eventObject = eventObject || {};

    analyticsStateMachine.callEvent(eventType, eventObject, utils.getCurrentTimestamp());
  }

  var stateMachineCallbacks = {
    setup: function(time, state, event) {
      sample.impressionId = utils.generateUUID();
      setDuration(time);
      setState(state);
      sample.playerStartupTime = time;
      sample.pageLoadType      = pageLoadType;

      if (window.performance && window.performance.timing) {
        var loadTime        = utils.getCurrentTimestamp() - window.performance.timing.navigationStart;
        sample.pageLoadTime = loadTime;
        logger.log('Page loaded in ' + loadTime);
      }

      startupTime = time;

      setPlaybackSettingsFromLoadedEvent(event);

      sendAnalyticsRequestAndClearValues();

      sample.pageLoadType = pageLoadType;
      sample.pageLoadTime = 0;
    },

    ready: utils.noOp,

    startup: function(time, state) {
      setDuration(time);
      sample.videoStartupTime = time;
      setState(state);

      startupTime += time;
      sample.startupTime = startupTime;

      sendAnalyticsRequestAndClearValues();
    },

    playing: function(time, state, event) {
      setDuration(time);
      setState(state);
      sample.played = time;

      setDroppedFrames(event);

      sendAnalyticsRequestAndClearValues();
    },

    playingAndBye: function(time, state, event) {
      setDuration(time);
      setState(state);
      sample.played = time;

      setDroppedFrames(event);

      sendUnloadRequest();
    },

    heartbeat: function(time, state, event) {
      setDroppedFrames(event);
      setState(state);
      setDuration(time);

      sample.played = sample.duration;

      sendAnalyticsRequestAndClearValues();
    },

    qualitychange: function(time, state) {
      setDuration(time);
      setState(state);

      sendAnalyticsRequestAndClearValues();
    },

    'qualitychange_pause': function(time, state) {
      setDuration(time);
      setState(state);

      sendAnalyticsRequestAndClearValues();
    },

    videoChange: function(event) {
      this.setVideoTimeEndFromEvent(event);
      this.setVideoTimeStartFromEvent(event);
      setPlaybackVideoPropertiesFromEvent(event);
    },

    audioChange: function(event) {
      this.setVideoTimeEndFromEvent(event);
      this.setVideoTimeStartFromEvent(event);
      sample.audioBitrate = event.bitrate;
    },

    pause: function(time, state, event) {
      setDuration(time);
      setState(state);

      sample.paused = time;

      sendAnalyticsRequestAndClearValues();
    },

    'paused_seeking': function(time, state, event) {
      setDuration(time);
      setState(state);

      sample.seeked = time;

      sendAnalyticsRequestAndClearValues();
    },

    'play_seeking': utils.noOp,

    'end_play_seeking': function(time, state, event) {
      setState(state);
      setDuration(time);

      sample.seeked = time;

      sendAnalyticsRequestAndClearValues();
    },

    rebuffering: function(time, state, event) {
      setDuration(time);
      setState(state);

      sample.buffered = time;

      sendAnalyticsRequestAndClearValues();
    },

    error: function(event) {
      this.setVideoTimeEndFromEvent(event);
      this.setVideoTimeStartFromEvent(event);

      sample.errorCode    = event.code;
      sample.errorMessage = event.message;

      sendAnalyticsRequestAndClearValues();

      delete sample.errorCode;
      delete sample.errorMessage;
    },

    setVideoTimeEndFromEvent: function(event) {
      if (utils.validNumber(event.currentTime)) {
        sample.videoTimeEnd = utils.calculateTime(event.currentTime);
      }
    },

    setVideoTimeStartFromEvent: function(event) {
      if (utils.validNumber(event.currentTime)) {
        sample.videoTimeStart = utils.calculateTime(event.currentTime);
      }
    }
  };

  analyticsStateMachine = new AnalyticsStateMachine(logger, stateMachineCallbacks);

  function setDuration(duration) {
    sample.duration = duration;
  }

  function setState(state) {
    sample.state = state;
  }

  function setPlaybackVideoPropertiesFromEvent(event) {
    if (utils.validNumber(event.width)) {
      sample.videoPlaybackWidth = event.width;
    }
    if (utils.validNumber(event.height)) {
      sample.videoPlaybackHeight = event.height;
    }
    if (utils.validNumber(event.bitrate)) {
      sample.videoBitrate = event.bitrate;
    }
  }

  function setDroppedFrames(event) {
    if (utils.validNumber(event.droppedFrames)) {
      sample.droppedFrames = getDroppedFrames(event.droppedFrames);
    }
  }

  function setPlaybackSettingsFromLoadedEvent(loadedEvent) {
    if (utils.validBoolean(loadedEvent.isLive)) {
      sample.isLive = loadedEvent.isLive;
    }
    if (utils.validString(loadedEvent.version)) {
      sample.version = sample.player + '-' + loadedEvent.version;
    }
    if (utils.validString(loadedEvent.type)) {
      sample.playerTech = loadedEvent.type;
    }
    if (utils.validNumber(loadedEvent.duration)) {
      sample.videoDuration = utils.calculateTime(loadedEvent.duration);
    }
    if (utils.validString(loadedEvent.streamType)) {
      sample.streamFormat = loadedEvent.streamType;
    }
    if (utils.validString(loadedEvent.mpdUrl)) {
      sample.mpdUrl = loadedEvent.mpdUrl;
    }
    if (utils.validString(loadedEvent.m3u8Url)) {
      sample.m3u8Url = loadedEvent.m3u8Url;
    }
    if (utils.validString(loadedEvent.progUrl)) {
      sample.progUrl = loadedEvent.progUrl;
    }
    if (loadedEvent.figure) {
      sample.videoWindowWidth  = loadedEvent.figure.offsetWidth;
      sample.videoWindowHeight = loadedEvent.figure.offsetHeight;
    }
  }

  function setupSample() {
    sample = {
      domain             : utils.sanitizePath(window.location.hostname),
      path               : utils.sanitizePath(window.location.pathname),
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

  function checkLicensing(key) {
    licenseCall.sendRequest(key, sample.domain, sample.analyticsVersion, handleLicensingResponse);
  }

  function handleLicensingResponse(licensingResponse) {
    if (licensingResponse.status === 'granted') {
      licensing = 'granted';
    } else {
      licensing = 'denied';
    }
  }

  function sendAnalyticsRequest() {
    if (licensing === 'denied') {
      return;
    }

    if (licensing === 'granted') {
      sample.time = utils.getCurrentTimestamp();
      analyticsCall.sendRequest(sample, utils.noOp);
    } else if (licensing === 'waiting') {
      sample.time = utils.getCurrentTimestamp();

      logger.log('Licensing callback still pending, waiting...');

      var copySample = {};
      clone(sample, copySample);

      window.setTimeout(function() {
        analyticsCall.sendRequest(copySample, utils.noOp);
      }, LICENSE_CALL_PENDING_TIMEOUT);
    }
  }

  function sendAnalyticsRequestAndClearValues() {
    sendAnalyticsRequest();
    clearValues();
  }

  function clone(firstObject, secondObject) {
    for (var prop in firstObject) {
      if (firstObject.hasOwnProperty(prop)) {
        secondObject[prop] = firstObject[prop];
      }
    }
  }

  function sendUnloadRequest() {
    if (licensing === 'denied') {
      return;
    }

    if (typeof navigator.sendBeacon === 'undefined') {
      sendAnalyticsRequestSynchronous();
    }
    else {
      var success = navigator.sendBeacon(analyticsCall.getAnalyticsServerUrl() + '/analytics', JSON.stringify(sample));
      if (!success) {
        sendAnalyticsRequestSynchronous();
      }
    }
  }

  function sendAnalyticsRequestSynchronous() {
    if (licensing === 'denied') {
      return;
    }

    analyticsCall.sendRequestSynchronous(sample, utils.noOp);
  }

  function clearValues() {
    sample.ad       = 0;
    sample.paused   = 0;
    sample.played   = 0;
    sample.seeked   = 0;
    sample.buffered = 0;

    sample.playerStartupTime = 0;
    sample.videoStartupTime  = 0;
    sample.startupTime       = 0;

    sample.duration      = 0;
    sample.droppedFrames = 0;
    sample.pageLoadType  = 0;
  }

  function getDroppedFrames(frames) {
    if (frames != undefined && frames != 0) {
      var droppedFrames   = frames - droppedSampleFrames;
      droppedSampleFrames = frames;
      return droppedFrames;
    }
    else {
      return 0;
    }
  }

  return {register: register};
};
