/**
 * Created by Bitmovin on 13.09.2016.
 */

function Adapter(record) {
  var onBeforeUnLoadEvent = false;

  this.register = function(player) {
    player.addEventHandler(bitmovin.player.EVENT.ON_SOURCE_LOADED, function() {
      record(Events.SOURCE_LOADED);
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_READY, function() {
      record(Events.READY, {
        isLive    : player.isLive(),
        version   : player.getVersion(),
        type      : player.getPlayerType(),
        duration  : player.getDuration(),
        streamType: player.getStreamType(),
        videoId   : player.getConfig().source.videoId,
        userId    : player.getConfig().source.userId,
        mpdUrl    : player.getConfig().source.dash,
        m3u8Url   : player.getConfig().source.hls,
        progUrl   : player.getConfig().source.progressive,
        figure    : player.getFigure()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_CAST_START, function() {
      record(Events.START_CAST);
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_CAST_STOP, function() {
      record(Events.END_CAST);
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_PLAY, function() {
      record(Events.PLAY, {
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_PAUSE, function() {
      record(Events.PAUSE, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_TIME_CHANGED, function() {
      record(Events.TIMECHANGED, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_SEEK, function() {
      record(Events.SEEK, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_SEEKED, function() {
      record(Events.SEEKED, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_START_BUFFERING, function() {
      record(Events.START_BUFFERING);
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_STOP_BUFFERING, function() {
      record(Events.END_BUFFERING, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_AUDIO_PLAYBACK_QUALITY_CHANGE, function() {
      var quality = player.getPlaybackAudioData();

      record(Events.AUDIO_CHANGE, {
        bitrate      : quality.bitrate,
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_VIDEO_PLAYBACK_QUALITY_CHANGE, function() {
      var quality = player.getPlaybackVideoData();

      record(Events.VIDEO_CHANGE, {
        width        : quality.width,
        height       : quality.height,
        bitrate      : quality.bitrate,
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_FULLSCREEN_ENTER, function() {
      record(Events.START_FULLSCREEN, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_FULLSCREEN_EXIT, function() {
      record(Events.END_FULLSCREEN, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_AD_STARTED, function() {
      record(Events.START_AD);
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_AD_FINISHED, function() {
      record(Events.END_AD, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_ERROR, function(event) {
      record(Events.ERROR, {
        code   : event.code,
        message: event.message
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_PLAYBACK_FINISHED, function() {
      record(Events.PLAYBACK_FINISHED, {
        droppedFrames: player.getDroppedFrames()
      });
    });

    window.onunload = window.onbeforeunload = function() {
      if (!onBeforeUnLoadEvent) {
        onBeforeUnLoadEvent = true;
        record(Events.UNLOAD, {
          currentTime  : player.getCurrentTime(),
          droppedFrames: player.getDroppedFrames()
        });
      }
    };
  };
}
