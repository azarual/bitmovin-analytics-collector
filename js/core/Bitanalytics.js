/**
 * Created by Bitmovin on 19.09.2016.
 *
 * Bitmovin analytics
 */

function BitAnalytics(containerId) {

  var licenseCall   = new LicenseCall();
  var analyticsCall = new AnalyticsCall();
  var utils         = new Utils();

  this.players      = Players;
  this.events       = Events;
  this.cdnProviders = CDNProviders;

  var droppedSampleFrames = 0;

  var licensing = 'waiting';
  var LICENSE_CALL_PENDING_TIMEOUT = 200;

  var sample;

  setupSample();

  this.init = function(config) {
    if (config.key == '' || !utils.validString(config.key)) {
      console.error('Invalid analytics license key provided');
      return;
    }

    checkLicensing(config.key);

    sample.key         = config.key;
    sample.playerKey   = config.playerKey;
    sample.player      = config.player;
    sample.cdnProvider = config.cdnProvider;

    var userId = utils.getCookie('bitmovin_analytics_uuid');
    if (userId == '') {
      document.cookie = 'bitmovin_analytics_uuid=' + utils.generateUUID();
      sample.userId   = utils.getCookie('bitmovin_analytics_uuid');
    }
    else {
      sample.userId = userId;
    }
  };

  this.record = function(eventType, eventObject) {
    eventObject = eventObject || {};

    var exec = AnalyticsStateMachine[eventType];

    try {
      if (exec) {
        exec.call(AnalyticsStateMachine, utils.getCurrentTimestamp(), eventObject, this);
      } else {
        console.log('Ignored Event: ', eventType);
      }
    } catch (e) {
      console.error(e);
    }
  };

  this.setup = function(time, state, event) {
    sample.impressionId = utils.generateUUID();
    setDuration(time);
    setState(state);
    sample.playerStartupTime = time;

    setPlaybackSettingsFromLoadedEvent(event);

    sendAnalyticsRequestAndClearValues();
  };

  this.ready = utils.noOp;

  this.startup = function(time, state) {
    setDuration(time);
    sample.videoStartupTime = time;
    setState(state);

    sendAnalyticsRequestAndClearValues();
  };

  this.playing = function(time, state, event) {
    setDuration(time);
    setState(state);
    sample.played = time;

    setDroppedFrames(event);

    sendAnalyticsRequestAndClearValues();
  };

  this.heartbeat = function(time, state, event) {
    setDroppedFrames(event);
    setState(state);
    setDuration(time);

    sample.played   = sample.duration;

    sendAnalyticsRequestAndClearValues();
  };

  this.qualitychange = function(time, state) {
    setDuration(time);
    setState(state);

    sendAnalyticsRequestAndClearValues();
  };

  this['qualitychange_pause'] = function(time, state) {
    setDuration(time);
    setState(state);

    sendAnalyticsRequestAndClearValues();
  };

  this.videoChange = function(event) {
    this.setVideoTimeEndFromEvent(event);
    this.setVideoTimeStartFromEvent(event);
    setPlaybackVideoPropertiesFromEvent(event);
  };

  this.audioChange = function(event) {
    this.setVideoTimeEndFromEvent(event);
    this.setVideoTimeStartFromEvent(event);
    sample.audioBitrate = event.bitrate;
  };

  this.pause = function(time, state, event) {
    setDuration(time);
    setState(state);

    sample.paused = time;

    sendAnalyticsRequestAndClearValues();
  };

  this['paused_seeking'] = function(time, state, event) {
    setDuration(time);
    setState(state);

    sample.seeked = time;

    sendAnalyticsRequestAndClearValues();
  };

  this['play_seeking'] = utils.noOp;

  this['end_play_seeking'] = function(time, state, event) {
    setState(state);
    setDuration(time);

    sample.seeked = time;

    sendAnalyticsRequestAndClearValues();
  };

  this.rebuffering = function(time, state, event) {
    setDuration(time);
    setState(state);

    sendAnalyticsRequestAndClearValues();
  };

  function setDuration(duration) {
    sample.duration = duration;
  }

  function setState(state) {
    sample.state = state;
  }

  this.setVideoTimeEndFromEvent = function(event) {
    if (utils.validNumber(event.currentTime)) {
      sample.videoTimeEnd = utils.calculateTime(event.currentTime);
    }
  };

  this.setVideoTimeStartFromEvent = function(event) {
    if (utils.validNumber(event.currentTime)) {
      sample.videoTimeStart = utils.calculateTime(event.currentTime);
    }
  };

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
    sample.videoWindowWidth  = document.getElementById(containerId).offsetWidth;
    sample.videoWindowHeight = document.getElementById(containerId).offsetHeight;

    if (utils.validBoolean(loadedEvent.isLive)) {
      sample.isLive = loadedEvent.isLive;
    }
    if (utils.validString(loadedEvent.version)) {
      sample.version = loadedEvent.version;
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
    if (utils.validString(loadedEvent.videoId)) {
      sample.videoId = loadedEvent.videoId;
    }
    if (utils.validString(loadedEvent.userId)) {
      sample.customUserId = loadedEvent.userId;
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
  }

  function setupSample() {
    sample = {
      domain             : utils.sanitizePath(window.location.hostname),
      path               : utils.sanitizePath(window.location.pathname),
      language           : navigator.language || navigator.userLanguage,
      playerTech         : 'unknown',
      userAgent          : navigator.userAgent,
      screenWidth        : screen.width,
      screenHeight       : screen.height,
      streamFormat       : 'unknown',
      version            : 'unknown',
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
      analyticsVersion   : getAnalyticsVersion()
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

  function getAnalyticsVersion() {
    return '0.4.0';
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

      console.log('waiting...');

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
    if (typeof navigator.sendBeacon === 'undefined') {
      sendAnalyticsRequestSynchronous();
    }
    else {
      var success = navigator.sendBeacon(analyticsBackend + '/analytics', JSON.stringify(sample));
      if (!success) {
        sendAnalyticsRequestSynchronous();
      }
    }
  }

  function sendAnalyticsRequestSynchronous() {
    if (!licensing) {
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

    sample.duration      = 0;
    sample.droppedFrames = 0;
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
}
