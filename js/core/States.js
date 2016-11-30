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

var AnalyticsStateMachine = StateMachine.create({
  initial: States.SETUP,
  events: [
    { name: Events.SOURCE_LOADED, from: States.SETUP, to: States.LOADED },
    { name: Events.READY, from: States.LOADED, to: States.READY },
    { name: Events.PLAY, from: States.READY, to: States.STARTUP },

    { name: Events.START_BUFFERING, from: [States.STARTUP], to: States.STARTUP },
    { name: Events.END_BUFFERING, from: [States.STARTUP], to:States.PLAY },

    { name: Events.START_BUFFERING, from: [States.PLAY], to: States.REBUFFERING },
    { name: Events.END_BUFFERING, from: States.REBUFFERING, to: States.PLAY },

    { name: Events.END_BUFFERING, from: States.PLAY, to: States.PLAY },

    { name: Events.TIMECHANGED, from: States.PLAY, to: States.PLAY },
    { name: Events.TIMECHANGED, from: States.STARTUP, to: States.PLAY },
    { name: Events.TIMECHANGED, from: States.PAUSED, to: States.PAUSED },
    { name: Events.TIMECHANGED, from: States.REBUFFERING, to: States.REBUFFERING },

    { name: Events.PAUSE, from: States.PLAY, to: States.PAUSED },
    { name: Events.PLAY,  from: States.PAUSED, to: States.PLAY },

    //{ name: Events.VIDEO_CHANGE, from: States.PLAY, to: States.PLAY },
    // { name: Events.AUDIO_CHANGE, from: States.PLAY, to: States.PLAY },

    // { name: Events.START_FULLSCREEN, from: [States.PLAY], to: States.PLAYING },
    // { name: Events.END_FULLSCREEN, from: [States.PLAY], to: States.PLAYING },
    // { name: Events.START_AD, from: [States.PLAY], to: States.PLAYING },
    // { name: Events.END_AD, from: [States.PLAY], to: States.PLAYING },
    // { name: Events.ERROR, from: [States.PLAY], to: States.PLAYING },
    // { name: Events.ERROR, from: [States.PLAY], to: States.PLAYING },
    { name: Events.PLAYBACK_FINISHED, from: States.PLAY, to: States.ENDED },
    { name: Events.UNLOAD, from: [States.PLAY], to: States.UNLOADED },
    // { name: Events.START_CAST, from: [States.PLAY], to: States.PLAYING },
    // { name: Events.END_CAST', from: [States.PLAY], to: States.PLAYING },
  ]
});
