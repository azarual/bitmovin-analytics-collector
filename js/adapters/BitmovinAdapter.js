/**
 * Created by lkroepfl on 13.09.2016.
 */

class BitmovinAdapter {
  static onBeforeUnLoadEvent = false;
  static eventCallback;
  static player;

  constructor(player) {
    this.player = player;
    this.register()
  }

  register = function() {
    this.this.player.addEventHandler(bitmovin.player.EVENT.ON_SOURCE_LOADED, function() {
      this.eventCallback(bitmovin.analytics.Events.SOURCE_LOADED);
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_READY, function() {
      this.eventCallback(bitmovin.analytics.Events.READY, {
        isLive           : player.isLive(),
        version          : player.getVersion(),
        type             : player.getPlayerType(),
        duration         : player.getDuration(),
        streamType       : player.getStreamType(),
        videoId          : player.getConfig().source.videoId,
        userId           : player.getConfig().source.userId,
        mpdUrl           : player.getConfig().source.dash,
        m3u8Url          : player.getConfig().source.hls,
        progUrl          : player.getConfig().source.progressive,
        videoWindowWidth : player.getFigure().offsetWidth,
        videoWindowHeight: player.getFigure().offsetHeight
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_CAST_START, function() {
      this.eventCallback(bitmovin.analytics.Events.START_CAST);
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_CAST_STOP, function() {
      this.eventCallback(bitmovin.analytics.Events.END_CAST);
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_PLAY, function() {
      this.eventCallback(bitmovin.analytics.Events.PLAY, {
        droppedFrames: player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_PAUSE, function() {
      this.eventCallback(bitmovin.analytics.Events.PAUSE, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_TIME_CHANGED, function() {
      this.eventCallback(bitmovin.analytics.Events.TIMECHANGED, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_SEEK, function() {
      this.eventCallback(bitmovin.analytics.Events.SEEK, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_SEEKED, function() {
      this.eventCallback(bitmovin.analytics.Events.SEEKED, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_START_BUFFERING, function() {
      this.eventCallback(bitmovin.analytics.Events.START_BUFFERING);
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_STOP_BUFFERING, function() {
      this.eventCallback(bitmovin.analytics.Events.END_BUFFERING, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_AUDIO_PLAYBACK_QUALITY_CHANGE, function() {
      var quality = player.getPlaybackAudioData();

      this.eventCallback(bitmovin.analytics.Events.AUDIO_CHANGE, {
        bitrate      : quality.bitrate,
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_VIDEO_PLAYBACK_QUALITY_CHANGE, function() {
      var quality = player.getPlaybackVideoData();

      this.eventCallback(bitmovin.analytics.Events.VIDEO_CHANGE, {
        width        : quality.width,
        height       : quality.height,
        bitrate      : quality.bitrate,
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_FULLSCREEN_ENTER, function() {
      this.eventCallback(bitmovin.analytics.Events.START_FULLSCREEN, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_FULLSCREEN_EXIT, function() {
      this.eventCallback(bitmovin.analytics.Events.END_FULLSCREEN, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_AD_STARTED, function() {
      this.eventCallback(bitmovin.analytics.Events.START_AD);
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_AD_FINISHED, function() {
      this.eventCallback(bitmovin.analytics.Events.END_AD, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_ERROR, function(event) {
      this.eventCallback(bitmovin.analytics.Events.ERROR, {
        code   : event.code,
        message: event.message
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_PLAYBACK_FINISHED, function() {
      this.eventCallback(bitmovin.analytics.Events.PLAYBACK_FINISHED, {
        currentTime  : player.getCurrentTime(),
        droppedFrames: player.getDroppedFrames()
      });
    });

    window.onunload = window.onbeforeunload = function() {
      if (!this.onBeforeUnLoadEvent) {
        this.onBeforeUnLoadEvent = true;
        this.eventCallback(bitmovin.analytics.Events.UNLOAD, {
          currentTime  : this.player.getCurrentTime(),
          droppedFrames: this.player.getDroppedFrames()
        });
      }
    };
  };

  setEventCallback = function(callback) {
    this.eventCallback = callback;
  };
}

export default BitmovinAdapter
