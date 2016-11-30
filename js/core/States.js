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
  PAUSE: 'PAUSE'
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
    { name: Events.TIMECHANGED, from: Fsm.REBUFFERING, to: Fsm.PLAYING },

    { name: Events.PAUSE, from: Fsm.PLAYING, to: Fsm.PAUSE },
    { name: Events.PLAY, from: Fsm.PAUSE, to: Fsm.PLAYING },
  ],
  callbacks: {
    onleavestate: function (event, from, to) { console.log('LEAVE State: ', from, to); }
  }
});
