import logger from '../utils/Logger';
import StateMachine from 'javascript-state-machine';
import Events from '../enums/Events';

export class BitmovinAnalyticsStateMachine {
  static PAUSE_SEEK_DELAY = 60;
  static SEEKED_PAUSE_DELAY = 120;

  constructor(stateMachineCallbacks) {
    this.stateMachineCallbacks = stateMachineCallbacks;

    this.pausedTimestamp       = null;
    this.seekTimestamp         = 0;
    this.seekedTimestamp       = 0;
    this.seekedTimeout         = 0;
    this.onEnterStateTimestamp = 0;

    this.States = {
      SETUP              : 'SETUP',
      STARTUP            : 'STARTUP',
      READY              : 'READY',
      PLAYING            : 'PLAYING',
      REBUFFERING        : 'REBUFFERING',
      PAUSE              : 'PAUSE',
      QUALITYCHANGE      : 'QUALITYCHANGE',
      PAUSED_SEEKING     : 'PAUSED_SEEKING',
      PLAY_SEEKING       : 'PLAY_SEEKING',
      END_PLAY_SEEKING   : 'END_PLAY_SEEKING',
      QUALITYCHANGE_PAUSE: 'QUALITYCHANGE_PAUSE',
      END                : 'END',
      ERROR              : 'ERROR',
      AD                 : 'AD',
      MUTING_READY       : 'MUTING_READY',
      MUTING_PLAY        : 'MUTING_PLAY',
      MUTING_PAUSE       : 'MUTING_PAUSE'
    };

    this.createStateMachine();
  }

