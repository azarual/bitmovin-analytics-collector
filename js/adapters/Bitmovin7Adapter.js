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

    const getProgConfigFromProgressiveConfig = (progressive) => {
      if (!progressive) {
        return {
          progUrl: undefined,
          progBitrate: undefined
        };
      }

      if (typeof progressive === 'string') {
        return {
          progUrl: progressive,
          progBitrate: 0
        };
      }

      if (Array.isArray(progressive)) {
        const playbackVideoData = this.player.getPlaybackVideoData();
        const progressiveArrayIndex = parseInt(playbackVideoData.id) || 0;
        return {
          progUrl: progressive[progressiveArrayIndex].url,
          progBitrate: progressive[progressiveArrayIndex].bitrate || 0,
        };
      }

      if (typeof progressive === 'object') {
        return {
          progUrl: progressive.url,
          progBitrate: progressive.bitrate || 0
        };
      }
    };

    this.player.addEventHandler(this.player.EVENT.ON_SOURCE_LOADED, (event) => {
      let autoplay = false;
      if (this.player.getConfig().playback && this.player.getConfig().playback.autoplay) {
        autoplay = this.player.getConfig().playback.autoplay;
      }

      const config = this.player.getConfig();
      let source = {};
      const progConf = getProgConfigFromProgressiveConfig(config.source.progressive);
      if (config.source) {
        source = {
          mpdUrl : config.source.dash,
          m3u8Url: config.source.hls,
          progUrl: progConf.progUrl,
          progBitrate: progConf.progBitrate
        };
      }

      this.eventCallback(Events.SOURCE_LOADED, {
        isLive           : this.player.isLive(),
        version          : this.player.version,
        type             : this.player.getPlayerType(),
        duration         : this.player.getDuration(),
        streamType       : this.player.getStreamType(),
        mpdUrl           : source.mpdUrl,
        m3u8Url          : source.m3u8Url,
        progUrl          : source.progUrl,
        progBitrate      : source.progBitrate,
        videoWindowWidth : this.player.getFigure().offsetWidth,
        videoWindowHeight: this.player.getFigure().offsetHeight,
        isMuted          : this.player.isMuted(),
        autoplay
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_READY, () => {
      let autoplay = false;
      if (this.player.getConfig().playback && this.player.getConfig().playback.autoplay) {
        autoplay = this.player.getConfig().playback.autoplay;
      }

      const config = this.player.getConfig();
      let source = {};
      const progConf = getProgConfigFromProgressiveConfig(config.source.progressive);
      if (config.source) {
        source = {
          videoId: config.source.videoId,
          userId : config.source.userId,
          mpdUrl : config.source.dash,
          m3u8Url: config.source.hls,
          progUrl: progConf.progUrl,
          progBitrate: progConf.progBitrate
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
        mpdUrl           : source.mpdUrl,
        m3u8Url          : source.m3u8Url,
        progUrl          : source.progUrl,
        progBitrate      : source.progBitrate,
        videoWindowWidth : this.player.getFigure().offsetWidth,
        videoWindowHeight: this.player.getFigure().offsetHeight,
        isMuted          : this.player.isMuted(),
        autoplay
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_CAST_STARTED, (event) => {
      this.eventCallback(Events.START_CAST, event);
    });

    this.player.addEventHandler(this.player.EVENT.ON_CAST_STOPPED, () => {
      this.eventCallback(Events.END_CAST, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_PLAY, () => {
      this.eventCallback(Events.PLAY, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_PAUSED, () => {
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

    this.player.addEventHandler(this.player.EVENT.ON_STALL_STARTED, () => {
      this.eventCallback(Events.START_BUFFERING, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_STALL_ENDED, () => {
      this.eventCallback(Events.END_BUFFERING, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_AUDIO_PLAYBACK_QUALITY_CHANGED, () => {
      const quality = this.player.getPlaybackAudioData();

      this.eventCallback(Events.AUDIO_CHANGE, {
        bitrate      : quality.bitrate,
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_VIDEO_PLAYBACK_QUALITY_CHANGED, () => {
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

    this.player.addEventHandler(this.player.EVENT.ON_MUTED, () => {
      this.eventCallback(Events.MUTE, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_UNMUTED, () => {
      this.eventCallback(Events.UN_MUTE, {
        currentTime  : this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames()
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_ERROR, (event) => {
      this.eventCallback(Events.ERROR, {
        code   : event.code,
        message: event.message,
        currentTime  : this.player.getCurrentTime()
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

export default Bitmovin7Adapter
