/**
 * Created by lkroepfl on 22.11.16.
 */

var States = {
  SETUP     : 'setup',
  LOADED    : 'loaded',
  READY     : 'ready',
  PLAY      : 'play',
  PLAYING   : 'playing',
  PAUSED    : 'paused',
  BUFFERING : 'buffering',
  BUFFERED  : 'buffered',
  SEEKING   : 'seeking',
  SEEKED    : 'seeked',
  ENDED     : 'ended',
  FULLSCREEN: 'fullscreen',
  WINDOW    : 'window',

  STARTUP   : 'startup',
  REBUFFERING: 'rebuffering'
};
var Fsm = {
  SETUP: 'SETUP',
  STARTUP : 'STARTUP',
  READY: 'READY',
  PLAYING: 'PLAYING',
  REBUFFERING: 'REBUFFERING',
  PAUSE: 'PAUSE',
  QUALITYCHANGE: 'QUALITYCHANGE',
  PAUSED_SEEKING: 'PAUSED_SEEKING',
  PLAY_SEEKING: 'PLAY_SEEKING',
  QUALITYCHANGE_PAUSE: 'QUALITYCHANGE_PAUSE',
  END: 'END',
  ERROR: 'ERROR'
};

var pad = function (str, length) {
  var padStr = Array(length).join(' ');
  return (str + padStr).slice(0, length);
};

