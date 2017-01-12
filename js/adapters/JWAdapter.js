/**
 * Created by Bitmovin on 19.09.2016.
 */
var JWAdapter = function(player) {
  var skipInitResize = true;
  var levelsChanged  = false;
  var firstSample    = true;
  var eventCallback;

  var register = function() {
    player.on('playlist', function() {
      eventCallback(analytics.events.SOURCE_LOADED);
    });

    player.on('ready', function() {
      var streamType;
      if (player.getProvider().name == 'shaka') {
        streamType = 'DASH';
      }
      else {
        streamType = 'unknown';
      }

      eventCallback(analytics.events.READY, {
        /**
         *  jw player is always rendering in html5 mode
         *  according to https://github.com/jwplayer/jwplayer/wiki/2.2-JW-Player-API-Reference#getters
         */
        type      : 'html5',
        version   : player.version.substring(0, 5),
        duration  : player.getDuration(),
        streamType: streamType
        //isLive:     player.isLive(),
        //videoId:    player.getConfig().source.videoId,
        //userId:     player.getConfig().source.userId
      });
    });

    player.on('play', function() {
      eventCallback(analytics.events.READY, {
        duration: player.getDuration()
      });
      eventCallback(analytics.events.PLAY);
    });

    player.on('pause', function() {
      if (!levelsChanged && !firstSample) {
        eventCallback(analytics.events.PAUSE, {
          currentTime: player.getPosition()
        });
      }
      else {
        levelsChanged = false;
      }
    });

    player.on('levelsChanged', function() {
      levelsChanged = true;
    });

    player.on('time', function() {
      firstSample    = false;
      skipInitResize = false;

      eventCallback(analytics.events.TIMECHANGED, {
        currentTime: player.getPosition()
      });
    });

    player.on('audioTrackChanged', function(event) {
      console.log('AUDIO: ' + JSON.stringify(event));
    });

    player.on('visualQuality', function(event) {
      eventCallback(analytics.events.VIDEO_CHANGE, {
        width      : event.level.width,
        height     : event.level.height,
        bitrate    : event.level.bitrate,
        currentTime: player.getPosition()
      });
    });

    player.on('seek', function() {
      eventCallback(analytics.events.SEEK, {
        currentTime: player.getPosition()
      });
    });

    player.on('bufferChange', function() {
      eventCallback(analytics.events.START_BUFFERING, {
        currentTime: player.getPosition()
      });
    });

    player.on('seeked', function() {
      eventCallback(analytics.events.END_BUFFERING, {
        currentTime: player.getPosition()
      });
    });

    player.on('qualityChange', function(event) {
      console.log(JSON.stringify(event));
    });

    player.on('fullscreen', function(event) {
      if (event.fullscreen == true) {
        eventCallback(analytics.events.START_FULLSCREEN, {
          currentTime: player.getPosition()
        });
      }
      else {
        eventCallback(analytics.events.END_FULLSCREEN, {
          currentTime: player.getPosition()
        });
      }
    });

    player.on('resize', function() {
      /**
       *  this event is thrown before on the first time change event
       *  so we have to skip it the first time
       */
      if (!skipInitResize) {
        eventCallback(analytics.events.SCREEN_RESIZE, {
          currentTime: player.getPosition()
        });
      }
    });

    player.on('error', function(event) {
      eventCallback(analytics.events.ERROR, {
        message    : event.message,
        currentTime: player.getPosition()
      });
    });

    player.on('complete', function() {
      eventCallback(analytics.events.PLAYBACK_FINISHED);
    });

    window.addEventListener('unload', function() {
      eventCallback(analytics.events.UNLOAD, {
        currentTime: player.getPosition()
      });
    });
  };

  var setEventCallback = function(callback) {
    eventCallback = callback;
  };

  register();

  return {
    setEventCallback: setEventCallback
  };
};
