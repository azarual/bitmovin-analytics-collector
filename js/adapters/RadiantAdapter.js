/**
 * Created by Bitmovin on 23.09.2016.
 */
var RadiantAdapter = function(player) {
  var skipInitSeek = true;
  var lastQuality = null;
  var eventCallback;

  var register = function() {
    player.addEventListener('loadstart', function() {
      eventCallback(analytics.events.SOURCE_LOADED);
    });

    player.addEventListener('ready', function() {
      eventCallback(analytics.events.READY, {
        type      : player.getPlayerMode(),
        version   : player.getPlayerVersion(),
        streamType: player.getStreamType()
        //isLive:     player.isLive(),
        //videoId:    player.getConfig().source.videoId,
        //userId:     player.getConfig().source.userId
      });
    });

    player.addEventListener('durationchange', function() {
      eventCallback(analytics.events.READY, {
        duration: toSeconds(player.getDuration())
      });
    });

    player.addEventListener('play', function() {
      eventCallback(analytics.events.PLAY);
    });

    player.addEventListener('timeupdate', function() {

      /**
       * get video qualities
       */
      var quality = player.getBitrates()[player.getCurrentBitrateIndex()];
      if (JSON.stringify(quality) != JSON.stringify(lastQuality)) {
        eventCallback(analytics.events.VIDEO_CHANGE, {
          width      : quality.width,
          height     : quality.height,
          bitrate    : quality.bitrate,
          currentTime: toSeconds(player.getCurrentTime())
        });
        lastQuality = quality;
      }

      eventCallback(analytics.events.TIMECHANGED, {
        currentTime: toSeconds(player.getCurrentTime())
      });
    });

    player.addEventListener('pause', function() {

      /**
       * prevent player to raise pause event during playback finish
       */
      if (player.getCurrentTime() < player.getDuration()) {
        eventCallback(analytics.events.PAUSE, {
          currentTime: toSeconds(player.getCurrentTime())
        });
      }
    });

    player.addEventListener('seeking', function() {
      if (!skipInitSeek) {
        eventCallback(analytics.events.SEEK, {
          currentTime: toSeconds(player.getCurrentTime())
        });
      }
    });

    player.addEventListener('waiting', function() {
      eventCallback(analytics.events.START_BUFFERING, {
        currentTime: toSeconds(player.getCurrentTime())
      });
    });

    player.addEventListener('seeked', function() {
      if (!skipInitSeek) {
        eventCallback(analytics.events.END_BUFFERING, {
          currentTime: toSeconds(player.getCurrentTime())
        });
      }
      else {
        skipInitSeek = false;
      }

    });

    player.addEventListener('enterfullscreen', function() {
      eventCallback(analytics.events.START_FULLSCREEN, {
        currentTime: toSeconds(player.getCurrentTime())
      });
    });

    player.addEventListener('exitfullscreen', function() {
      eventCallback(analytics.events.END_FULLSCREEN, {
        currentTime: toSeconds(player.getCurrentTime())
      });
    });

    player.addEventListener('error', function() {
      eventCallback(analytics.events.ERROR, {
        message    : 'Radiant error occurs',
        currentTime: player.getCurrentTime()
      });
    });

    rmpplayer.addEventListener('ended', function() {
      eventCallback(analytics.events.PLAYBACK_FINISHED);
    });

    player.addEventListener('qualitychangestarted', function() {
      console.log('SWITCH');
    });

    player.addEventListener('adloaded', function() {
      eventCallback(analytics.events.START_AD);
    });

    player.addEventListener('adcomplete', function() {
      eventCallback(analytics.events.END_AD, {
        currentTime: toSeconds(player.getCurrentTime())
      });
    });

    window.addEventListener('unload', function() {
      eventCallback(analytics.events.UNLOAD, {
        currentTime: toSeconds(player.getCurrentTime())
      });
    });
  };

  function toSeconds(time) {
    return time / 1000;
  }

  var setEventCallback = function(callback) {
    eventCallback = callback;
  };

  register();

  return {
    setEventCallback: setEventCallback
  };
};
