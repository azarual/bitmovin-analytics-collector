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
    const that = this;
    this.defaultEventsToTrack.forEach((e) => {
      this.player.on(e, function() {
        console.log('Tracked Event', e);
      });
    });
    this.player.on('loadedmetadata', function() {
      const x = this;
    });
    this.player.ready(function() {
      const tech       = that.player.tech({IWillNotUseThisInPlugins: true});
      const streamType = that.getStreamType(that.player.currentSrc());
      const sources    = that.getStreamSources(that.player.currentSrc());
      const info       = {
        isLive     : false,
        version    : videojs.VERSION,
        type       : tech.sourceHandler_.options_.mode === 'html5' ? 'html5' : 'native',
        duration   : 0,
        streamType,
        autoplay   : that.player.autoplay(),
        ...sources,
        ...that.getVideoWindowDimensions(this),
        videoWidth : null,
        videoHeight: null,
        muted      : that.player.muted()
      };
      that.eventCallback(Events.READY, info);
    });
    this.player.on('playing', function() {
      that.eventCallback(Events.TIMECHANGED, {
        currentTime: this.currentTime(),
        droppedFrames: 0
      });
    });
    this.player.on('play', function() {
      that.eventCallback(Events.PLAY, {
        currentTime: this.currentTime()
      })
    });
    this.player.on('pause', function() {
      that.eventCallback(Events.PAUSE, {
        currentTime: this.currentTime()
      })
    });
    this.player.on('error', function() {
      const error = this.error();
      that.eventCallback(Events.ERROR, {
        currentTime: this.currentTime(),
        code   : error.code,
        message: error.message
      });
    });
    this.player.on('stalled', function() {
      that.eventCallback(Events.START_BUFFERING, {
        currentTime: this.currentTime()
      });
    });
    this.player.on('volumechange', function() {
      const muted  = this.muted();
      if (muted) {
        that.eventCallback(Events.MUTE, {
          currentTime: this.currentTime()
        })
      } else {
        that.eventCallback(Events.UN_MUTE, {
          currentTime: this.currentTime()
        });
      }
    });

    let analyticsBitrate = -1;

    this.player.on('timeupdate', function() {
      that.eventCallback(Events.TIMECHANGED, {
        currentTime: this.currentTime()
      });

      const playerBitrate = this.tech_.hls.bandwidth;
      if (analyticsBitrate !== playerBitrate) {

        const eventObject = {
          width        : this.videoWidth(),
          height       : this.videoHeight(),
          bitrate      : playerBitrate,
          currentTime  : this.currentTime()
        };

        console.log(eventObject);

        that.eventCallback(Events.VIDEO_CHANGE, eventObject);
        analyticsBitrate = playerBitrate;
      }
    });

    this.player.on('resize', function(size) {
      debugger;
    })
  }
}

export default VideoJsAdapter
