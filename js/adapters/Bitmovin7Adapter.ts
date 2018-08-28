import {Event} from '../enums/Event';
import {Player} from '../enums/Player';
import {PlayerSourceConfig} from '../types/PlayerSourceConfig';
import 'bitmovin-player-ui/dist/js/framework/main';
import {Adapter} from '../types/Adapter';
import {AdapterEventCallback} from '../types/AdapterEventCallback';
import {DrmPerformanceInfo} from '../types/DrmPerformanceInfo';

export class Bitmovin7Adapter implements Adapter {
  onBeforeUnLoadEvent: boolean;
  player: bitmovin.PlayerAPI;
  eventCallback: AdapterEventCallback;
  drmPerformanceInfo: DrmPerformanceInfo;

  constructor(player: bitmovin.PlayerAPI, eventCallback: AdapterEventCallback) {
    this.onBeforeUnLoadEvent = false;
    this.player = player;
    this.eventCallback = eventCallback;
    this.drmPerformanceInfo = {drmUsed: false};

    this.register();
  }

  getPlayerName() {
    return Player.BITMOVIN;
  }

  register() {
    const getProgConfigFromProgressiveConfig = (
      progressive:
        | undefined
        | string
        | bitmovin.PlayerAPI.ProgressiveSourceConfig[]
        | bitmovin.PlayerAPI.ProgressiveSourceConfig
    ) => {
      if (!progressive) {
        return {
          progUrl: undefined,
          progBitrate: undefined,
        };
      }

      if (typeof progressive === 'string') {
        return {
          progUrl: progressive,
          progBitrate: 0,
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
          progBitrate: progressive.bitrate || 0,
        };
      }
    };

    this.player.addEventHandler(this.player.EVENT.ON_SOURCE_UNLOADED, (event: bitmovin.PlayerAPI.PlayerEvent) => {
      this.eventCallback(Event.SOURCE_UNLOADED, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_SOURCE_LOADED, (event: bitmovin.PlayerAPI.PlayerEvent) => {
      let autoplay = false;
      if (this.player.getConfig().playback && this.player.getConfig().playback.autoplay) {
        autoplay = this.player.getConfig().playback.autoplay;
      }

      const config = this.player.getConfig();
      let source: PlayerSourceConfig = {};
      
      const progConf = getProgConfigFromProgressiveConfig(config.source.progressive);
      if (config.source) {
        source.mpdUrl = config.source.dash;
        source.m3u8Url = config.source.hls;
        source.progUrl = progConf ? progConf.progUrl : undefined;
        source.progBitrate = progConf ? progConf.progBitrate : undefined;
        source.videoTitle = config.source.title;
      }

      debugger;

      this.eventCallback(Event.SOURCE_LOADED, {
        isLive: this.player.isLive(),
        version: this.player.version,
        type: this.player.getPlayerType(),
        duration: this.player.getDuration(),
        streamType: this.player.getStreamType(),
        mpdUrl: source.mpdUrl,
        m3u8Url: source.m3u8Url,
        progUrl: source.progUrl,
        progBitrate: source.progBitrate,
        videoWindowWidth: this.player.getFigure().offsetWidth,
        videoWindowHeight: this.player.getFigure().offsetHeight,
        isMuted: this.player.isMuted(),
        autoplay,
        videoTitle: source.videoTitle
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_READY, () => {
      let autoplay = false;
      if (this.player.getConfig().playback && this.player.getConfig().playback.autoplay) {
        autoplay = this.player.getConfig().playback.autoplay;
      }

      const config = this.player.getConfig();
      let source: PlayerSourceConfig = {};
      const progConf = getProgConfigFromProgressiveConfig(config.source.progressive);
      if (config.source) {
        source.videoId = config.source.videoId;
        source.videoTitle = config.source.title;
        source.userId = config.source.userId;
        source.mpdUrl = config.source.dash;
        source.m3u8Url = config.source.hls;
        source.progUrl = progConf ? progConf.progUrl : undefined;
        source.progBitrate = progConf ? progConf.progBitrate : undefined;
      }

      debugger;

      this.eventCallback(Event.READY, {
        isLive: this.player.isLive(),
        version: this.player.version,
        type: this.player.getPlayerType(),
        duration: this.player.getDuration(),
        streamType: this.player.getStreamType(),
        videoId: source.videoId,
        userId: source.userId,
        mpdUrl: source.mpdUrl,
        m3u8Url: source.m3u8Url,
        progUrl: source.progUrl,
        progBitrate: source.progBitrate,
        videoWindowWidth: this.player.getFigure().offsetWidth,
        videoWindowHeight: this.player.getFigure().offsetHeight,
        isMuted: this.player.isMuted(),
        autoplay,
        videoTitle: source.videoTitle
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_CAST_STARTED, (event: bitmovin.PlayerAPI.PlayerEvent) => {
      this.eventCallback(Event.START_CAST, event);
    });

    this.player.addEventHandler(this.player.EVENT.ON_CAST_STOPPED, () => {
      this.eventCallback(Event.END_CAST, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_PLAY, () => {
      this.eventCallback(Event.PLAY, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_PAUSED, () => {
      this.eventCallback(Event.PAUSE, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_TIME_CHANGED, () => {
      this.eventCallback(Event.TIMECHANGED, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_SEEK, () => {
      this.eventCallback(Event.SEEK, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_SEEKED, () => {
      this.eventCallback(Event.SEEKED, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_STALL_STARTED, () => {
      this.eventCallback(Event.START_BUFFERING, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_STALL_ENDED, () => {
      this.eventCallback(Event.END_BUFFERING, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_AUDIO_PLAYBACK_QUALITY_CHANGED, () => {
      const quality = this.player.getPlaybackAudioData();

      this.eventCallback(Event.AUDIO_CHANGE, {
        bitrate: quality.bitrate,
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_VIDEO_PLAYBACK_QUALITY_CHANGED, () => {
      const quality = this.player.getPlaybackVideoData();

      this.eventCallback(Event.VIDEO_CHANGE, {
        width: quality.width,
        height: quality.height,
        bitrate: quality.bitrate,
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_FULLSCREEN_ENTER, () => {
      this.eventCallback(Event.START_FULLSCREEN, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_FULLSCREEN_EXIT, () => {
      this.eventCallback(Event.END_FULLSCREEN, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_AD_STARTED, () => {
      this.eventCallback(Event.START_AD, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_AD_FINISHED, () => {
      this.eventCallback(Event.END_AD, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_MUTED, () => {
      this.eventCallback(Event.MUTE, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_UNMUTED, () => {
      this.eventCallback(Event.UN_MUTE, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_ERROR, (event: any) => {
      this.eventCallback(Event.ERROR, {
        code: event.code,
        message: event.message,
        currentTime: this.player.getCurrentTime(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_PLAYBACK_FINISHED, () => {
      this.eventCallback(Event.PLAYBACK_FINISHED, {
        currentTime: this.player.getCurrentTime(),
        droppedFrames: this.player.getDroppedFrames(),
      });
    });

    this.player.addEventHandler(this.player.EVENT.ON_DOWNLOAD_FINISHED, (event: any) => {
      if (event.downloadType.indexOf('drm/license/') === 0) {
        this.drmPerformanceInfo.drmTime = event.downloadTime * 1000;
        this.drmPerformanceInfo.drmInfo = event.downloadType.replace('drm/license/', '');
        this.drmPerformanceInfo.drmUsed = true;
      }
    });

    window.onunload = window.onbeforeunload = () => {
      if (!this.onBeforeUnLoadEvent) {
        this.onBeforeUnLoadEvent = true;
        this.eventCallback(Event.UNLOAD, {
          currentTime: this.player.getCurrentTime(),
          droppedFrames: this.player.getDroppedFrames(),
        });
      }
    };
  }
}
