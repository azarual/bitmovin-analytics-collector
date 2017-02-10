/**
 * Created by lkroepfl on 12.01.2017.
 */
import Events from '../enums/Events'

class Bitmovin7Adapter {
  constructor(player, eventCallback) {
    this.onBeforeUnLoadEvent = false;
    this.player = player;
    this.eventCallback = eventCallback;
    this.register();
  }

  register() {
    this.player.addEventHandler(bitmovin.player.EVENT.ON_SOURCE_LOADED, (event) => {
      let autoplay = false;
      if (this.player.getConfig().playback && this.player.getConfig().playback.autoplay) {
        autoplay = this.player.getConfig().playback.autoplay;
      }

      const config = this.player.getConfig();
      let source = {};
      if (config.source) {
        source = {
          videoId: config.source.videoId,
          userId : config.source.userId,
          mpdUrl : config.source.dash,
          m3u8Url: config.source.hls,
          progUrl: config.source.progressive,
        };
      }

      this.eventCallback(Events.SOURCE_LOADED, {
        isLive           : this.player.isLive(),
        version          : this.player.version,
        type             : this.player.getPlayerType(),
        duration         : this.player.getDuration(),
        streamType       : this.player.getStreamType(),
        videoId          : source.videoId,
        userId           : source.userId,
        mpdUrl           : source.dash,
        m3u8Url          : source.hls,
        progUrl          : source.progressive,
        videoWindowWidth : this.player.getFigure().offsetWidth,
        videoWindowHeight: this.player.getFigure().offsetHeight,
        isMuted          : this.player.isMuted(),
        autoplay
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_READY, () => {
      let autoplay = false;
      if (this.player.getConfig().playback && this.player.getConfig().playback.autoplay) {
        autoplay = this.player.getConfig().playback.autoplay;
      }

      const config = this.player.getConfig();
      let source = {};
      if (config.source) {
        source = {
          videoId: config.source.videoId,
          userId : config.source.userId,
          mpdUrl : config.source.dash,
          m3u8Url: config.source.hls,
          progUrl: config.source.progressive,
        };
      }

      this.eventCallback(Events.READY, {
        isLive           : this.player.isLive(),
        version          : this.player.version,
        type             : this.player.getPlayerType(),
        duration         : this.player.getDuration(),
        streamType       : this.player.getStreamType(),
        videoId          : source.videoId,
        userId           : source.userId,
        mpdUrl           : source.dash,
        m3u8Url          : source.hls,
        progUrl          : source.progressive,
        videoWindowWidth : this.player.getFigure().offsetWidth,
        videoWindowHeight: this.player.getFigure().offsetHeight,
        isMuted          : this.player.isMuted(),
        autoplay
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_CAST_STARTED, (event) => {
      this.eventCallback(Events.START_CAST, event);
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_CAST_STOPPED, () => {
      this.eventCallback(Events.END_CAST);
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_PLAY, () => {
      this.eventCallback(Events.PLAY, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_PAUSED, () => {
      this.eventCallback(Events.PAUSE, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_TIME_CHANGED, () => {
      this.eventCallback(Events.TIMECHANGED, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_SEEK, () => {
      this.eventCallback(Events.SEEK, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_SEEKED, () => {
      this.eventCallback(Events.SEEKED, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_STALL_STARTED, () => {
      this.eventCallback(Events.START_BUFFERING);
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_STALL_ENDED, () => {
      this.eventCallback(Events.END_BUFFERING, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_AUDIO_PLAYBACK_QUALITY_CHANGED, () => {
      const quality = this.player.getPlaybackAudioData();

      this.eventCallback(Events.AUDIO_CHANGE, {
        bitrate      : quality.bitrate,
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_VIDEO_PLAYBACK_QUALITY_CHANGED, () => {
      const quality = this.player.getPlaybackVideoData();

      this.eventCallback(Events.VIDEO_CHANGE, {
        width        : quality.width,
        height       : quality.height,
        bitrate      : quality.bitrate,
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_FULLSCREEN_ENTER, () => {
      this.eventCallback(Events.START_FULLSCREEN, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_FULLSCREEN_EXIT, () => {
      this.eventCallback(Events.END_FULLSCREEN, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_AD_STARTED, () => {
      this.eventCallback(Events.START_AD, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_AD_FINISHED, () => {
      this.eventCallback(Events.END_AD, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_MUTED, () => {
      this.eventCallback(Events.MUTE, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_UNMUTED, () => {
      this.eventCallback(Events.UN_MUTE, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_ERROR, (event) => {
      this.eventCallback(Events.ERROR, {
        code   : event.code,
        message: event.message
      });
    });

    this.player.addEventHandler(bitmovin.player.EVENT.ON_PLAYBACK_FINISHED, () => {
      this.eventCallback(Events.PLAYBACK_FINISHED, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    window.onunload = window.onbeforeunload = () => {
      if (!this.onBeforeUnLoadEvent) {
        this.onBeforeUnLoadEvent = true;
        this.eventCallback(Events.UNLOAD, {
          currentTime  : this.player.getCurrentTime(),
          droppedFrames: this.player.getDroppedFrames()
        });
      }
    };
  };
}

export default Bitmovin7Adapter
