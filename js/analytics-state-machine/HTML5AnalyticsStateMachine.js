import logger from '../utils/Logger';
import StateMachine from 'javascript-state-machine';
import Events from '../enums/Events';

export class HTML5AnalyticsStateMachine {
  constructor(stateMachineCallbacks, opts = {}) {
    this.stateMachineCallbacks = stateMachineCallbacks;

    this.pausedTimestamp       = null;
    this.onEnterStateTimestamp = 0;
    this.seekStartedAt         = null;

    this.States = {
      SETUP                    : 'SETUP',
      STARTUP                  : 'STARTUP',
      READY                    : 'READY',
      PLAYING                  : 'PLAYING',
      REBUFFERING              : 'REBUFFERING',
      PAUSE                    : 'PAUSE',
      QUALITYCHANGE            : 'QUALITYCHANGE',
      PAUSED_SEEKING           : 'PAUSED_SEEKING',
      QUALITYCHANGE_PAUSE      : 'QUALITYCHANGE_PAUSE',
      QUALITYCHANGE_REBUFFERING: 'QUALITYCHANGE_REBUFFERING',
      END                      : 'END',
      ERROR                    : 'ERROR',
      MUTING_READY             : 'MUTING_READY',
      MUTING_PLAY              : 'MUTING_PLAY',
      MUTING_PAUSE             : 'MUTING_PAUSE',
      CASTING                  : 'CASTING'
    };

    this.createStateMachine(opts);
  }

  getAllStates() {
    return [
      ...Object.keys(this.States).map(key => this.States[key]),
      'FINISH_QUALITYCHANGE_PAUSE',
      'FINISH_QUALITYCHANGE',
      'FINISH_QUALITYCHANGE_REBUFFERING'];
  }

