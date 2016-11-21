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

  var initAdTime     = 0;
  var initPlayTime   = 0;
  var initSeekTime   = 0;

  var status = 'setup';
  var statusWas;

  var isSeeking        = false;
  var wasSeeking       = false;
  var playbackFinished = false;

  var granted = false;
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
        playerFiredReady(eventObject);
        break;

      case this.events.PLAY:
        playerFiredPlay(eventObject);
        break;

      case this.events.PAUSE:
        playerFiredPause(eventObject);
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
        playerFiredStartBuffering(eventType, eventObject);
        break;

      case this.events.END_BUFFERING:
        playerFiredEndBuffering(eventType, eventObject);
        break;

      case this.events.AUDIO_CHANGE:
        playerFiredAudioChange(eventType, eventObject);
        break;

      case this.events.VIDEO_CHANGE:
        playerFiredVideoChange(eventType, eventObject);
        break;

      case this.events.START_FULLSCREEN:
        playerFiredStartFullscreen(eventType, eventObject);
        break;

      case this.events.END_FULLSCREEN:
        playerFiredEndFullscreen(eventType, eventObject);
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
        playerFiredUnload(eventType, eventObject);
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

  function playerFiredReady(event) {
    handleStatusChange(status, 'ready', event);
  }

  function playerFiredPlay(event) {
    handleStatusChange(status, 'play', event);
  }

  function playerFiredPause(event) {

    handleStatusChange(status, 'paused', event);

  }

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

    if (status === 'paused') {
      handleStatusChange(status, 'playing', event);
      return;
    }

    sendHeartBeatIfRequired(event);
  }

  function playerFiredSeek(event) {
    if (isSeeking) {
      return;
    }

    handleStatusChange(status, 'seeking', event);
  }

  function playerFiredSeeked(eventType, event) {
    if (status !== 'seeking') {
      return;
    }

    var now = new Date().getTime();

    sample.duration = now - initSeekTime;
    sample.seeked = now - initSeekTime;

    isSeeking = false;
    wasSeeking = true;
  }

  function playerFiredStartBuffering(eventType, event) {
    if (status === 'seeking') {
      return;
    }

    handleStatusChange(status, 'buffering', event);
  }

  function playerFiredEndBuffering(eventType, event) {
    if (status !== 'buffering') {
      return;
    }

    var now = new Date().getTime();

    sample.buffered = calculateDuration(now);
    sample.duration = sample.buffered;

    setVideoTimeEnd(event);
    setDroppedFrames(event);

    sendAnalyticsRequest(String(eventType));
    clearValues();

    setVideoTimeStart(event);
    setStatus(statusWas);
  }

  function playerFiredAudioChange(eventType, event) {
    if (skipAudioPlaybackChange) {
      if (utils.validNumber(event.bitrate)) {
        sample.audioBitrate = event.bitrate;
      }

      skipAudioPlaybackChange = false;
      return;
    }

    if (status === 'seeking') {
      return;
    }

    setVideoTimeEnd(event);
    setDroppedFrames(event);


    var now = new Date().getTime();
    sample.duration = calculateDuration(now);
    sample.played = calculateDuration(now);

    sendAnalyticsRequest(String(eventType));
    clearValues();

    if (utils.validNumber(event.bitrate)) {
      sample.audioBitrate = event.bitrate;
    }

    setVideoTimeStart(event);
  }

  function playerFiredVideoChange(eventType, event) {
    if (skipVideoPlaybackChange) {
      if (utils.validNumber(event.width)) {
        sample.videoPlaybackWidth = event.width;
      }
      if (utils.validNumber(event.height)) {
        sample.videoPlaybackHeight = event.height;
      }
      if (utils.validNumber(event.bitrate)) {
        sample.videoBitrate = event.bitrate;
      }

      skipVideoPlaybackChange = false;
      return;
    }

    if (status === 'seeking') {
      return;
    }

    setVideoTimeEnd(event);
    setDroppedFrames(event);

    var now = new Date().getTime();
    sample.duration = calculateDuration(now);
    sample.played = calculateDuration(now);

    sendAnalyticsRequest(String(eventType));
    clearValues();

    if (utils.validNumber(event.width)) {
      sample.videoPlaybackWidth = event.width;
    }
    if (utils.validNumber(event.height)) {
      sample.videoPlaybackHeight = event.height;
    }
    if (utils.validNumber(event.bitrate)) {
      sample.videoBitrate = event.bitrate;
    }
    setVideoTimeStart(event);
  }

  function playerFiredStartFullscreen(eventType, event) {
    var now = new Date().getTime();
    sample.duration = calculateDuration(now);
    setVideoTimeEnd(event);
    setDroppedFrames(event);

    sendAnalyticsRequest(String(eventType));
    clearValues();

    sample.size = 'FULLSCREEN';
    setVideoTimeStart(event);
  }

  function playerFiredEndFullscreen(eventType, event) {
    var now = new Date().getTime();
    sample.duration = calculateDuration(now);

    setVideoTimeEnd(event);
    setDroppedFrames(event);

    sendAnalyticsRequest(String(eventType));
    clearValues();

    sample.size = 'WINDOW';
    setVideoTimeStart(event);
  }

  function playerFiredStartAd(eventType, event) {
    var now = new Date().getTime();
    sample.duration = calculateDuration(now);
    setVideoTimeEnd(event);
    setDroppedFrames(event);

    sendAnalyticsRequest(String(eventType));
    clearValues();

    initAdTime = now;
    setVideoTimeStart(event);
  }

  function playerFiredEndAd(eventType, event) {
    var now = new Date().getTime();

    sample.ad = now - initAdTime;
    sample.duration = now - initAdTime;

    setVideoTimeEnd(event);
    setDroppedFrames(event);

    sendAnalyticsRequest(String(eventType));
    clearValues();

    setVideoTimeEnd(event);
  }

  function playerFiredError(eventType, event) {
    setDroppedFrames(event);
    setVideoTimeEnd(event);

    sendAnalyticsRequest(String(eventType));
    clearValues();

    if (utils.validNumber(event.code)) {
      sample.errorCode = event.code;
    }
    if (utils.validString(event.message)) {
      sample.errorMessage = event.message;
    }

    setVideoTimeEnd(event);
    setVideoTimeStart(event);
    setDroppedFrames(event);

    sendAnalyticsRequest(String(eventType));
    clearValues();

    delete sample.errorCode;
    delete sample.errorMessage;
  }

  function playerFiredPlaybackFinished(eventType, event) {
    var now = new Date().getTime();

    firstSample         = true;
    playbackFinished    = true;
    sample.videoTimeEnd = sample.videoDuration;

    if (utils.validNumber(event.droppedFrames)) {
      sample.droppedFrames = getDroppedFrames(event.droppedFrames);
    }

    sample.duration = calculateDuration(now);

    sendAnalyticsRequest(String(eventType));
  }

  function playerFiredUnload(eventType, event) {
    if (utils.validNumber(event.droppedFrames)) {
      sample.droppedFrames = getDroppedFrames(event.droppedFrames);
    }

    var now = new Date().getTime();
    sample.duration = calculateDuration(now);
    setVideoTimeEnd(event);

    sendUnloadRequest(eventType);
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
  }

  function handleStatusChangeFromLoaded(statusNew, event) {
    if (statusNew === 'ready') {
      var now                  = new Date().getTime();
      sample.playerStartupTime = now - initTime;

      sample.videoWindowWidth  = document.getElementById(containerId).offsetWidth;
      sample.videoWindowHeight = document.getElementById(containerId).offsetHeight;

      if (utils.validBoolean(event.isLive)) {
        sample.isLive = event.isLive;
      }
      if (utils.validString(event.version)) {
        sample.version = event.version;
      }
      if (utils.validString(event.type)) {
        sample.playerTech = event.type;
      }
      if (utils.validNumber(event.duration)) {
        sample.videoDuration = utils.calculateTime(event.duration);
      }
      if (utils.validString(event.streamType)) {
        sample.streamFormat = event.streamType;
      }
      if (utils.validString(event.videoId)) {
        sample.videoId = event.videoId;
      }
      if (utils.validString(event.userId)) {
        sample.customUserId = event.userId;
      }

      sendAnalyticsRequest('ready');
      clearValues();

      setStatusWas('loaded');
      setStatus('ready');
    }
  }

  function handleStatusChangeFromReady(statusNew, event) {
    if (statusNew === 'play') {
      sendAnalyticsRequest('play');
      clearValues();

      initPlayTime = getCurrentTimestamp();

      setStatusWas('ready');
      setStatus('play');
    }
  }

  function handleStatusChangeFromPlay(statusNew, event) {
    var newStatusWas = 'play';

    if (statusNew === 'playing') {
      sendAnalyticsRequest('playing');
      clearValues();

      setStatusWas(newStatusWas);
      setStatus('playing');

      return;
    }

    if (statusNew === 'buffering') {
      setVideoTimeEnd(event);
      setDroppedFrames(event);

      var now = getCurrentTimestamp();

      sample.duration = calculateDuration(now);
      sample.played = calculateDuration(now);

      sendAnalyticsRequest('buffering');
      clearValues();
      setVideoTimeStart(event);

      setStatusWas(newStatusWas);
      setStatus('buffering');

      return;
    }
  }

  function handleStatusChangeFromPlaying(statusNew, event) {
    var now = getCurrentTimestamp();
    var newStatusWas = 'playing';

    if (statusNew === 'paused') {
      setVideoTimeEnd(event);
      setDroppedFrames(event);

      sample.duration = calculateDuration(now);
      sample.played = calculateDuration(now);

      sendAnalyticsRequest('paused');

      clearValues();
      setVideoTimeStart(event);

      setStatusWas(newStatusWas);
      setStatus('paused');

      return;
    }

    if (statusNew === 'seeking') {
      initSeekTime = now;

      setVideoTimeEnd(event);
      setDroppedFrames(event);

      sample.duration = calculateDuration(now);
      sample.played = calculateDuration(now);

      sendAnalyticsRequest('seeking');
      clearValues();

      setVideoTimeStart(event);
      setStatusWas(newStatusWas);
      setStatus('seeking');

      isSeeking = true;

      return;
    }
  }

  function handleStatusChangeFromFinished(statusNew, event) {
    if (statusNew === 'play') {
      sample.impressionId = utils.generateUUID();
      initTime            = getCurrentTimestamp();

      clearValues();
      sendAnalyticsRequest('play');

      setStatusWas('finished');
      setStatus('play');
      return;
    }
  }

  function handleStatusChangeFromPaused(statusNew, event) {
    if (statusNew === 'play') {
      sample.paused   = calculateDuration(getCurrentTimestamp());
      sample.duration = calculateDuration(getCurrentTimestamp());

      sendAnalyticsRequest('play');

      setStatusWas('paused');
      setStatus('play');
      return;
    }

    if (statusNew === 'playing') {
      sample.paused   = calculateDuration(getCurrentTimestamp());
      sample.duration = calculateDuration(getCurrentTimestamp());

      sendAnalyticsRequest('play');

      setStatusWas('paused');
      setStatus('playing');
      return;
    }
  }

  function handleStatusChangeFromBuffering(statusNew, event) {
    if (statusNew === 'playing') {
      firstSample             = false;

      sample.videoStartupTime = getCurrentTimestamp() - initPlayTime;
      sample.duration         = calculateDuration(getCurrentTimestamp());

      setDroppedFrames(event);
      setVideoTimeStart(event);
      setVideoTimeEnd(event);

      sendAnalyticsRequest('playing');
      clearValues();

      setVideoTimeStart(event);

      setStatusWas('buffering');
      setStatus('playing');
    }
  }

  function handleStatusChangeFromSeeking(statusNew, event) {
    if (statusNew === 'playing') {

      sample.seeked = calculateDuration(getCurrentTimestamp());

      sendAnalyticsRequest('seeked');
      clearValues();
      wasSeeking = false;

      setStatusWas('seeking');
      setStatus('playing');
    }
  }

  function setStatusWas(oldStatus) {
    statusWas = oldStatus;
    console.log('Setting status was to ', oldStatus);
  }

  function setStatus(newStatus) {
    status = newStatus;
    console.log('Setting status to ', status);
  }

  function setVideoTimeEnd(event) {
    if (utils.validNumber(event.currentTime)) {
      sample.videoTimeEnd = utils.calculateTime(event.currentTime);
    }
  }

  function setVideoTimeStart(event) {
    if (utils.validNumber(event.currentTime)) {
      sample.videoTimeStart = utils.calculateTime(event.currentTime);
    }
  }

  function setDroppedFrames(event) {
    if (utils.validNumber(event.droppedFrames)) {
      sample.droppedFrames = getDroppedFrames(event.droppedFrames);
    }
  }


  function getCurrentTimestamp() {
    return new Date().getTime();
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
    var now = new Date().getTime();

    var timeSinceLastSample = calculateDuration(now);
    if (timeSinceLastSample > 59700) {
      setVideoTimeEnd(event);
      setDroppedFrames(event);

      sample.duration = timeSinceLastSample;

      sendAnalyticsRequest('heartbeat');
      clearValues();

      setVideoTimeStart(event);
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

  function calculateDuration(timestamp) {
    return timestamp - lastSampleTimestamp;
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

    document.getElementById('logTable').appendChild(tr);
  }

  function clearValues() {
    sample.ad                = 0;
    sample.paused            = 0;
    sample.played            = 0;
    sample.seeked            = 0;
    sample.buffered          = 0;

    sample.playerStartupTime = 0;
    sample.videoStartupTime  = 0;

    sample.duration = 0;
    sample.droppedFrames = 0;

    sample.videoTimeEnd     = 0;
    sample.videoTimeStart   = 0;
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
