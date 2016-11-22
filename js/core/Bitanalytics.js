/**
 * Created by Bitmovin on 19.09.2016.
 *
 * Bitmovin analytics
 */

function BitAnalytics(videoId) {

  var licenseCall   = new LicenseCall();
  var analyticsCall = new AnalyticsCall();
  var utils         = new Utils();

  var initTime    = 0;
  var containerId = videoId;

  this.players = Players;
  this.events  = Events;

  var firstSample             = true;
  var skipVideoPlaybackChange = true;
  var skipAudioPlaybackChange = true;

  var droppedSampleFrames = 0;

  var initAdTime   = 0;
  var initPlayTime = 0;
  var initSeekTime = 0;

  var states = {
    SETUP: 'setup',
    LOADED: 'loaded',
    READY: 'ready',
    PLAY: 'play',
    PLAYING: 'playing',
    PAUSED: 'paused',
    BUFFERING: 'buffering',
    BUFFERED: 'buffered',
    SEEKING: 'seeking',
    SEEKED: 'seeked',
    ENDED: 'ended',
    FULLSCREEN: 'fullscreen',
    WINDOW: 'window'
  };

  var state = states.SETUP;
  var stateWas;

  var wasSeeking = false;

  var granted  = false;
  var debug    = false;

  var lastSampleTimestamp;

  var sample;

  setupSample();

  this.init = function(config) {
    if (config.key == '' || !utils.validString(config.key)) {
      console.error('Invalid analytics license key provided');
      return;
    }

    checkLicensing(config.key);

    initTime = new Date().getTime();

    sample.key       = config.key;
    sample.playerKey = config.playerKey;
    sample.player    = config.player;

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

    switch (eventType) {
      case this.events.SOURCE_LOADED:
        sample.impressionId = utils.generateUUID();
        setState(states.LOADED);
        break;

      case this.events.READY:
        handleStatusChange(state, states.READY, eventObject);
        break;

      case this.events.PLAY:
        handleStatusChange(state, states.PLAY, eventObject);
        break;

      case this.events.PAUSE:
        handleStatusChange(state, states.PAUSED, eventObject);
        break;

      case this.events.TIMECHANGED:
        playerFiredTimeChanged(eventObject);
        break;

      case this.events.SEEK:
        playerFiredSeek(eventObject);
        break;

      case this.events.SEEKED:
        playerFiredSeeked(eventType, eventObject);
        break;

      case this.events.START_BUFFERING:
        handleStatusChange(state, states.BUFFERING, eventObject);
        break;

      case this.events.END_BUFFERING:
        playerFiredEndBuffering(eventType, eventObject);
        break;

      case this.events.AUDIO_CHANGE:
        playerFiredAudioChange(eventObject);
        break;

      case this.events.VIDEO_CHANGE:
        playerFiredVideoChange(eventObject);
        break;

      case this.events.START_FULLSCREEN:
        handleStatusChange(state, states.FULLSCREEN, eventObject);
        break;

      case this.events.END_FULLSCREEN:
        handleStatusChange(state, states.WINDOW, eventObject);
        break;

      case this.events.START_AD:
        playerFiredStartAd(eventType, eventObject);
        break;

      case this.events.END_AD:
        playerFiredEndAd(eventType, eventObject);
        break;

      case this.events.ERROR:
        playerFiredError(eventType, eventObject);
        break;

      case this.events.PLAYBACK_FINISHED:
        playerFiredPlaybackFinished(eventObject);
        break;

      case this.events.UNLOAD:
        playerFiredUnload(eventObject);
        break;

      case this.events.START_CAST:
        sample.isCasting = true;
        break;

      case this.events.END_CAST:
        sample.isCasting = false;
        break;

      default:
        break;
    }
  };

  function playerFiredTimeChanged(event) {
    if (firstSample) {
      handleStatusChange(state, states.PLAYING, event);
      firstSample = false;
      return;
    }

    handleStatusChange(state, states.PLAYING, event);
  }

  function playerFiredSeek(event) {
    handleStatusChange(state, states.SEEKING, event);
  }

  function playerFiredSeeked(eventType, event) {
    if (state !== states.SEEKING) {
      return;
    }

    sample.duration = utils.getDurationFromTimestampToNow(initSeekTime);
    sample.seeked   = sample.duration;

    wasSeeking = true;
  }

  function playerFiredEndBuffering(eventType, event) {
    if (state !== states.BUFFERING) {
      return;
    }

    handleStatusChange(state, states.BUFFERED, event);
  }

  function playerFiredAudioChange(event) {
    if (skipAudioPlaybackChange) {
      if (utils.validNumber(event.bitrate)) {
        sample.audioBitrate = event.bitrate;
      }

      skipAudioPlaybackChange = false;
      return;
    }

    if (state === states.SEEKING) {
      return;
    }

    setVideoTimeEndFromEvent(event);
    setDroppedFrames(event);

    sample.duration = getTimeSinceLastSampleTimestamp();
    sample.played   = sample.duration;

    sendAnalyticsRequest(state);
    clearValues();

    if (utils.validNumber(event.bitrate)) {
      sample.audioBitrate = event.bitrate;
    }

    setVideoTimeStartFromEvent(event);
  }

  function playerFiredVideoChange(event) {
    if (skipVideoPlaybackChange) {
      setPlaybackVideoPropertiesFromEvent(event);
      skipVideoPlaybackChange = false;
      return;
    }

    if (state !== states.PLAYING) {
      return;
    }

    setVideoTimeEndFromEvent(event);
    setDroppedFrames(event);

    sample.duration = getTimeSinceLastSampleTimestamp();
    sample.played   = sample.duration;

    sendAnalyticsRequest(state);
    clearValues();

    setPlaybackVideoPropertiesFromEvent(event);
    setVideoTimeStartFromEvent(event);
  }

  function playerFiredStartAd(eventType, event) {
    sample.duration = getTimeSinceLastSampleTimestamp();

    setVideoTimeEndFromEvent(event);
    setDroppedFrames(event);

    sendAnalyticsRequest(String(eventType));
    clearValues();

    initAdTime = utils.getCurrentTimestamp();
    setVideoTimeStartFromEvent(event);
  }

  function playerFiredEndAd(eventType, event) {
    var now         = utils.getCurrentTimestamp();
    sample.ad       = now - initAdTime;
    sample.duration = now - initAdTime;

    setVideoTimeEndFromEvent(event);
    setDroppedFrames(event);

    sendAnalyticsRequest(String(eventType));
    clearValues();

    setVideoTimeEndFromEvent(event);
  }

  function playerFiredError(eventType, event) {
    setDroppedFrames(event);
    setVideoTimeEndFromEvent(event);

    sendAnalyticsRequest(String(eventType));
    clearValues();

    if (utils.validNumber(event.code)) {
      sample.errorCode = event.code;
    }
    if (utils.validString(event.message)) {
      sample.errorMessage = event.message;
    }

    setVideoTimeEndFromEvent(event);
    setVideoTimeStartFromEvent(event);
    setDroppedFrames(event);

    sendAnalyticsRequest(String(eventType));
    clearValues();

    delete sample.errorCode;
    delete sample.errorMessage;
  }

  function playerFiredPlaybackFinished(event) {
    firstSample = true;
    handleStatusChange(state, states.ENDED, event);
  }

  function playerFiredUnload(event) {
    if (utils.validNumber(event.droppedFrames)) {
      sample.droppedFrames = getDroppedFrames(event.droppedFrames);
    }

    sample.duration = getTimeSinceLastSampleTimestamp();
    setVideoTimeEndFromEvent(event);

    sendUnloadRequest();
    clearValues();
  }

  function handleStatusChange(statusWas, statusNew, event) {
    if (statusWas === states.LOADED) {
      handleStatusChangeFromLoaded(statusNew, event);
      return;
    }

    if (statusWas === states.READY) {
      handleStatusChangeFromReady(statusNew, event);
      return;
    }

    if (statusWas === states.PLAY) {
      handleStatusChangeFromPlay(statusNew, event);
      return;
    }

    if (statusWas === states.PLAYING) {
      handleStatusChangeFromPlaying(statusNew, event);
      return;
    }

    if (statusWas === states.ENDED) {
      handleStatusChangeFromEnded(statusNew, event);
      return;
    }

    if (statusWas === states.PAUSED) {
      handleStatusChangeFromPaused(statusNew, event);
      return;
    }

    if (statusWas === states.BUFFERING) {
      handleStatusChangeFromBuffering(statusNew, event);
      return;
    }

    if (statusWas === states.SEEKING) {
      handleStatusChangeFromSeeking(statusNew, event);
      return;
    }

    if (statusWas === states.BUFFERED) {
      handleStatusChangeFromBuffered(statusNew, event);
      return;
    }
  }

  function handleStatusChangeFromLoaded(statusNew, event) {
    var newStatusWas = states.LOADED;

    if (statusNew === states.READY) {
      sample.playerStartupTime = utils.getDurationFromTimestampToNow(initTime);

      sample.videoWindowWidth  = document.getElementById(containerId).offsetWidth;
      sample.videoWindowHeight = document.getElementById(containerId).offsetHeight;

      setPlaybackSettingsFromLoadedEvent(event);

      sendAnalyticsRequest(newStatusWas);
      clearValues();

      setStateWas(newStatusWas);
      setState(statusNew);
      return;
    }
  }

  function handleStatusChangeFromReady(statusNew, event) {
    var newStatusWas = states.READY;

    if (statusNew === states.PLAY) {
      initPlayTime = utils.getCurrentTimestamp();

      setStateWas(newStatusWas);
      setState(statusNew);
      return;
    }
  }

  function handleStatusChangeFromPlay(statusNew, event) {
    var newStatusWas = states.PLAY;

    if (statusNew === states.PLAYING) {
      if (firstSample) {
        sample.videoStartupTime = utils.getDurationFromTimestampToNow(initPlayTime);
        firstSample             = false;
      }

      sendAnalyticsRequest(newStatusWas);
      clearValues();

      setStateWas(newStatusWas);
      setState(statusNew);
      return;
    }

    if (statusNew === states.BUFFERING) {
      setVideoTimeEndFromEvent(event);
      setDroppedFrames(event);

      sample.duration = getTimeSinceLastSampleTimestamp();

      sendAnalyticsRequest(newStatusWas);
      clearValues();
      setVideoTimeStartFromEvent(event);

      setStateWas(newStatusWas);
      setState(statusNew);
      return;
    }
  }

  function handleStatusChangeFromPlaying(statusNew, event) {
    var newStatusWas = states.PLAYING;

    if (statusNew === states.PAUSED) {
      sample.duration = getTimeSinceLastSampleTimestamp();
      sample.played   = sample.duration;

      setVideoTimeEndFromEvent(event);
      setDroppedFrames(event);

      sendAnalyticsRequest(newStatusWas);

      clearValues();
      setVideoTimeStartFromEvent(event);

      setStateWas(newStatusWas);
      setState(statusNew);
      return;
    }

    if (statusNew === states.PLAYING) {
      sendHeartBeatIfRequired(event);
      return;
    }

    if (statusNew === states.FULLSCREEN) {
      sample.duration = getTimeSinceLastSampleTimestamp();
      sample.played   = sample.duration;

      setVideoTimeEndFromEvent(event);
      setDroppedFrames(event);

      sendAnalyticsRequest(newStatusWas);
      clearValues();

      sample.size = 'FULLSCREEN';
      setVideoTimeStartFromEvent(event);
      return;
    }

    if (statusNew === states.WINDOW) {
      sample.duration = getTimeSinceLastSampleTimestamp();
      sample.played   = sample.duration;

      setVideoTimeEndFromEvent(event);
      setDroppedFrames(event);

      sendAnalyticsRequest(newStatusWas);
      clearValues();

      sample.size = 'WINDOW';
      setVideoTimeStartFromEvent(event);
      return;
    }

    if (statusNew === states.ENDED) {
      sample.videoTimeEnd = sample.videoDuration;
      sample.duration = getTimeSinceLastSampleTimestamp();
      sample.played   = sample.duration;

      setDroppedFrames(event);

      sendAnalyticsRequest(newStatusWas);
      return;
    }
  }

  function handleStatusChangeFromEnded(statusNew, event) {
    var newStatusWas = states.ENDED;

    if (statusNew === states.PLAY) {
      sample.impressionId = utils.generateUUID();
      initTime            = utils.getCurrentTimestamp();

      clearValues();
      sendAnalyticsRequest(newStatusWas);

      setStateWas(newStatusWas);
      setState(statusNew);
      return;
    }
  }

  function handleStatusChangeFromPaused(statusNew, event) {
    var newStatusWas = states.PAUSED;

    if (statusNew === states.PLAYING) {
      var timeSinceLastSampleTimestamp = getTimeSinceLastSampleTimestamp();
      if (wasSeeking) {
        sample.seeked = timeSinceLastSampleTimestamp;
        wasSeeking    = false;
      } else {
        sample.paused = timeSinceLastSampleTimestamp;
      }

      sample.duration = timeSinceLastSampleTimestamp;

      setVideoTimeEndFromEvent(event);

      sendAnalyticsRequest(newStatusWas);
      clearValues();

      setVideoTimeStartFromEvent(event);

      setStateWas(newStatusWas);
      setState(statusNew);
      return;
    }

    if (statusNew === states.SEEKING) {
      initSeekTime = utils.getCurrentTimestamp();

      setStateWas(newStatusWas);
      setState(statusNew);
      return;
    }
  }

  function handleStatusChangeFromBuffering(statusNew, event) {
    var newStatusWas = states.BUFFERING;

    if (statusNew === states.PLAYING) {
      if (firstSample) {
        sample.videoStartupTime = utils.getDurationFromTimestampToNow(initPlayTime);
        firstSample             = false;
      }

      sample.duration = getTimeSinceLastSampleTimestamp();
      sample.buffered = sample.duration;

      setDroppedFrames(event);
      setVideoTimeStartFromEvent(event);
      setVideoTimeEndFromEvent(event);

      sendAnalyticsRequest(newStatusWas);
      clearValues();

      setVideoTimeStartFromEvent(event);

      setStateWas(newStatusWas);
      setState(statusNew);
      return;
    }

    if (statusNew === states.BUFFERED) {
      sample.buffered = getTimeSinceLastSampleTimestamp();
      sample.duration = sample.buffered;

      setVideoTimeEndFromEvent(event);
      setDroppedFrames(event);

      sendAnalyticsRequest(newStatusWas);
      clearValues();

      setVideoTimeStartFromEvent(event);
      setState(stateWas);
    }
  }

  function handleStatusChangeFromSeeking(statusNew, event) {
    var newStatusWas = states.SEEKING;

    if (statusNew === states.PLAYING) {
      setVideoTimeEndFromEvent(event);

      sendAnalyticsRequest(newStatusWas);
      clearValues();

      wasSeeking = false;
      setVideoTimeStartFromEvent(event);

      setStateWas(newStatusWas);
      setState(statusNew);
      return;
    }
  }

  function handleStatusChangeFromBuffered(statusNew, event) {
    var newStatusWas = states.BUFFERED;

    if (statusNew === states.PLAYING) {
      sample.buffered = getTimeSinceLastSampleTimestamp();

      sendAnalyticsRequest(newStatusWas);
      clearValues();
      wasSeeking = false;

      setStateWas(newStatusWas);
      setState(statusNew);
    }
  }

  function setStateWas(oldStatus) {
    stateWas = oldStatus;
  }

  function setState(newStatus) {
    state = newStatus;
  }

  function setVideoTimeEndFromEvent(event) {
    if (utils.validNumber(event.currentTime)) {
      sample.videoTimeEnd = utils.calculateTime(event.currentTime);
    }
  }

  function setVideoTimeStartFromEvent(event) {
    if (utils.validNumber(event.currentTime)) {
      sample.videoTimeStart = utils.calculateTime(event.currentTime);
    }
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
      granted = true;
    }
  }

  function sendHeartBeatIfRequired(event) {
    var timeSinceLastSample = getTimeSinceLastSampleTimestamp();
    if (timeSinceLastSample > 59700) {
      setVideoTimeEndFromEvent(event);
      setDroppedFrames(event);

      sample.duration = timeSinceLastSample;
      sample.played   = sample.duration;

      sendAnalyticsRequest('heartbeat');
      clearValues();

      setVideoTimeStartFromEvent(event);
    }
  }

  function getAnalyticsVersion() {
    return '0.2.0';
  }

  function sendAnalyticsRequest(event) {
    lastSampleTimestamp = new Date().getTime();
    logSample(event);

    if (!granted) {
      return;
    }
    analyticsCall.sendRequest(sample, utils.noOp);
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

  function sendAnalyticsRequestSynchronous(event) {
    lastSampleTimestamp = new Date().getTime();
    logSample(event);

    if (!granted) {
      return;
    }
    analyticsCall.sendRequestSynchronous(sample, utils.noOp);
  }

  function getTimeSinceLastSampleTimestamp() {
    return utils.getCurrentTimestamp() - lastSampleTimestamp;
  }

  function logSample(event) {
    if (debug !== true) {
      return;
    }

    var tr = document.createElement('TR');

    var td = document.createElement('TD');
    td.appendChild(document.createTextNode(event));
    tr.appendChild(td);
    td = document.createElement('TD');
    td.appendChild(document.createTextNode(String(sample.droppedFrames)));
    tr.appendChild(td);
    td = document.createElement('TD');
    td.appendChild(document.createTextNode(String(sample.played)));
    tr.appendChild(td);
    td = document.createElement('TD');
    td.appendChild(document.createTextNode(String(sample.buffered)));
    tr.appendChild(td);
    td = document.createElement('TD');
    td.appendChild(document.createTextNode(String(sample.paused)));
    tr.appendChild(td);
    td = document.createElement('TD');
    td.appendChild(document.createTextNode(String(sample.ad)));
    tr.appendChild(td);
    td = document.createElement('TD');
    td.appendChild(document.createTextNode(String(sample.seeked)));
    tr.appendChild(td);
    td = document.createElement('TD');
    td.appendChild(document.createTextNode(String(sample.videoTimeStart)));
    tr.appendChild(td);
    td = document.createElement('TD');
    td.appendChild(document.createTextNode(String(sample.videoTimeEnd)));
    tr.appendChild(td);
    td = document.createElement('TD');
    td.appendChild(document.createTextNode(String(sample.duration)));
    tr.appendChild(td);
    td = document.createElement('TD');
    td.appendChild(document.createTextNode(String(sample.videoPlaybackWidth)));
    tr.appendChild(td);
    td = document.createElement('TD');
    td.appendChild(document.createTextNode(String(sample.videoPlaybackHeight)));
    tr.appendChild(td);
    td = document.createElement('TD');
    td.appendChild(document.createTextNode(String(sample.videoBitrate)));
    tr.appendChild(td);
    td = document.createElement('TD');
    td.appendChild(document.createTextNode(String(sample.audioBitrate)));
    tr.appendChild(td);
    td = document.createElement('TD');
    td.appendChild(document.createTextNode(String(sample.videoStartupTime)));
    tr.appendChild(td);
    td = document.createElement('TD');
    td.appendChild(document.createTextNode(String(sample.playerStartupTime)));
    tr.appendChild(td);

    document.getElementById('logTable').appendChild(tr);
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

    sample.videoTimeEnd   = 0;
    sample.videoTimeStart = 0;
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