  createStateMachine() {
    this.stateMachine = StateMachine.create({
      initial  : this.States.SETUP,
      error: (eventName, from, to, args, errorCode, errorMessage, originalException) => {
        logger.error(errorMessage);
      },
      events   : [
        {name: Events.READY, from: [this.States.SETUP, this.States.ERROR], to: this.States.READY},
        {name: Events.PLAY, from: this.States.READY, to: this.States.STARTUP},

        {name: Events.START_BUFFERING, from: this.States.STARTUP, to: this.States.STARTUP},
        {name: Events.END_BUFFERING, from: this.States.STARTUP, to: this.States.STARTUP},
        {name: Events.TIMECHANGED, from: this.States.STARTUP, to: this.States.PLAYING},

        {name: Events.TIMECHANGED, from: this.States.PLAYING, to: this.States.PLAYING},
        {name: Events.END_BUFFERING, from: this.States.PLAYING, to: this.States.PLAYING},
        {name: Events.START_BUFFERING, from: this.States.PLAYING, to: this.States.REBUFFERING},
        {name: Events.END_BUFFERING, from: this.States.REBUFFERING, to: this.States.PLAYING},
        {name: Events.TIMECHANGED, from: this.States.REBUFFERING, to: this.States.REBUFFERING},

        {name: Events.PAUSE, from: this.States.PLAYING, to: this.States.PAUSE},
        {name: Events.PAUSE, from: this.States.REBUFFERING, to: this.States.PAUSE},
        {name: Events.PLAY, from: this.States.PAUSE, to: this.States.PLAYING},

        {name: Events.VIDEO_CHANGE, from: this.States.PLAYING, to: this.States.QUALITYCHANGE},
        {name: Events.AUDIO_CHANGE, from: this.States.PLAYING, to: this.States.QUALITYCHANGE},
        {name: Events.VIDEO_CHANGE, from: this.States.QUALITYCHANGE, to: this.States.QUALITYCHANGE},
        {name: Events.AUDIO_CHANGE, from: this.States.QUALITYCHANGE, to: this.States.QUALITYCHANGE},
        {name: 'FINISH_QUALITYCHANGE', from: this.States.QUALITYCHANGE, to: this.States.PLAYING},

        {name: Events.VIDEO_CHANGE, from: this.States.PAUSE, to: this.States.QUALITYCHANGE_PAUSE},
        {name: Events.AUDIO_CHANGE, from: this.States.PAUSE, to: this.States.QUALITYCHANGE_PAUSE},
        {
          name: Events.VIDEO_CHANGE,
          from: this.States.QUALITYCHANGE_PAUSE,
          to  : this.States.QUALITYCHANGE_PAUSE
        },
        {
          name: Events.AUDIO_CHANGE,
          from: this.States.QUALITYCHANGE_PAUSE,
          to  : this.States.QUALITYCHANGE_PAUSE
        },
        {name: 'FINISH_QUALITYCHANGE_PAUSE', from: this.States.QUALITYCHANGE_PAUSE, to: this.States.PAUSE},

        {name: Events.SEEK, from: this.States.PAUSE, to: this.States.PAUSED_SEEKING},
        {name: Events.SEEK, from: this.States.PAUSED_SEEKING, to: this.States.PAUSED_SEEKING},
        {name: Events.AUDIO_CHANGE, from: this.States.PAUSED_SEEKING, to: this.States.PAUSED_SEEKING},
        {name: Events.VIDEO_CHANGE, from: this.States.PAUSED_SEEKING, to: this.States.PAUSED_SEEKING},
        {name: Events.START_BUFFERING, from: this.States.PAUSED_SEEKING, to: this.States.PAUSED_SEEKING},
        {name: Events.END_BUFFERING, from: this.States.PAUSED_SEEKING, to: this.States.PAUSED_SEEKING},
        {name: Events.SEEKED, from: this.States.PAUSED_SEEKING, to: this.States.PAUSE},
        {name: Events.PLAY, from: this.States.PAUSED_SEEKING, to: this.States.PLAYING},
        {name: Events.PAUSE, from: this.States.PAUSED_SEEKING, to: this.States.PAUSE},

        {name: 'PLAY_SEEK', from: this.States.PAUSE, to: this.States.PLAY_SEEKING},
        {name: 'PLAY_SEEK', from: this.States.PAUSED_SEEKING, to: this.States.PLAY_SEEKING},
        {name: 'PLAY_SEEK', from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: Events.SEEK, from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: Events.AUDIO_CHANGE, from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: Events.VIDEO_CHANGE, from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: Events.START_BUFFERING, from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: Events.END_BUFFERING, from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: Events.SEEKED, from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},

        // We are ending the seek
        {name: Events.PLAY, from: this.States.PLAY_SEEKING, to: this.States.END_PLAY_SEEKING},

        {name: Events.START_BUFFERING, from: this.States.END_PLAY_SEEKING, to: this.States.END_PLAY_SEEKING},
        {name: Events.END_BUFFERING, from: this.States.END_PLAY_SEEKING, to: this.States.END_PLAY_SEEKING},
        {name: Events.SEEKED, from: this.States.END_PLAY_SEEKING, to: this.States.END_PLAY_SEEKING},
        {name: Events.TIMECHANGED, from: this.States.END_PLAY_SEEKING, to: this.States.PLAYING},

        {name: Events.END, from: this.States.PLAY_SEEKING, to: this.States.END},
        {name: Events.END, from: this.States.PAUSED_SEEKING, to: this.States.END},
        {name: Events.END, from: this.States.PLAYING, to: this.States.END},
        {name: Events.END, from: this.States.PAUSE, to: this.States.END},
        {name: Events.SEEK, from: this.States.END, to: this.States.END},
        {name: Events.SEEKED, from: this.States.END, to: this.States.END},
        {name: Events.TIMECHANGED, from: this.States.END, to: this.States.END},
        {name: Events.END_BUFFERING, from: this.States.END, to: this.States.END},
        {name: Events.START_BUFFERING, from: this.States.END, to: this.States.END},
        {name: Events.END, from: this.States.END, to: this.States.END},

        {name: Events.PLAY, from: this.States.END, to: this.States.PLAYING},

        {
          name           : Events.ERROR, from: [
            this.States.SETUP,
            this.States.STARTUP,
            this.States.READY,
            this.States.PLAYING,
            this.States.REBUFFERING,
            this.States.PAUSE,
            this.States.QUALITYCHANGE,
            this.States.PAUSED_SEEKING,
            this.States.PLAY_SEEKING,
            this.States.END_PLAY_SEEKING,
            this.States.QUALITYCHANGE_PAUSE,
            'FINISH_PLAY_SEEKING',
            'PLAY_SEEK',
            'FINISH_QUALITYCHANGE_PAUSE',
            'FINISH_QUALITYCHANGE',
            this.States.END,
            this.States.ERROR], to: this.States.ERROR
        },

        {name: Events.SEEK, from: this.States.END_PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: 'FINISH_PLAY_SEEKING', from: this.States.END_PLAY_SEEKING, to: this.States.PLAYING},

        {name: Events.UNLOAD, from: [this.States.PLAYING, this.States.PAUSE], to: this.States.END},

        {name: Events.START_AD, from: this.States.PLAYING, to: this.States.AD},
        {name: Events.END_AD, from: this.States.AD, to: this.States.PLAYING},

        {name: Events.MUTE, from: this.States.READY, to: this.States.MUTING_READY},
        {name: Events.UN_MUTE, from: this.States.READY, to: this.States.MUTING_READY},
        {name: 'FINISH_MUTING', from: this.States.MUTING_READY, to: this.States.READY},

        {name: Events.MUTE, from: this.States.PLAYING, to: this.States.MUTING_PLAY},
        {name: Events.UN_MUTE, from: this.States.PLAYING, to: this.States.MUTING_PLAY},
        {name: 'FINISH_MUTING', from: this.States.MUTING_PLAY, to: this.States.PLAYING},

        {name: Events.MUTE, from: this.States.PAUSE, to: this.States.MUTING_PAUSE},
        {name: Events.UN_MUTE, from: this.States.PAUSE, to: this.States.MUTING_PAUSE},
        {name: 'FINISH_MUTING', from: this.States.MUTING_PAUSE, to: this.States.PAUSE},
      ],
      callbacks: {
        onpause      : (event, from, to, timestamp) => {
          if (from === this.States.PLAYING) {
            this.pausedTimestamp = timestamp;
          }
        },
        onbeforeevent: (event, from, to, timestamp, eventObject) => {
          if (event === Events.SEEK && from === this.States.PAUSE) {
            if (timestamp - this.pausedTimestamp < BitmovinAnalyticsStateMachine.PAUSE_SEEK_DELAY) {
              this.stateMachine.PLAY_SEEK(timestamp);
              return false;
            }
          }
          if (event === Events.SEEK) {
            window.clearTimeout(this.seekedTimeout);
          }

          if (event === Events.SEEKED && from === this.States.PAUSED_SEEKING) {
            this.seekedTimestamp = timestamp;
            this.seekedTimeout   = window.setTimeout(() => {
              this.stateMachine.pause(timestamp, eventObject);
            }, BitmovinAnalyticsStateMachine.SEEKED_PAUSE_DELAY);
            return false;
          }
        },
        onafterevent : (event, from, to, timestamp)  => {
          logger.log(BitmovinAnalyticsStateMachine.pad(timestamp, 20) + 'EVENT: ' + BitmovinAnalyticsStateMachine.pad(event, 20) + ' from ' + BitmovinAnalyticsStateMachine.pad(from, 14) + '-> ' + BitmovinAnalyticsStateMachine.pad(to, 14));
          if (to === this.States.QUALITYCHANGE_PAUSE) {
            this.stateMachine.FINISH_QUALITYCHANGE_PAUSE(timestamp);
          }
          if (to === this.States.QUALITYCHANGE) {
            this.stateMachine.FINISH_QUALITYCHANGE(timestamp);
          }
          if (to === this.States.MUTING_READY || to === this.States.MUTING_PLAY || to === this.States.MUTING_PAUSE) {
            this.stateMachine.FINISH_MUTING(timestamp);
          }
        },
        onenterstate : (event, from, to, timestamp, eventObject) => {
          this.onEnterStateTimestamp = timestamp || new Date().getTime();

          logger.log('Entering State ' + to + ' with ' + event);
          if (eventObject && to !== this.States.PAUSED_SEEKING) {
            this.stateMachineCallbacks.setVideoTimeStartFromEvent(eventObject);
          }
        },
        onleavestate : (event, from, to, timestamp, eventObject)  => {
          if (!timestamp) {
            return;
          }

          const stateDuration = timestamp - this.onEnterStateTimestamp;
          logger.log('State ' + from + ' was ' + stateDuration + ' ms event:' + event);

          if (eventObject && to !== this.States.PAUSED_SEEKING) {
            this.stateMachineCallbacks.setVideoTimeEndFromEvent(eventObject);
          }

          const fnName = from.toLowerCase();
          if (from === this.States.END_PLAY_SEEKING || from === this.States.PAUSED_SEEKING) {
            const seekDuration = this.seekedTimestamp - this.seekTimestamp;
            this.stateMachineCallbacks[fnName](seekDuration, fnName, eventObject);
            logger.log('Seek was ' + seekDuration + 'ms');
          } else if (event === Events.UNLOAD && from === this.States.PLAYING) {
            this.stateMachineCallbacks.playingAndBye(stateDuration, fnName, eventObject);
          } else if (from === this.States.PAUSE && to !== this.States.PAUSED_SEEKING) {
            this.stateMachineCallbacks.setVideoTimeStartFromEvent(event);
            this.stateMachineCallbacks.pause(stateDuration, fnName, eventObject);
          } else {
            const callbackFunction = this.stateMachineCallbacks[fnName];
            if (typeof callbackFunction === 'function') {
              callbackFunction(stateDuration, fnName, eventObject);
            } else {
              logger.error('Could not find callback function for ' + fnName);
            }
          }

          if (eventObject && to !== this.States.PAUSED_SEEKING) {
            this.stateMachineCallbacks.setVideoTimeStartFromEvent(eventObject);
          }

          if (event === Events.VIDEO_CHANGE) {
            this.stateMachineCallbacks.videoChange(eventObject);
          } else if (event === Events.AUDIO_CHANGE) {
            this.stateMachineCallbacks.audioChange(eventObject);
          } else if (event === Events.MUTE) {
            logger.log('Setting sample to muted');
            this.stateMachineCallbacks.mute();
          } else if (event === Events.UN_MUTE) {
            logger.log('Setting sample to unmuted');
            this.stateMachineCallbacks.unMute();
          }
        },
        onseek       : (event, from, to, timestamp) => {
          this.seekTimestamp = timestamp;
        },
        onseeked     : (event, from, to, timestamp) => {
          this.seekedTimestamp = timestamp;
        },
        ontimechanged: (event, from, to, timestamp, eventObject) => {
          const stateDuration = timestamp - this.onEnterStateTimestamp;

          if (stateDuration > 59700) {
            this.stateMachineCallbacks.setVideoTimeEndFromEvent(eventObject);

            logger.log('Sending heartbeat');
            this.stateMachineCallbacks.heartbeat(stateDuration, from.toLowerCase(), eventObject);
            this.onEnterStateTimestamp = timestamp;

            this.stateMachineCallbacks.setVideoTimeStartFromEvent(eventObject);
          }
        },
        onplayerError: (event, from, to, timestamp, eventObject) => {
          this.stateMachineCallbacks.error(eventObject);
        }
      }
    });
  }

  callEvent(eventType, eventObject, timestamp) {
    const exec = this.stateMachine[eventType];

    if (exec) {
      exec.call(this.stateMachine, timestamp, eventObject);
    } else {
      logger.log('Ignored Event: ' + eventType);
    }
  }

  static pad(str, length) {
    const padStr = new Array(length).join(' ');
    return (str + padStr).slice(0, length);
  }
}
