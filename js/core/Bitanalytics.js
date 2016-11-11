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

  var overall            = 0;
  var lastSampleDuration = 0;

  var playing             = 0;
  var droppedSampleFrames = 0;

  var initAdTime     = 0;
  var initPlayTime   = 0;
  var initSeekTime   = 0;
  var initPauseTime  = 0;
  var initBufferTime = 0;

  var start            = true;
  var isSeeking        = false;
  var isPausing        = false;
  var playbackFinished = false;

  var granted = false;

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
    var now     = new Date().getTime();

    switch (eventType) {
      case this.events.SOURCE_LOADED:
        sample.impressionId = utils.generateUUID();
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

      case this.events.START_BUFFERING:
        initBufferTime = now;
        break;

      case this.events.END_BUFFERING:
        playerFiredEndBuffering(eventObject);
        break;

      case this.events.AUDIO_CHANGE:
        playerFiredAudioChange(eventObject);
        break;

      case this.events.VIDEO_CHANGE:
        playerFiredVideoChange(eventObject);
        break;

      case this.events.START_FULLSCREEN:
        playerFiredStartFullscreen(eventObject);
        break;

      case this.events.END_FULLSCREEN:
        playerFiredEndFullscreen(eventObject);
        break;

      case this.events.START_AD:
        initAdTime = now;
        clearValues();
        break;

      case this.events.END_AD:
        playerFiredEndAd(eventObject);
        break;

      case this.events.ERROR:
        playerFiredError(eventObject);
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

  function playerFiredReady(event) {
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
      sample.videoDuration = event.duration * 1000;
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
  }

  function playerFiredPlay(event) {
    var now = new Date().getTime();

    initPlayTime = now;

    if (playbackFinished) {
      lastSampleDuration      = 0;
      playbackFinished        = false;
      initTime                = now;
      skipAudioPlaybackChange = true;
      skipVideoPlaybackChange = true;
      sample.videoTimeEnd     = 0;
      sample.videoTimeStart   = 0;
      sample.impressionId     = utils.generateUUID();
    }

    /*
     call sample which was paused after resuming
     */
    if (initPauseTime != 0) {
      sample.paused   = now - initPauseTime;
      sample.duration = calculateDuration(initTime, now);

      if (utils.validNumber(event.droppedFrames)) {
        sample.droppedFrames = getDroppedFrames(event.droppedFrames);
      }

      sendAnalyticsRequest();

      clearValues();
      isPausing = false;
    }
  }

  function playerFiredPause(event) {
    var now = new Date().getTime();

    if (utils.validNumber(event.currentTime)) {
      sample.videoTimeEnd = utils.calculateTime(event.currentTime);
    }
    if (utils.validNumber(event.droppedFrames)) {
      sample.droppedFrames = getDroppedFrames(event.droppedFrames);
    }

    sample.duration = calculateDuration(initTime, now);

    sendAnalyticsRequest();
    clearValues();

    initPauseTime = now;
    isPausing     = true;
  }

  function playerFiredTimeChanged(event) {
    var now = new Date().getTime();

    if (playbackFinished) {
      return;
    }

    /*
     if not pausing set or update played attribute
     */
    if (!isPausing && !isSeeking) {
      playing       = now - initPlayTime;
      sample.played = Math.round(playing);
    }

    /*
     only relevant if first frame occurs
     */
    if (firstSample === true) {
      firstSample             = false;
      sample.videoStartupTime = now - initPlayTime;
      lastSampleDuration      = now - initTime;
      sample.duration         = lastSampleDuration;
      overall                 = sample.duration;

      if (utils.validNumber(event.droppedFrames)) {
        sample.droppedFrames = getDroppedFrames(event.droppedFrames);
      }

      sendAnalyticsRequest();

      clearValues();
    }
    else if (!firstSample && start === true) {
      start = false;
      if (utils.validNumber(event.currentTime)) {
        sample.videoTimeStart = utils.calculateTime(event.currentTime);
      }
    }

    sendHeartBeatIfRequired(event);
  }

  function playerFiredSeek(event) {
    if (isSeeking || playbackFinished) {
      return;
    }

    var now = new Date().getTime();
    /*
     set init seek time
     represents the beginning of seek progress
     */
    initSeekTime = now;

    if (utils.validNumber(event.currentTime)) {
      sample.videoTimeEnd = utils.calculateTime(event.currentTime);
    }
    if (utils.validNumber(event.droppedFrames)) {
      sample.droppedFrames = getDroppedFrames(event.droppedFrames);
    }
    sample.duration = calculateDuration(initTime, now);

    sendAnalyticsRequest();

    clearValues();

    start     = false;
    isSeeking = true;
    if (utils.validNumber(event.currentTime)) {
      sample.videoTimeStart = utils.calculateTime(event.currentTime);
    }
  }

  function playerFiredEndBuffering(event) {
    var now = new Date().getTime();

    sample.buffered = now - initBufferTime;
    if (isSeeking) {
      /* have to set played attribute to 0 due to some time changing between seek end and buffering */
      sample.played = 0;

      sample.seeked = now - initSeekTime;
      if (utils.validNumber(event.currentTime)) {
        sample.videoTimeEnd = utils.calculateTime(event.currentTime);
      }
      if (utils.validNumber(event.droppedFrames)) {
        sample.droppedFrames = getDroppedFrames(event.droppedFrames);
      }
      sample.duration = calculateDuration(initTime, now);

      sendAnalyticsRequest();

      clearValues();
      isSeeking = false;
    }
  }

  function playerFiredAudioChange(event) {
    var now = new Date().getTime();

    if (!skipAudioPlaybackChange && !isSeeking) {
      /*
       get the audio bitrate data for the new sample
       */
      if (utils.validNumber(event.bitrate)) {
        sample.audioBitrate = event.bitrate;
      }
      if (utils.validNumber(event.currentTime)) {
        sample.videoTimeEnd = utils.calculateTime(event.currentTime);
      }
      if (utils.validNumber(event.droppedFrames)) {
        sample.droppedFrames = getDroppedFrames(event.droppedFrames);
      }
      sample.duration = calculateDuration(initTime, now);

      sendAnalyticsRequest();

      clearValues();
    }
    else {
      /*
       set audio playback data
       for first frame and if audio playback data has not changed yet
       */
      if (utils.validNumber(event.bitrate)) {
        sample.audioBitrate = event.bitrate;
      }
      skipAudioPlaybackChange = false;
    }
  }

  function playerFiredVideoChange(event) {
    var now = new Date().getTime();

    if (!skipVideoPlaybackChange && !isSeeking) {
      /*
       get the video playback data for the new sample
       */
      if (utils.validNumber(event.width)) {
        sample.videoPlaybackWidth = event.width;
      }
      if (utils.validNumber(event.height)) {
        sample.videoPlaybackHeight = event.height;
      }
      if (utils.validNumber(event.bitrate)) {
        sample.videoBitrate = event.bitrate;
      }

      if (utils.validNumber(event.currentTime)) {
        sample.videoTimeEnd = utils.calculateTime(event.currentTime);
      }
      if (utils.validNumber(event.droppedFrames)) {
        sample.droppedFrames = getDroppedFrames(event.droppedFrames);
      }
      sample.duration = calculateDuration(initTime, now);

      sendAnalyticsRequest();

      clearValues();
    }
    else {
      /*
       set video playback data
       for first frame and if video playback data has not changed yet
       */
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
    }
  }

  function playerFiredStartFullscreen(event) {
    var now = new Date().getTime();

    if (utils.validNumber(event.currentTime)) {
      sample.videoTimeEnd = utils.calculateTime(event.currentTime);
    }
    if (utils.validNumber(event.droppedFrames)) {
      sample.droppedFrames = getDroppedFrames(event.droppedFrames);
    }
    sample.duration = calculateDuration(initTime, now);

    sample.size = 'FULLSCREEN';
    sendAnalyticsRequest();

    clearValues();
  }

  function playerFiredEndFullscreen(event) {
    var now = new Date().getTime();

    if (utils.validNumber(event.currentTime)) {
      sample.videoTimeEnd = utils.calculateTime(event.currentTime);
    }
    if (utils.validNumber(event.droppedFrames)) {
      sample.droppedFrames = getDroppedFrames(event.droppedFrames);
    }
    sample.duration = calculateDuration(initTime, now);

    sendAnalyticsRequest();

    clearValues();
    sample.size = 'WINDOW';
  }

  function playerFiredEndAd(event) {
    var now = new Date().getTime();

    sample.ad = now - initAdTime;

    sample.played = 0;
    if (utils.validNumber(event.currentTime)) {
      sample.videoTimeEnd = utils.calculateTime(event.currentTime);
    }
    if (utils.validNumber(event.droppedFrames)) {
      sample.droppedFrames = getDroppedFrames(event.droppedFrames);
    }
    sample.duration = calculateDuration(initTime, now);

    sendAnalyticsRequest();

    clearValues();
  }

  function playerFiredError(event) {
    var now = new Date().getTime();

    if (utils.validNumber(event.code)) {
      sample.errorCode = event.code;
    }
    if (utils.validString(event.message)) {
      sample.errorMessage = event.message;
    }
    if (utils.validNumber(event.currentTime)) {
      sample.videoTimeEnd = utils.calculateTime(event.currentTime);
    }
    if (utils.validNumber(event.droppedFrames)) {
      sample.droppedFrames = getDroppedFrames(event.droppedFrames);
    }
    sample.duration = calculateDuration(initTime, now);

    sendAnalyticsRequest();

    delete sample.errorCode;
    delete sample.errorMessage;

    clearValues();
  }

  function playerFiredPlaybackFinished(event) {
    var now = new Date().getTime();

    firstSample         = true;
    playbackFinished    = true;
    sample.videoTimeEnd = sample.videoDuration;

    if (utils.validNumber(event.droppedFrames)) {
      sample.droppedFrames = getDroppedFrames(event.droppedFrames);
    }
    sample.duration = calculateDuration(initTime, now);

    sendAnalyticsRequest();
  }

  function playerFiredUnload(event) {
    var now = new Date().getTime();

    if (utils.validNumber(event.currentTime)) {
      sample.videoTimeEnd = utils.calculateTime(event.currentTime);
    }
    if (utils.validNumber(event.droppedFrames)) {
      sample.droppedFrames = getDroppedFrames(event.droppedFrames);
    }
    sample.duration = calculateDuration(initTime, now);

    sendUnloadRequest();
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
      videoId            : '',
      customUserId       : '',
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
    licenseCall.sendRequest(key, sample.domain, sample.version, handleLicensingResponse);
  }

  function handleLicensingResponse(licensingResponse) {
    if (licensingResponse.status === 'granted') {
      granted = true;
    }
  }

  function sendHeartBeatIfRequired(eventObject) {
    var now = new Date().getTime();

    var timeSinceLastSample = now - lastSampleTimestamp;
    if (timeSinceLastSample > 59700) {
      if (utils.validNumber(eventObject.currentTime)) {
        sample.videoTimeEnd = utils.calculateTime(eventObject.currentTime);
      }
      if (utils.validNumber(eventObject.droppedFrames)) {
        sample.droppedFrames = getDroppedFrames(eventObject.droppedFrames);
      }
      sample.duration = calculateDuration(initTime, now);

      sendAnalyticsRequest();
      clearValues();
    }
  }

  function getAnalyticsVersion() {
    return '0.1.0';
  }

  function sendAnalyticsRequest() {
    if (!granted) {
      return;
    }
    if (!isAnalyticsObjectValid()) {
      return;
    }

    console.log('sending request', sample);

    lastSampleTimestamp = new Date().getTime();

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

  function sendAnalyticsRequestSynchronous() {
    if (!granted) {
      return;
    }
    if (!isAnalyticsObjectValid()) {
      return;
    }

    lastSampleTimestamp = new Date().getTime();

    analyticsCall.sendRequestSynchronous(sample, utils.noOp);
  }

  function calculateDuration(initTime, timestamp) {
    lastSampleDuration = timestamp - initTime - overall;
    overall += lastSampleDuration;
    return lastSampleDuration;
  }

  function clearValues() {
    start         = true;
    initPauseTime = 0;
    isPausing     = false;
    initPlayTime  = new Date().getTime();

    sample.ad                = 0;
    sample.paused            = 0;
    sample.played            = 0;
    sample.seeked            = 0;
    sample.buffered          = 0;
    sample.playerStartupTime = 0;
    sample.videoStartupTime  = 0;
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

  function isAnalyticsObjectValid() {
    if (!sample.impressionId || sample.impressionId === '') {
      return false;
    }

    if (!sample.userId || sample.userId === '') {
      return false;
    }

    return true;
  }
}
