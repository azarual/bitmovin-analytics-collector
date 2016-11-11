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

  /*
   firstSample - boolean to check if first sample is being played

   skipAudio and skipVideo
   the quality will change at the beginning as soon as the player enters the play state.
   we will skip it and provide quality information in the first sample otherwise a new sample will be sent.
   this will only happen for the first sample - so just once
   */
  var firstSample             = true;
  var skipVideoPlaybackChange = true;
  var skipAudioPlaybackChange = true;

  /*
   overall - summarized time of all samples
   lastSampleDuration - summarized time of last samples except the new one
   */
  var overall            = 0;
  var lastSampleDuration = 0;

  var playing             = 0;
  var droppedSampleFrames = 0;

  /*
   members to initialize individual start time depending on the events
   */
  var initAdTime     = 0;
  var initPlayTime   = 0;
  var initSeekTime   = 0;
  var initPauseTime  = 0;
  var initBufferTime = 0;

  /*
   Bool'sche members to check playing, seeking, pausing and ending status
   */
  var start            = true;
  var isSeeking        = false;
  var isPausing        = false;
  var playbackFinished = false;

  var granted = false;

  var lastSampleTimestamp;

  var sample = {
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

  /**
   *
   *  public methods
   *  accessible from outside
   *
   *  - init      --> initialize analytics instance to provide right API key
   *  - record    --> event based analytics reporting function
   *
   */

  this.init = function(config) {
    if (config.key == '' || !utils.validString(config.key)) {
      console.error('Invalid analytics license key provided');
      return;
    }

    checkLicensing(config.key);

    granted = false;

    initTime = new Date().getTime();

    sample.key       = config.key;
    sample.playerKey = config.playerKey;
    sample.player    = config.player;

    /**
     *
     *      get bitmovin analytics userId from cookie if exists
     *      if not generate one
     *
     */
    var userId = getCookie('bitmovin_analytics_uuid');
    if (userId == '') {
      document.cookie = 'bitmovin_analytics_uuid=' + utils.generateUUID();
      sample.userId   = utils.getCookie('bitmovin_analytics_uuid');
    }
    else {
      sample.userId = userId;
    }
  };

  this.record = function(event, eventObject) {

    eventObject   = eventObject || {};
    var timestamp = new Date().getTime();
    switch (event) {

      case this.events.SOURCE_LOADED:
        sample.impressionId = utils.generateUUID();
        break;

      case this.events.READY:
        sample.playerStartupTime = timestamp - initTime;

        sample.videoWindowWidth  = document.getElementById(containerId).offsetWidth;
        sample.videoWindowHeight = document.getElementById(containerId).offsetHeight;

        /**
         * check if all parameters are valid, otherwise leave them default
         */
        if (utils.validBoolean(eventObject.isLive)) {
          sample.isLive = eventObject.isLive;
        }
        if (utils.validString(eventObject.version)) {
          sample.version = eventObject.version;
        }
        if (utils.validString(eventObject.type)) {
          sample.playerTech = eventObject.type;
        }
        if (utils.validNumber(eventObject.duration)) {
          sample.videoDuration = eventObject.duration * 1000;
        }
        if (utils.validString(eventObject.streamType)) {
          sample.streamFormat = eventObject.streamType;
        }
        if (utils.validString(eventObject.videoId)) {
          sample.videoId = eventObject.videoId;
        }
        if (utils.validString(eventObject.userId)) {
          sample.customUserId = eventObject.userId;
        }
        break;

      case this.events.PLAY:
        /*
         init playing time
         */
        initPlayTime = timestamp;

        /*
         generate new impression id if new playback
         */
        if (playbackFinished) {
          lastSampleDuration      = 0;
          playbackFinished        = false;
          initTime                = timestamp;
          skipAudioPlaybackChange = true;
          skipVideoPlaybackChange = true;
          sample.videoTimeEnd     = 0;
          sample.videoTimeStart   = 0;
          sample.impressionId     = generateUUID();
        }

        /*
         call sample which was paused after resuming
         */
        if (initPauseTime != 0) {
          sample.paused   = timestamp - initPauseTime;
          sample.duration = calculateDuration(initTime, timestamp);

          if (utils.validNumber(eventObject.droppedFrames)) {
            sample.droppedFrames = getDroppedFrames(eventObject.droppedFrames);
          }

          sendAnalyticsRequest();

          clearValues();
          isPausing = false;
        }
        break;

      case this.events.PAUSE:
        if (utils.validNumber(eventObject.currentTime)) {
          sample.videoTimeEnd = utils.utils.calculateTime(eventObject.currentTime);
        }
        if (utils.validNumber(eventObject.droppedFrames)) {
          sample.droppedFrames = getDroppedFrames(eventObject.droppedFrames);
        }
        sample.duration = calculateDuration(initTime, timestamp);

        sendAnalyticsRequest();

        clearValues();
        /*
         init playing time
         */
        initPauseTime = timestamp;
        isPausing     = true;
        break;

      case this.events.TIMECHANGED:
        if (!playbackFinished) {
          /*
           if not pausing set or update played attribute
           */
          if (!isPausing && !isSeeking) {
            playing       = timestamp - initPlayTime;
            sample.played = Math.round(playing);
          }

          /*
           only relevant if first frame occurs
           */
          if (firstSample === true) {
            firstSample             = false;
            sample.videoStartupTime = timestamp - initPlayTime;
            lastSampleDuration      = timestamp - initTime;
            sample.duration         = lastSampleDuration;
            overall                 = sample.duration;
            if (utils.validNumber(eventObject.droppedFrames)) {
              sample.droppedFrames = getDroppedFrames(eventObject.droppedFrames);
            }

            sendAnalyticsRequest();

            clearValues();
          }
          else if (!firstSample && start === true) {
            start = false;
            if (utils.validNumber(eventObject.currentTime)) {
              sample.videoTimeStart = utils.calculateTime(eventObject.currentTime);
            }
          }
        }

        sendHeartBeatIfRequired(eventObject);
        break;

      case this.events.SEEK:
        if (!isSeeking && !playbackFinished) {
          /*
           set init seek time
           represents the beginning of seek progress
           */
          initSeekTime = timestamp;

          if (utils.validNumber(eventObject.currentTime)) {
            sample.videoTimeEnd = utils.calculateTime(eventObject.currentTime);
          }
          if (utils.validNumber(eventObject.droppedFrames)) {
            sample.droppedFrames = getDroppedFrames(eventObject.droppedFrames);
          }
          sample.duration = calculateDuration(initTime, timestamp);

          sendAnalyticsRequest();

          clearValues();

          start     = false;
          isSeeking = true;
          if (utils.validNumber(eventObject.currentTime)) {
            sample.videoTimeStart = utils.calculateTime(eventObject.currentTime);
          }
        }
        break;

      case this.events.START_BUFFERING:
        initBufferTime = timestamp;
        break;

      case this.events.END_BUFFERING:
        /*
         calculate time of whole seeking process
         */
        sample.buffered = timestamp - initBufferTime;

        if (isSeeking) {
          /* have to set played attribute to 0 due to some time changing between seek end and buffering */
          sample.played = 0;

          sample.seeked = timestamp - initSeekTime;
          if (utils.validNumber(eventObject.currentTime)) {
            sample.videoTimeEnd = utils.calculateTime(eventObject.currentTime);
          }
          if (utils.validNumber(eventObject.droppedFrames)) {
            sample.droppedFrames = getDroppedFrames(eventObject.droppedFrames);
          }
          sample.duration = calculateDuration(initTime, timestamp);

          sendAnalyticsRequest();

          clearValues();
          isSeeking = false;
        }
        break;


      case this.events.AUDIO_CHANGE:
        if (!skipAudioPlaybackChange && !isSeeking) {
          /*
           get the audio bitrate data for the new sample
           */
          if (utils.validNumber(eventObject.bitrate)) {
            sample.audioBitrate = eventObject.bitrate;
          }
          if (utils.validNumber(eventObject.currentTime)) {
            sample.videoTimeEnd = utils.calculateTime(eventObject.currentTime);
          }
          if (utils.validNumber(eventObject.droppedFrames)) {
            sample.droppedFrames = getDroppedFrames(eventObject.droppedFrames);
          }
          sample.duration = calculateDuration(initTime, timestamp);

          sendAnalyticsRequest();

          clearValues();
        }
        else {
          /*
           set audio playback data
           for first frame and if audio playback data has not changed yet
           */
          if (utils.validNumber(eventObject.bitrate)) {
            sample.audioBitrate = eventObject.bitrate;
          }
          skipAudioPlaybackChange = false;
        }
        break;


      case this.events.VIDEO_CHANGE:
        if (!skipVideoPlaybackChange && !isSeeking) {
          /*
           get the video playback data for the new sample
           */
          if (utils.validNumber(eventObject.width)) {
            sample.videoPlaybackWidth = eventObject.width;
          }
          if (utils.validNumber(eventObject.height)) {
            sample.videoPlaybackHeight = eventObject.height;
          }
          if (utils.validNumber(eventObject.bitrate)) {
            sample.videoBitrate = eventObject.bitrate;
          }

          if (utils.validNumber(eventObject.currentTime)) {
            sample.videoTimeEnd = utils.calculateTime(eventObject.currentTime);
          }
          if (utils.validNumber(eventObject.droppedFrames)) {
            sample.droppedFrames = getDroppedFrames(eventObject.droppedFrames);
          }
          sample.duration = calculateDuration(initTime, timestamp);

          sendAnalyticsRequest();

          clearValues();
        }
        else {
          /*
           set video playback data
           for first frame and if video playback data has not changed yet
           */
          if (utils.validNumber(eventObject.width)) {
            sample.videoPlaybackWidth = eventObject.width;
          }
          if (utils.validNumber(eventObject.height)) {
            sample.videoPlaybackHeight = eventObject.height;
          }
          if (utils.validNumber(eventObject.bitrate)) {
            sample.videoBitrate = eventObject.bitrate;
          }
          skipVideoPlaybackChange = false;
        }
        break;


      case this.events.START_FULLSCREEN:
        if (utils.validNumber(eventObject.currentTime)) {
          sample.videoTimeEnd = utils.calculateTime(eventObject.currentTime);
        }
        if (utils.validNumber(eventObject.droppedFrames)) {
          sample.droppedFrames = getDroppedFrames(eventObject.droppedFrames);
        }
        sample.duration = calculateDuration(initTime, timestamp);

        sendAnalyticsRequest();

        clearValues();
        sample.size = 'FULLSCREEN';
        break;

      case this.events.END_FULLSCREEN:
        if (utils.validNumber(eventObject.currentTime)) {
          sample.videoTimeEnd = utils.calculateTime(eventObject.currentTime);
        }
        if (utils.validNumber(eventObject.droppedFrames)) {
          sample.droppedFrames = getDroppedFrames(eventObject.droppedFrames);
        }
        sample.duration = calculateDuration(initTime, timestamp);

        sendAnalyticsRequest();

        clearValues();
        sample.size = 'WINDOW';
        break;


      case this.events.START_AD:
        initAdTime = timestamp;
        clearValues();
        break;

      case this.events.END_AD:
        sample.ad = timestamp - initAdTime;

        sample.played = 0;
        if (utils.validNumber(eventObject.currentTime)) {
          sample.videoTimeEnd = utils.calculateTime(eventObject.currentTime);
        }
        if (utils.validNumber(eventObject.droppedFrames)) {
          sample.droppedFrames = getDroppedFrames(eventObject.droppedFrames);
        }
        sample.duration = calculateDuration(initTime, timestamp);

        sendAnalyticsRequest();

        clearValues();
        break;


      case this.events.ERROR:
        /*
         add error code property from analytics object
         */
        if (utils.validNumber(eventObject.code)) {
          sample.errorCode = eventObject.code;
        }
        if (utils.validString(eventObject.message)) {
          sample.errorMessage = eventObject.message;
        }
        if (utils.validNumber(eventObject.currentTime)) {
          sample.videoTimeEnd = utils.calculateTime(eventObject.currentTime);
        }
        if (utils.validNumber(eventObject.droppedFrames)) {
          sample.droppedFrames = getDroppedFrames(eventObject.droppedFrames);
        }
        sample.duration = calculateDuration(initTime, timestamp);

        sendAnalyticsRequest();

        /*
         delete error code property from analytics object
         */
        delete sample.errorCode;
        delete sample.errorMessage;

        clearValues();
        break;

      case this.events.PLAYBACK_FINISHED:
        firstSample         = true;
        playbackFinished    = true;
        sample.videoTimeEnd = sample.videoDuration;

        if (utils.validNumber(eventObject.droppedFrames)) {
          sample.droppedFrames = getDroppedFrames(eventObject.droppedFrames);
        }
        sample.duration = calculateDuration(initTime, timestamp);

        sendAnalyticsRequest();
        break;

      case this.events.UNLOAD:
        if (utils.validNumber(eventObject.currentTime)) {
          sample.videoTimeEnd = utils.calculateTime(eventObject.currentTime);
        }
        if (utils.validNumber(eventObject.droppedFrames)) {
          sample.droppedFrames = getDroppedFrames(eventObject.droppedFrames);
        }
        sample.duration = calculateDuration(initTime, timestamp);

        sendUnloadRequest();
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

    lastSampleTimestamp = new Date().getTime();

    analyticsCall.sendRequest(sample, utils.noOp);
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
