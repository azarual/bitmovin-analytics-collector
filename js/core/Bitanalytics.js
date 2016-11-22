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

  var status = 'setup';
  var statusWas;

  var isSeeking        = false;
  var wasSeeking       = false;

  var granted  = false;
  var dontSend = true;

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
        setStatus('loaded');
        break;

      case this.events.READY:
        handleStatusChange(status, 'ready', eventObject);
        break;

      case this.events.PLAY:
        handleStatusChange(status, 'play', eventObject);
        break;

      case this.events.PAUSE:
        handleStatusChange(status, 'paused', eventObject);
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
        handleStatusChange(status, 'buffering', eventObject);
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
        handleStatusChange(status, 'fullscreen', eventObject);
        break;

      case this.events.END_FULLSCREEN:
        handleStatusChange(status, 'window', eventObject);
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
        playerFiredPlaybackFinished(eventType, eventObject);
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
      handleStatusChange(status, 'playing', event);
      firstSample = false;
      return;
    }

    if (wasSeeking) {
      handleStatusChange(status, 'playing', event);
      wasSeeking = false;
      return;
    }

    handleStatusChange(status, 'playing', event);
  }

  function playerFiredSeek(event) {
    if (status === 'seeking') {
      return;
    }

    handleStatusChange(status, 'seeking', event);
  }

  function playerFiredSeeked(eventType, event) {
    if (status !== 'seeking') {
      return;
    }

    sample.duration = utils.getDurationFromTimestampToNow(initSeekTime);
    sample.seeked   = sample.duration;

    isSeeking  = false;
    wasSeeking = true;
  }

  function playerFiredEndBuffering(eventType, event) {
    if (status !== 'buffering') {
      return;
    }

    handleStatusChange(status, 'buffered', event);
  }

  function playerFiredAudioChange(event) {
    if (skipAudioPlaybackChange) {
      if (utils.validNumber(event.bitrate)) {
        sample.audioBitrate = event.bitrate;
      }

      skipAudioPlaybackChange = false;
      return;
    }

    if (status !== 'playing') {
      return;
    }

    setVideoTimeEndFromEvent(event);
    setDroppedFrames(event);

    sample.duration = getTimeSinceLastSampleTimestamp();
    sample.played   = sample.duration;

    sendAnalyticsRequest(status);
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

    if (status !== 'playing') {
      return;
    }

    setVideoTimeEndFromEvent(event);
    setDroppedFrames(event);

    sample.duration = getTimeSinceLastSampleTimestamp();
    sample.played   = sample.duration;

    sendAnalyticsRequest(status);
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

  function playerFiredPlaybackFinished(eventType, event) {
    firstSample         = true;
    handleStatusChange(status, 'ended', event);
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
    if (statusWas === 'loaded') {
      handleStatusChangeFromLoaded(statusNew, event);
      return;
    }

    if (statusWas === 'ready') {
      handleStatusChangeFromReady(statusNew, event);
      return;
    }

    if (statusWas === 'play') {
      handleStatusChangeFromPlay(statusNew, event);
      return;
    }

    if (statusWas === 'playing') {
      handleStatusChangeFromPlaying(statusNew, event);
      return;
    }

    if (statusWas === 'finished') {
      handleStatusChangeFromFinished(statusNew, event);
      return;
    }

    if (statusWas === 'paused') {
      handleStatusChangeFromPaused(statusNew, event);
      return;
    }

    if (statusWas === 'buffering') {
      handleStatusChangeFromBuffering(statusNew, event);
      return;
    }

    if (statusWas === 'seeking') {
      handleStatusChangeFromSeeking(statusNew, event);
      return;
    }

    if (statusWas === 'buffered') {
      handleStatusChangeFromBuffered(statusNew, event);
      return;
    }
  }

  function handleStatusChangeFromLoaded(statusNew, event) {
    var newStatusWas = 'loaded';

    if (statusNew === 'ready') {
      sample.playerStartupTime = utils.getDurationFromTimestampToNow(initTime);

      sample.videoWindowWidth  = document.getElementById(containerId).offsetWidth;
      sample.videoWindowHeight = document.getElementById(containerId).offsetHeight;

      setPlaybackSettingsFromLoadedEvent(event);

      sendAnalyticsRequest(newStatusWas);
      clearValues();

      setStatusWas(newStatusWas);
      setStatus(statusNew);
      return;
    }
  }

  function handleStatusChangeFromReady(statusNew, event) {
    var newStatusWas = 'ready';

    if (statusNew === 'play') {
      initPlayTime = utils.getCurrentTimestamp();

      setStatusWas(newStatusWas);
      setStatus(statusNew);
      return;
    }
  }

  function handleStatusChangeFromPlay(statusNew, event) {
    var newStatusWas = 'play';

    if (statusNew === 'playing') {
      if (firstSample) {
        sample.videoStartupTime = utils.getDurationFromTimestampToNow(initPlayTime);
        firstSample = false;
      }

      sendAnalyticsRequest(newStatusWas);
      clearValues();

      setStatusWas(newStatusWas);
      setStatus(statusNew);
      return;
    }

    if (statusNew === 'buffering') {
      setVideoTimeEndFromEvent(event);
      setDroppedFrames(event);

      sample.duration = getTimeSinceLastSampleTimestamp();
      sample.played   = getTimeSinceLastSampleTimestamp();

      sendAnalyticsRequest(newStatusWas);
      clearValues();
      setVideoTimeStartFromEvent(event);

      setStatusWas(newStatusWas);
      setStatus(statusNew);
      return;
    }
  }

  function handleStatusChangeFromPlaying(statusNew, event) {
    var newStatusWas = 'playing';

    if (statusNew === 'paused') {
      setVideoTimeEndFromEvent(event);
      setDroppedFrames(event);

      sample.duration = getTimeSinceLastSampleTimestamp();
      sample.played   = sample.duration;

      sendAnalyticsRequest(newStatusWas);

      clearValues();
      setVideoTimeStartFromEvent(event);

      setStatusWas(newStatusWas);
      setStatus(statusNew);
      return;
    }

    if (statusNew === 'seeking') {
      initSeekTime = utils.getCurrentTimestamp();

      setVideoTimeEndFromEvent(event);
      setDroppedFrames(event);

      sample.duration = getTimeSinceLastSampleTimestamp();
      sample.played   = sample.duration;

      sendAnalyticsRequest(newStatusWas);
      clearValues();

      setVideoTimeStartFromEvent(event);

      setStatusWas(newStatusWas);
      setStatus(statusNew);
      return;
    }

    if (statusNew === 'playing') {
      sendHeartBeatIfRequired(event);
      return;
    }

    if (statusNew === 'fullscreen') {
      sample.duration = getTimeSinceLastSampleTimestamp();
      sample.played = sample.duration;

      setVideoTimeEndFromEvent(event);
      setDroppedFrames(event);

      sendAnalyticsRequest(newStatusWas);
      clearValues();

      sample.size = 'FULLSCREEN';
      setVideoTimeStartFromEvent(event);
      return;
    }

    if (statusNew === 'window') {
      sample.duration = getTimeSinceLastSampleTimestamp();
      sample.played = sample.duration;

      setVideoTimeEndFromEvent(event);
      setDroppedFrames(event);

      sendAnalyticsRequest(newStatusWas);
      clearValues();

      sample.size = 'WINDOW';
      setVideoTimeStartFromEvent(event);
      return;
    }

    if (statusNew === 'ended') {
      sample.videoTimeEnd = sample.videoDuration;
      setDroppedFrames(event);

      sample.duration = getTimeSinceLastSampleTimestamp();
      sample.played = sample.duration;

      sendAnalyticsRequest('ended');
    }
  }

  function handleStatusChangeFromFinished(statusNew, event) {
    var newStatusWas = 'finished';

    if (statusNew === 'play') {
      sample.impressionId = utils.generateUUID();
      initTime            = utils.getCurrentTimestamp();

      clearValues();
      sendAnalyticsRequest(newStatusWas);

      setStatusWas(newStatusWas);
      setStatus(statusNew);
      return;
    }
  }

  function handleStatusChangeFromPaused(statusNew, event) {
    var newStatusWas = 'paused';

    if (statusNew === 'playing') {
      sample.paused   = getTimeSinceLastSampleTimestamp();
      sample.duration = getTimeSinceLastSampleTimestamp();
      setVideoTimeEndFromEvent(event);

      sendAnalyticsRequest(newStatusWas);
      clearValues();

      setVideoTimeStartFromEvent(event);

      setStatusWas(newStatusWas);
      setStatus(statusNew);
      return;
    }
  }

  function handleStatusChangeFromBuffering(statusNew, event) {
    var newStatusWas = 'buffering';

    if (statusNew === 'playing') {
      if (firstSample) {
        sample.videoStartupTime = utils.getDurationFromTimestampToNow(initPlayTime);
        firstSample = false;
      }

      sample.duration = getTimeSinceLastSampleTimestamp();
      sample.buffered = sample.duration;

      setDroppedFrames(event);
      setVideoTimeStartFromEvent(event);
      setVideoTimeEndFromEvent(event);

      sendAnalyticsRequest(newStatusWas);
      clearValues();

      setVideoTimeStartFromEvent(event);

      setStatusWas(newStatusWas);
      setStatus(statusNew);
      return;
    }

    if (statusNew === 'buffered') {
      sample.buffered = getTimeSinceLastSampleTimestamp();
      sample.duration = sample.buffered;

      setVideoTimeEndFromEvent(event);
      setDroppedFrames(event);

      sendAnalyticsRequest(newStatusWas);
      clearValues();

      setVideoTimeStartFromEvent(event);
      setStatus(statusWas);
    }
  }

  function handleStatusChangeFromSeeking(statusNew, event) {
    var newStatusWas = 'seeking';

    if (statusNew === 'playing') {
      sample.seeked = getTimeSinceLastSampleTimestamp();

      sendAnalyticsRequest(newStatusWas);
      clearValues();
      wasSeeking = false;

      setStatusWas(newStatusWas);
      setStatus(statusNew);
    }
  }

  function handleStatusChangeFromBuffered(statusNew, event) {
    var newStatusWas = 'buffered';

    if (statusNew === 'playing') {
      sample.seeked = getTimeSinceLastSampleTimestamp();

      sendAnalyticsRequest(newStatusWas);
      clearValues();
      wasSeeking = false;

      setStatusWas(newStatusWas);
      setStatus(statusNew);
    }
  }

  function setStatusWas(oldStatus) {
    statusWas = oldStatus;
    console.log('Setting status was', oldStatus);
  }

  function setStatus(newStatus) {
    status = newStatus;
    console.log('Setting status', status);
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
      sample.played = sample.duration;

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
    if (!granted || dontSend) {
      logSample(event);
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
    if (!granted || dontSend) {
      logSample(event);
      return;
    }

    analyticsCall.sendRequestSynchronous(sample, utils.noOp);
  }

  function getTimeSinceLastSampleTimestamp() {
    return utils.getCurrentTimestamp() - lastSampleTimestamp;
  }

  function logSample(event) {
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
