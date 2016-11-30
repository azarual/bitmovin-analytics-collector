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
  STARTUP : 'STARTUP',
  READY: 'READY',
  PLAYING: 'PLAYING',
  REBUFFERING: 'REBUFFERING',
  PAUSE: 'PAUSE'
};

var AnalyticsStateMachine = StateMachine.create({
  initial: Fsm.STARTUP,
  events: [
    { name: Events.READY, from: Fsm.STARTUP, to: Fsm.READY },
    { name: Events.PLAY, from: Fsm.READY, to: Fsm.PLAYING },
    { name: Events.TIMECHANGED, from: Fsm.PLAYING, to: Fsm.PLAYING },
    { name: Events.END_BUFFERING, from: Fsm.PLAYING, to: Fsm.PLAYING },
    { name: Events.START_BUFFERING, from: Fsm.PLAYING, to: Fsm.REBUFFERING },
    { name: Events.END_BUFFERING, from: Fsm.REBUFFERING, to: Fsm.PLAYING },
    { name: Events.TIMECHANGED, from: Fsm.REBUFFERING, to: Fsm.PLAYING },

    { name: Events.PAUSE, from: Fsm.PLAYING, to: Fsm.PAUSE },
    { name: Events.PLAY, from: Fsm.PAUSE, to: Fsm.PLAYING },
  ]
});