  createStateMachine(opts = {}) {
    this.stateMachine = StateMachine.create({
      initial  : this.States.SETUP,
      error: (eventName, from, to, args, errorCode, errorMessage) => {
        logger.error('Error in statemachine: ' + errorMessage);
      },
      events   : [
        {name: Events.TIMECHANGED, from: this.States.SETUP, to: this.States.SETUP},
        {name: Events.READY, from: [this.States.SETUP, this.States.ERROR], to: this.States.READY},

        {name: Events.PLAY, from: this.States.READY, to: this.States.STARTUP},

        {name: Events.START_BUFFERING, from: this.States.STARTUP, to: this.States.STARTUP},
        {name: Events.END_BUFFERING, from: this.States.STARTUP, to: this.States.STARTUP},
        {name: Events.VIDEO_CHANGE, from: this.States.STARTUP, to: this.States.STARTUP},
        {name: Events.AUDIO_CHANGE, from: this.States.STARTUP, to: this.States.STARTUP},

        {name: Events.TIMECHANGED, from: this.States.STARTUP, to: this.States.PLAYING},
        {name: Events.TIMECHANGED, from: this.States.PLAYING, to: this.States.PLAYING},
        {name: Events.TIMECHANGED, from: this.States.PAUSE, to: this.States.PAUSE},
        {name: Events.TIMECHANGED, from: this.States.PAUSE, to: this.States.PAUSE},

        {name: Events.SEEKED, from: this.States.PAUSE, to: this.States.PAUSE},

        {name: Events.END_BUFFERING, from: this.States.PLAYING, to: this.States.PLAYING},
        {name: Events.START_BUFFERING, from: this.States.PLAYING, to: this.States.REBUFFERING},
        {name: Events.START_BUFFERING, from: this.States.REBUFFERING, to: this.States.REBUFFERING},

        {name: Events.PLAY, from: this.States.REBUFFERING, to: this.States.PLAYING},
        {name: Events.TIMECHANGED, from: this.States.REBUFFERING, to: this.States.PLAYING},

        // Ignoring since it's pushed in a live stream
        {name: Events.SEEK, from: this.States.STARTUP, to: this.States.STARTUP},
        {name: Events.PLAY, from: this.States.PAUSED_SEEKING, to: this.States.PAUSED_SEEKING },

        {name: Events.PAUSE, from: this.States.PLAYING, to: this.States.PAUSE},
        {name: Events.PAUSE, from: this.States.REBUFFERING, to: this.States.PAUSE},

        {name: Events.PLAY, from: this.States.PAUSE, to: this.States.PLAYING},
        {name: Events.TIMECHANGED, from: this.States.PAUSE, to: this.States.PLAYING},

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
        {name: Events.TIMECHANGED, from: this.States.PAUSED_SEEKING, to: this.States.PLAYING},
        {name: Events.PAUSE, from: this.States.PAUSED_SEEKING, to: this.States.PAUSE},

        {name: Events.END, from: this.States.PAUSED_SEEKING, to: this.States.END},
        {name: Events.END, from: this.States.PLAYING, to: this.States.END},
        {name: Events.END, from: this.States.PAUSE, to: this.States.END},
        {name: Events.SEEK, from: this.States.END, to: this.States.END},
        {name: Events.SEEKED, from: this.States.END, to: this.States.END},
        {name: Events.TIMECHANGED, from: this.States.END, to: this.States.END},
        {name: Events.END_BUFFERING, from: this.States.END, to: this.States.END},
        {name: Events.START_BUFFERING, from: this.States.END, to: this.States.END},
        {name: Events.END, from: this.States.END, to: this.States.END},

        //Ignored - Livestreams do a Seek during startup and SEEKED once playback started
        {name: Events.SEEKED, from: this.States.PLAYING, to: this.States.PLAYING},

        {name: Events.PLAY, from: this.States.END, to: this.States.PLAYING},

        {name: Events.ERROR, from: this.getAllStates(), to: this.States.ERROR},
        {name: Events.PAUSE, from: this.States.ERROR, to: this.States.ERROR},

        {name: Events.UNLOAD, from: this.getAllStates(), to: this.States.END},

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

        {name: Events.START_CAST, from: [this.States.READY, this.States.PAUSE], to: this.States.CASTING},
        {name: Events.PAUSE, from: this.States.CASTING, to: this.States.CASTING},
        {name: Events.PLAY, from: this.States.CASTING, to: this.States.CASTING},
        {name: Events.TIMECHANGED, from: this.States.CASTING, to: this.States.CASTING},
        {name: Events.MUTE, from: this.States.CASTING, to: this.States.CASTING},
        {name: Events.SEEK, from: this.States.CASTING, to: this.States.CASTING},
        {name: Events.SEEKED, from: this.States.CASTING, to: this.States.CASTING},
        {name: Events.END_CAST, from: this.States.CASTING, to: this.States.READY},

        {name: Events.SEEK, from: this.States.READY, to: this.States.READY},
        {name: Events.SEEKED, from: this.States.READY, to: this.States.READY},
        {name: Events.SEEKED, from: this.States.STARTUP, to: this.States.STARTUP},

        {name: Events.SOURCE_LOADED, from: this.getAllStates(), to: this.States.SETUP},

        {name: Events.VIDEO_CHANGE, from: this.States.REBUFFERING, to: this.States.QUALITYCHANGE_REBUFFERING},
        {name: Events.AUDIO_CHANGE, from: this.States.REBUFFERING, to: this.States.QUALITYCHANGE_REBUFFERING},
        {name: Events.VIDEO_CHANGE, from: this.States.QUALITYCHANGE_REBUFFERING, to: this.States.QUALITYCHANGE_REBUFFERING},
        {name: Events.AUDIO_CHANGE, from: this.States.QUALITYCHANGE_REBUFFERING, to: this.States.QUALITYCHANGE_REBUFFERING},
        {name: 'FINISH_QUALITYCHANGE_REBUFFERING', from: this.States.QUALITYCHANGE_REBUFFERING, to: this.States.REBUFFERING},
      ],
      callbacks: {
        onenterstate : (event, from, to, timestamp, eventObject) => {
          if (from === 'none' && opts.starttime) {
            this.onEnterStateTimestamp = opts.starttime;
          } else {
            this.onEnterStateTimestamp = timestamp || new Date().getTime();
          }

          logger.log('[' + from + '] => ' + event + ' => [' + to + '] (timestamp: ' + timestamp + ')');
          //logger.log('Entering State ' + to + ' with ' + event + ' from ' + from);
          if (eventObject && to !== this.States.PAUSED_SEEKING) {
            logger.log('Setting video time start to ' + eventObject.currentTime + ', going to ' + to);
            this.stateMachineCallbacks.setVideoTimeStartFromEvent(eventObject);
          }

          if (event === Events.START_CAST && to === this.States.CASTING) {
            this.stateMachineCallbacks.startCasting(timestamp, eventObject);
          }
        },
        onafterevent : (event, from, to, timestamp) => {
          if (to === this.States.QUALITYCHANGE) {
            this.stateMachine.FINISH_QUALITYCHANGE(timestamp);
          }
          if (to === this.States.MUTING_READY || to === this.States.MUTING_PLAY || to === this.States.MUTING_PAUSE) {
            this.stateMachine.FINISH_MUTING(timestamp);
          }
        },
        onleavestate : (event, from, to, timestamp, eventObject) => {
          if (!timestamp) {
            return;
          }

          const stateDuration = timestamp - this.onEnterStateTimestamp;
          //logger.log('State ' + from + ' was ' + stateDuration + ' ms event:' + event);

          if (eventObject && to !== this.States.PAUSED_SEEKING) {
            //logger.log('Setting video time end to ' + eventObject.currentTime + ', going to ' + to);
            this.stateMachineCallbacks.setVideoTimeEndFromEvent(eventObject);
          }

          const fnName = from.toLowerCase();
          if (from === this.States.PAUSED_SEEKING) {
            const seekDuration = timestamp - this.seekStartedAt;
            this.seekStartedAt = null;
            this.stateMachineCallbacks[fnName](seekDuration, fnName, eventObject);
            //logger.log('Seek was ' + seekDuration + 'ms');
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
            //logger.log('Setting video time start to ' + eventObject.currentTime + ', going to ' + to);
            this.stateMachineCallbacks.setVideoTimeStartFromEvent(eventObject);
          }

          if (event === Events.VIDEO_CHANGE) {
            this.stateMachineCallbacks.videoChange(eventObject);
          } else if (event === Events.AUDIO_CHANGE) {
            this.stateMachineCallbacks.audioChange(eventObject);
          } else if (event === Events.MUTE) {
            //logger.log('Setting sample to muted');
            this.stateMachineCallbacks.mute();
          } else if (event === Events.UN_MUTE) {
            //logger.log('Setting sample to unmuted');
            this.stateMachineCallbacks.unMute();
          }
        },
        onseek: (event, from, to, timestamp) => {
          this.seekStartedAt = this.seekStartedAt || timestamp;
        },
        ontimechanged: (event, from, to, timestamp, eventObject) => {
          const stateDuration = timestamp - this.onEnterStateTimestamp;

          if (stateDuration > 59700) {
            this.stateMachineCallbacks.setVideoTimeEndFromEvent(eventObject);

            //logger.log('Sending heartbeat');
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

  updateMetadata(metadata) {
    this.stateMachineCallbacks.updateSample(metadata);
  }

  static pad(str, length) {
    const padStr = new Array(length).join(' ');
    return (str + padStr).slice(0, length);
  }
}
