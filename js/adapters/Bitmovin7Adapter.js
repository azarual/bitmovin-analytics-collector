/**
 * Created by lkroepfl on 12.01.2017.
 */

class Bitmovin7Adapter {
  static onBeforeUnLoadEvent = false;
  static eventCallback;
  static player;

  constructor(player) {
    this.player = player;
    this.register();
  }

  register() {
    this.player.addEventHandler(bitmovin.player.EVENT.ON_SOURCE_LOADED, function() {
      this.eventCallback(bitmovin.analytics.Events.SOURCE_LOADED);
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_READY, function() {
      this.eventCallback(bitmovin.analytics.Events.READY, {
        isLive           : this.player.isLive(),
        version          : this.player.version,
        type             : this.player.getPlayerType(),
        duration         : this.player.getDuration(),
        streamType       : this.player.getStreamType(),
        videoId          : this.player.getConfig().source.videoId,
        userId           : this.player.getConfig().source.userId,
        mpdUrl           : this.player.getConfig().source.dash,
        m3u8Url          : this.player.getConfig().source.hls,
        progUrl          : this.player.getConfig().source.progressive,
        videoWindowWidth : this.player.getFigure().offsetWidth,
        videoWindowHeight: this.player.getFigure().offsetHeight
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_CAST_START, function() {
      this.eventCallback(bitmovin.analytics.Events.START_CAST);
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_CAST_STOPPED, function() {
      this.eventCallback(bitmovin.analytics.Events.END_CAST);
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_PLAY, function() {
      this.eventCallback(bitmovin.analytics.Events.PLAY, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_PAUSED, function() {
      this.eventCallback(bitmovin.analytics.Events.PAUSE, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_TIME_CHANGED, function() {
      this.eventCallback(bitmovin.analytics.Events.TIMECHANGED, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_SEEK, function() {
      this.eventCallback(bitmovin.analytics.Events.SEEK, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_SEEKED, function() {
      this.eventCallback(bitmovin.analytics.Events.SEEKED, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_STALL_STARTED, function() {
      this.eventCallback(bitmovin.analytics.Events.START_BUFFERING);
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_STALL_ENDED, function() {
      this.eventCallback(bitmovin.analytics.Events.END_BUFFERING, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_AUDIO_PLAYBACK_QUALITY_CHANGED, function() {
      const quality = player.getPlaybackAudioData();

      this.eventCallback(bitmovin.analytics.Events.AUDIO_CHANGE, {
        bitrate      : quality.bitrate,
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_VIDEO_PLAYBACK_QUALITY_CHANGED, function() {
      const quality = player.getPlaybackVideoData();

      this.eventCallback(bitmovin.analytics.Events.VIDEO_CHANGE, {
        width        : quality.width,
        height       : quality.height,
        bitrate      : quality.bitrate,
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_FULLSCREEN_ENTER, function() {
      this.eventCallback(bitmovin.analytics.Events.START_FULLSCREEN, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_FULLSCREEN_EXIT, function() {
      this.eventCallback(bitmovin.analytics.Events.END_FULLSCREEN, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_AD_STARTED, function() {
      this.eventCallback(bitmovin.analytics.Events.START_AD, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_AD_FINISHED, function() {
      this.eventCallback(bitmovin.analytics.Events.END_AD, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
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
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
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

  setEventCallback(callback) {
    this.eventCallback = callback;
  };
}

export default Bitmovin7Adapter
