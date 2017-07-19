/**
 * Created by lkroepfl on 13.09.2016.
 */
import Events from '../enums/Events'

class BitmovinAdapter {
  constructor(player, eventCallback) {
    this.onBeforeUnLoadEvent = false;
    this.player = player;
    this.eventCallback = eventCallback;
    this.register();
  }

  register() {
    this.player.addEventHandler(this.player.EVENT.ON_SOURCE_LOADED, () => {
      this.eventCallback(Events.SOURCE_LOADED);
    });

    this.player.addEventHandler(this.player.EVENT.ON_READY, () => {
      let autoplay = false;
      if (this.player.getConfig().playback && this.player.getConfig().playback.autoplay) {
        autoplay = this.player.getConfig().playback.autoplay;
      }

      this.eventCallback(Events.READY, {
        isLive           : this.player.isLive(),
        version          : this.player.getVersion(),
        type             : this.player.getPlayerType(),
        duration         : this.player.getDuration(),
        streamType       : this.player.getStreamType(),
        videoId          : this.player.getConfig().source.videoId,
        userId           : this.player.getConfig().source.userId,
        mpdUrl           : this.player.getConfig().source.dash,
        m3u8Url          : this.player.getConfig().source.hls,
        progUrl          : this.player.getConfig().source.progressive,
        videoWindowWidth : this.player.getFigure().offsetWidth,
        videoWindowHeight: this.player.getFigure().offsetHeight,
        isMuted          : this.player.isMuted(),
        autoplay
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_CAST_START, () => {
      this.eventCallback(Events.START_CAST);
    });

    this.player.addEventHandler(this.player.EVENT.ON_CAST_STOP, () => {
      this.eventCallback(Events.END_CAST);
    });

    this.player.addEventHandler(this.player.EVENT.ON_PLAY, () => {
      this.eventCallback(Events.PLAY, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_PAUSE, () => {
      this.eventCallback(Events.PAUSE, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_TIME_CHANGED, () => {
      this.eventCallback(Events.TIMECHANGED, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_SEEK, () => {
      this.eventCallback(Events.SEEK, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_SEEKED, () => {
      this.eventCallback(Events.SEEKED, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_START_BUFFERING, () => {
      this.eventCallback(Events.START_BUFFERING);
    });

    this.player.addEventHandler(this.player.EVENT.ON_STOP_BUFFERING, () => {
      this.eventCallback(Events.END_BUFFERING, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_AUDIO_PLAYBACK_QUALITY_CHANGE, () => {
      const quality = this.player.getPlaybackAudioData();

      this.eventCallback(Events.AUDIO_CHANGE, {
        bitrate      : quality.bitrate,
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_VIDEO_PLAYBACK_QUALITY_CHANGE, () => {
      const quality = this.player.getPlaybackVideoData();

      this.eventCallback(Events.VIDEO_CHANGE, {
        width        : quality.width,
        height       : quality.height,
        bitrate      : quality.bitrate,
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_FULLSCREEN_ENTER, () => {
      this.eventCallback(Events.START_FULLSCREEN, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });
    this.onBeforeUnLoadEvent = false;

    this.player.addEventHandler(this.player.EVENT.ON_FULLSCREEN_EXIT, () => {
      this.eventCallback(Events.END_FULLSCREEN, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_AD_STARTED, () => {
      this.eventCallback(Events.START_AD, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_AD_FINISHED, () => {
      this.eventCallback(Events.END_AD, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_MUTE, () => {
      this.eventCallback(Events.MUTE, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_UNMUTE, () => {
      this.eventCallback(Events.UN_MUTE, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_ERROR, (event) => {
      this.eventCallback(Events.ERROR, {
        code   : event.code,
        message: event.message
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_PLAYBACK_FINISHED, () => {
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

export default BitmovinAdapter
