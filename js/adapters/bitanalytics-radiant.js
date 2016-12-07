/**
 * Created by Bitmovin on 23.09.2016.
 */

function registerEvents(record) {
  var skipInitSeek = true;
  var lastQuality = null;

  this.register = function(player) {
    player.addEventListener('loadstart', function() {
      record(analytics.events.SOURCE_LOADED);
    });

    player.addEventListener('ready', function() {
      record(analytics.events.READY, {
        type      : player.getPlayerMode(),
        version   : player.getPlayerVersion(),
        streamType: player.getStreamType()
        //isLive:     player.isLive(),
        //videoId:    player.getConfig().source.videoId,
        //userId:     player.getConfig().source.userId
      });
    });

    player.addEventListener('durationchange', function() {
      record(analytics.events.READY, {
        duration: toSeconds(player.getDuration())
      });
    });

    player.addEventListener('play', function() {
      record(analytics.events.PLAY);
    });

    player.addEventListener('timeupdate', function() {

      /**
       * get video qualities
       */
      var quality = player.getBitrates()[player.getCurrentBitrateIndex()];
      if (JSON.stringify(quality) != JSON.stringify(lastQuality)) {
        record(analytics.events.VIDEO_CHANGE, {
          width      : quality.width,
          height     : quality.height,
          bitrate    : quality.bitrate,
          currentTime: toSeconds(player.getCurrentTime())
        });
        lastQuality = quality;
      }

      record(analytics.events.TIMECHANGED, {
        currentTime: toSeconds(player.getCurrentTime())
      });
    });

    player.addEventListener('pause', function() {

      /**
       * prevent player to raise pause event during playback finish
       */
      if (player.getCurrentTime() < player.getDuration()) {
        record(analytics.events.PAUSE, {
          currentTime: toSeconds(player.getCurrentTime())
        });
      }
    });

    player.addEventListener('seeking', function() {
      if (!skipInitSeek) {
        record(analytics.events.SEEK, {
          currentTime: toSeconds(player.getCurrentTime())
        });
      }
    });

    player.addEventListener('waiting', function() {
      record(analytics.events.START_BUFFERING, {
        currentTime: toSeconds(player.getCurrentTime())
      });
    });

    player.addEventListener('seeked', function() {
      if (!skipInitSeek) {
        record(analytics.events.END_BUFFERING, {
          currentTime: toSeconds(player.getCurrentTime())
        });
      }
      else {
        skipInitSeek = false;
      }

    });

    player.addEventListener('enterfullscreen', function() {
      record(analytics.events.START_FULLSCREEN, {
        currentTime: toSeconds(player.getCurrentTime())
      });
    });

    player.addEventListener('exitfullscreen', function() {
      record(analytics.events.END_FULLSCREEN, {
        currentTime: toSeconds(player.getCurrentTime())
      });
    });

    player.addEventListener('error', function() {
      record(analytics.events.ERROR, {
        message    : 'Radiant error occurs',
        currentTime: player.getCurrentTime()
      });
    });

    rmpplayer.addEventListener('ended', function() {
      record(analytics.events.PLAYBACK_FINISHED);
    });

    player.addEventListener('qualitychangestarted', function() {
      console.log('SWITCH');
    });

    player.addEventListener('adloaded', function() {
      record(analytics.events.START_AD);
    });

    player.addEventListener('adcomplete', function() {
      record(analytics.events.END_AD, {
        currentTime: toSeconds(player.getCurrentTime())
      });
    });

    window.addEventListener('unload', function() {
      record(analytics.events.UNLOAD, {
        currentTime: toSeconds(player.getCurrentTime())
      });
    });
  };

  function toSeconds(time) {
    return time / 1000;
  }
}
