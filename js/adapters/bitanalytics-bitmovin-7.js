/**
 * Created by lkroepfl on 12.01.2017.
 */

var Bitmovin7Adapter = function(player) {
  var onBeforeUnLoadEvent = false;
  var eventCallback;

  var register = function() {
    player.addEventHandler(bitmovin.player.EVENT.ON_SOURCE_LOADED, function() {
      eventCallback(bitmovin.analytics.Events.SOURCE_LOADED);
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_READY, function() {
      eventCallback(bitmovin.analytics.Events.READY, {
        isLive    : player.isLive(),
        version   : player.version,
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
      eventCallback(bitmovin.analytics.Events.START_CAST);
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_CAST_STOPPE, function() {
      eventCallback(bitmovin.analytics.Events.END_CAST);
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_PLAY, function() {
      eventCallback(bitmovin.analytics.Events.PLAY, {
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_PAUSED, function() {
      eventCallback(bitmovin.analytics.Events.PAUSE, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_TIME_CHANGED, function() {
      eventCallback(bitmovin.analytics.Events.TIMECHANGED, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_SEEK, function() {
      eventCallback(bitmovin.analytics.Events.SEEK, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_SEEKED, function() {
      eventCallback(bitmovin.analytics.Events.SEEKED, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_STALL_STARTED, function() {
      eventCallback(bitmovin.analytics.Events.START_BUFFERING);
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_STALL_ENDED, function() {
      eventCallback(bitmovin.analytics.Events.END_BUFFERING, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_AUDIO_PLAYBACK_QUALITY_CHANGED, function() {
      var quality = player.getPlaybackAudioData();

      eventCallback(bitmovin.analytics.Events.AUDIO_CHANGE, {
        bitrate      : quality.bitrate,
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_VIDEO_PLAYBACK_QUALITY_CHANGED, function() {
      var quality = player.getPlaybackVideoData();

      eventCallback(bitmovin.analytics.Events.VIDEO_CHANGE, {
        width        : quality.width,
        height       : quality.height,
        bitrate      : quality.bitrate,
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_FULLSCREEN_ENTER, function() {
      eventCallback(bitmovin.analytics.Events.START_FULLSCREEN, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_FULLSCREEN_EXIT, function() {
      eventCallback(bitmovin.analytics.Events.END_FULLSCREEN, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_AD_STARTED, function() {
      eventCallback(bitmovin.analytics.Events.START_AD);
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_AD_FINISHED, function() {
      eventCallback(bitmovin.analytics.Events.END_AD, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_ERROR, function(event) {
      eventCallback(bitmovin.analytics.Events.ERROR, {
        code   : event.code,
        message: event.message
      });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_PLAYBACK_FINISHED, function() {
      eventCallback(bitmovin.analytics.Events.PLAYBACK_FINISHED, {
        droppedFrames: player.getDroppedFrames()
      });
    });

    window.onunload = window.onbeforeunload = function() {
      if (!onBeforeUnLoadEvent) {
        onBeforeUnLoadEvent = true;
        eventCallback(bitmovin.analytics.Events.UNLOAD, {
          currentTime  : player.getCurrentTime(),
          droppedFrames: player.getDroppedFrames()
        });
      }
    };
  };

  var setEventCallback = function(callback) {
    eventCallback = callback;
  };

  register();

  return {
    setEventCallback: setEventCallback
  };
};
