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
  QUALITYCHANGE: 'QUALITYCHANGE'
};

var pad = function (str, length) {
  var padStr = Array(length).join(' ');
  return (str + padStr).slice(0, length);
};

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
  ],
  callbacks: {
    //onleavestate: function (event, from, to) { console.error('LEAVE State: ', from, to); },
    onafterevent: function (event, from, to, timestamp) { console.log(pad(timestamp, 20) + 'EVENT: ', pad(event, 20), ' from ', pad(from, 14), '->', pad(to, 14)); }
  }
});