var pausedTimestamp = null;
var PAUSE_SEEK_DELAY = 20;
var AnalyticsStateMachine = StateMachine.create({
  initial: Fsm.SETUP,
  events: [
    { name: Events.READY, from: Fsm.SETUP, to: Fsm.READY },
    { name: Events.PLAY, from: Fsm.READY, to: Fsm.STARTUP },

    { name: Events.START_BUFFERING, from: Fsm.STARTUP, to: Fsm.STARTUP},
    { name: Events.END_BUFFERING, from: Fsm.STARTUP, to: Fsm.STARTUP},
    { name: Events.TIMECHANGED, from: Fsm.STARTUP, to: Fsm.PLAYING},

    { name: Events.TIMECHANGED, from: Fsm.PLAYING, to: Fsm.PLAYING },
    { name: Events.END_BUFFERING, from: Fsm.PLAYING, to: Fsm.PLAYING },
    { name: Events.START_BUFFERING, from: Fsm.PLAYING, to: Fsm.REBUFFERING },
    { name: Events.END_BUFFERING, from: Fsm.REBUFFERING, to: Fsm.PLAYING },
    { name: Events.TIMECHANGED, from: Fsm.REBUFFERING, to: Fsm.REBUFFERING },

    { name: Events.PAUSE, from: Fsm.PLAYING, to: Fsm.PAUSE },
    { name: Events.PAUSE, from: Fsm.REBUFFERING, to: Fsm.PAUSE },
    { name: Events.PLAY, from: Fsm.PAUSE, to: Fsm.PLAYING },

    { name: Events.VIDEO_CHANGE, from: Fsm.PLAYING, to: Fsm.QUALITYCHANGE },
    { name: Events.AUDIO_CHANGE, from: Fsm.PLAYING, to: Fsm.QUALITYCHANGE },
    { name: Events.VIDEO_CHANGE, from: Fsm.QUALITYCHANGE, to: Fsm.QUALITYCHANGE },
    { name: Events.AUDIO_CHANGE, from: Fsm.QUALITYCHANGE, to: Fsm.QUALITYCHANGE },
    { name: Events.TIMECHANGED, from: Fsm.QUALITYCHANGE, to: Fsm.PLAYING },

    { name: Events.VIDEO_CHANGE, from: Fsm.PAUSE, to: Fsm.QUALITYCHANGE_PAUSE },
    { name: Events.AUDIO_CHANGE, from: Fsm.PAUSE, to: Fsm.QUALITYCHANGE_PAUSE },
    { name: Events.VIDEO_CHANGE, from: Fsm.QUALITYCHANGE_PAUSE, to: Fsm.QUALITYCHANGE_PAUSE },
    { name: Events.AUDIO_CHANGE, from: Fsm.QUALITYCHANGE_PAUSE, to: Fsm.QUALITYCHANGE_PAUSE },
    { name: 'FINISH_QUALITYCHANGE_PAUSE', from: Fsm.QUALITYCHANGE_PAUSE, to: Fsm.PAUSE },

    { name: Events.SEEK, from: Fsm.PAUSE, to: Fsm.PAUSED_SEEKING },
    { name: Events.SEEK, from: Fsm.PAUSED_SEEKING, to: Fsm.PAUSED_SEEKING },
    { name: Events.AUDIO_CHANGE, from: Fsm.PAUSED_SEEKING, to: Fsm.PAUSED_SEEKING },
    { name: Events.VIDEO_CHANGE, from: Fsm.PAUSED_SEEKING, to: Fsm.PAUSED_SEEKING },
    { name: Events.START_BUFFERING, from: Fsm.PAUSED_SEEKING, to: Fsm.PAUSED_SEEKING },
    { name: Events.END_BUFFERING, from: Fsm.PAUSED_SEEKING, to: Fsm.PAUSED_SEEKING },
    { name: Events.SEEKED, from: Fsm.PAUSED_SEEKING, to: Fsm.PAUSE },
    { name: Events.PLAY, from: Fsm.PAUSED_SEEKING, to: Fsm.PAUSED_SEEKING },

    { name: 'PLAY_SEEK', from: Fsm.PAUSE, to: Fsm.PLAY_SEEKING },
    { name: 'PLAY_SEEK', from: Fsm.PAUSED_SEEKING, to: Fsm.PLAY_SEEKING },
    { name: 'PLAY_SEEK', from: Fsm.PLAY_SEEKING, to: Fsm.PLAY_SEEKING },
    { name: Events.SEEK, from: Fsm.PLAY_SEEKING, to: Fsm.PLAY_SEEKING },
    { name: Events.AUDIO_CHANGE, from: Fsm.PLAY_SEEKING, to: Fsm.PLAY_SEEKING },
    { name: Events.VIDEO_CHANGE, from: Fsm.PLAY_SEEKING, to: Fsm.PLAY_SEEKING },
    { name: Events.START_BUFFERING, from: Fsm.PLAY_SEEKING, to: Fsm.PLAY_SEEKING },
    { name: Events.END_BUFFERING, from: Fsm.PLAY_SEEKING, to: Fsm.PLAY_SEEKING },
    { name: Events.SEEKED, from: Fsm.PLAY_SEEKING, to: Fsm.PLAYING },
    { name: Events.PLAY, from: Fsm.PLAY_SEEKING, to: Fsm.PLAY_SEEKING },

    { name: Events.END, from: Fsm.PLAY_SEEKING, to: Fsm.END },
    { name: Events.END, from: Fsm.PAUSED_SEEKING, to: Fsm.END },
    { name: Events.END, from: Fsm.PLAYING, to: Fsm.END },
    { name: Events.END, from: Fsm.PAUSE, to: Fsm.END },
	{ name: Events.SEEK, from: Fsm.END, to: Fsm.END },
    { name: Events.SEEKED, from: Fsm.END, to: Fsm.END },
    { name: Events.TIMECHANGED, from: Fsm.END, to: Fsm.END },
    { name: Events.END_BUFFERING, from: Fsm.END, to: Fsm.END },
    { name: Events.START_BUFFERING, from: Fsm.END, to: Fsm.END },
    { name: Events.END, from: Fsm.END, to: Fsm.END },

    { name: Events.PLAY, from: Fsm.END, to: Fsm.PLAYING }

    { name: Events.ERROR, from: [Fsm.SETUP, Fsm.SETUP,
      Fsm.STARTUP,
      Fsm.READY,
      Fsm.PLAYING,
      Fsm.REBUFFERING,
      Fsm.PAUSE,
      Fsm.QUALITYCHANGE,
      Fsm.PAUSED_SEEKING,
      Fsm.PLAY_SEEKING,
      Fsm.QUALITYCHANGE_PAUSE,
      Fsm.END,
      Fsm.ERROR], to          : Fsm.ERROR
    }
  ],
  callbacks: {
    onpause: function (event, from, to, timestamp) {
      if (from === Fsm.PLAYING) {
        pausedTimestamp = timestamp;
      }
    },
    onbeforeevent: function (event, from, to, timestamp) {
      if (event === Events.SEEK && from === Fsm.PAUSE) {
        if (timestamp - pausedTimestamp < PAUSE_SEEK_DELAY) {
          AnalyticsStateMachine.PLAY_SEEK(timestamp);
          return false;
        }
      }
    },
    onafterevent: function (event, from, to, timestamp) {
      console.log(pad(timestamp, 20) + 'EVENT: ', pad(event, 20), ' from ', pad(from, 14), '->', pad(to, 14));
      if (to === Fsm.QUALITYCHANGE_PAUSE) {
        AnalyticsStateMachine.FINISH_QUALITYCHANGE_PAUSE(timestamp);
      }
    }
  }
});
