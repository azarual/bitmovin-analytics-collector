/**
 * Created by Bitmovin on 19.09.2016.
 */
var Adapter = function(record) {
  var skipInitResize = true;
  var levelsChanged  = false;
  var firstSample    = true;

  this.register = function(player) {
    player.on('playlist', function() {
      record(analytics.events.SOURCE_LOADED);
    });

    player.on('ready', function() {
      var streamType;
      if (player.getProvider().name == 'shaka') {
        streamType = 'DASH';
      }
      else {
        streamType = 'unknown';
      }

      record(analytics.events.READY, {
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
      record(analytics.events.READY, {
        duration: player.getDuration()
      });
      record(analytics.events.PLAY);
    });

    player.on('pause', function() {
      if (!levelsChanged && !firstSample) {
        record(analytics.events.PAUSE, {
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

      record(analytics.events.TIMECHANGED, {
        currentTime: player.getPosition()
      });
    });

    player.on('audioTrackChanged', function(event) {
      console.log('AUDIO: ' + JSON.stringify(event));
    });

    player.on('visualQuality', function(event) {
      record(analytics.events.VIDEO_CHANGE, {
        width      : event.level.width,
        height     : event.level.height,
        bitrate    : event.level.bitrate,
        currentTime: player.getPosition()
      });
    });

    player.on('seek', function() {
      record(analytics.events.SEEK, {
        currentTime: player.getPosition()
      });
    });

    player.on('bufferChange', function() {
      record(analytics.events.START_BUFFERING, {
        currentTime: player.getPosition()
      });
    });

    player.on('seeked', function() {
      record(analytics.events.END_BUFFERING, {
        currentTime: player.getPosition()
      });
    });

    player.on('qualityChange', function(event) {
      console.log(JSON.stringify(event));
    });

    player.on('fullscreen', function(event) {
      if (event.fullscreen == true) {
        record(analytics.events.START_FULLSCREEN, {
          currentTime: player.getPosition()
        });
      }
      else {
        record(analytics.events.END_FULLSCREEN, {
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
        record(analytics.events.SCREEN_RESIZE, {
          currentTime: player.getPosition()
        });
      }
    });

    player.on('error', function(event) {
      record(analytics.events.ERROR, {
        message    : event.message,
        currentTime: player.getPosition()
      });
    });

    player.on('complete', function() {
      record(analytics.events.PLAYBACK_FINISHED);
    });

    window.addEventListener('unload', function() {
      record(analytics.events.UNLOAD, {
        currentTime: player.getPosition()
      });
    });
  };
};
