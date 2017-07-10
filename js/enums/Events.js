/**
 * Created by lkroepfl on 11.11.16.
 */

const Events = {
  READY            : 'ready',
  SOURCE_LOADED    : 'sourceLoaded',
  PLAY             : 'play',
  PAUSE            : 'pause',
  TIMECHANGED      : 'timechanged',
  SEEK             : 'seek',
  SEEKED           : 'seeked',
  START_CAST       : 'startCasting',
  END_CAST         : 'endCasting',
  START_BUFFERING  : 'startBuffering',
  END_BUFFERING    : 'endBuffering',
  AUDIO_CHANGE     : 'audioChange',
  VIDEO_CHANGE     : 'videoChange',
  START_FULLSCREEN : 'startFullscreen',
  END_FULLSCREEN   : 'endFullscreen',
  START_AD         : 'adStart',
  END_AD           : 'adEnd',
  MUTE             : 'mute',
  UN_MUTE          : 'unMute',
  ERROR            : 'playerError',
  PLAYBACK_FINISHED: 'end',
  SCREEN_RESIZE    : 'resize',
  UNLOAD           : 'unload',
  END              : 'end',
  METADATA_LOADED  : 'metadataLoaded'
};

export default Events
