import Events from '../enums/Events'
class VideoJsAdapter {
  constructor(player, eventCallback) {
    this.onBeforeUnLoadEvent = false;
    this.player              = player;
    this.eventCallback       = eventCallback;
    this.register();
  }

  defaultEventsToTrack = [
    'loaded', 'start', 'end', 'seek', 'play', 'pause', 'error', 'playing'
  ];

  getStreamType(url) {
    if (url.endsWith('.m3u8')) {
      return 'hls';
    }
    if (url.endsWith('.mpd')) {
      return 'dash';
    }
    return 'progressive';
  }

  getStreamSources(url) {
    let mpdUrl       = null;
    let m3u8Url      = null;
    let progUrl      = null;
    const streamType = this.getStreamType(url);
    switch (streamType) {
      case 'hls':
        m3u8Url = url;
        break;
      case 'dash':
        mpdUrl = url;
        break;
      default:
        progUrl = url;
    }
    return {
      mpdUrl,
      m3u8Url,
      progUrl
    }
  }

  getVideoWindowDimensions(player) {
    return {
      width : player.width(),
      height: player.height()
    }
  }

  getVideoSourceDimensions(tech) {
    return {
      videoWidth : tech.videoWidth(),
      videoHeight: tech.videoHeight()
    }
  }

  register() {
    this.defaultEventsToTrack.forEach((e) => {
      this.player.on(e, function() {
        console.log('Tracked Event', e);
      });
    });

    this.player.on('loadedmetadata', function() {
      const x = this;
    });

    this.player.ready(() => {
      const tech       = this.player.tech({IWillNotUseThisInPlugins: true});
      const streamType = this.getStreamType(this.player.currentSrc());
      const sources    = this.getStreamSources(this.player.currentSrc());
      const info       = {
        isLive     : false,
        version    : '1.5.11',
        type       : tech.sourceHandler_.options_.mode === 'html5' ? 'html5' : 'native',
        duration   : 0,
        streamType,
        autoplay   : this.player.autoplay(),
        ...sources,
        ...this.getVideoWindowDimensions(this),
        videoWidth : null,
        videoHeight: null,
        muted      : this.player.muted()
      };
      this.eventCallback(Events.READY, info);
    });

    this.player.on('playing', function() {
      this.eventCallback(Events.TIMECHANGED, {
        droppedFrames: 0
      });
    });
    this.player.on('play', function() {
      this.eventCallback(Events.PLAY)
    });
    this.player.on('pause', function() {
      this.eventCallback(Events.PAUSE)
    });
    this.player.on('error', function() {
      const error = this.error();
      this.eventCallback(Events.ERROR, {
        code   : error.code,
        message: error.message
      });
    });
    this.player.on('stalled', function() {
      this.eventCallback(Events.START_BUFFERING, {});
    });
  }
}

export default VideoJsAdapter
