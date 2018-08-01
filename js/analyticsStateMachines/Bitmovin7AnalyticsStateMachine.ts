import {logger} from '../utils/Logger';
import {padRight} from '../utils/Logger';
import * as StateMachine from 'javascript-state-machine';
import {Event} from '../enums/Event';
import {AnalyticsStateMachineOptions} from '../types/AnalyticsStateMachineOptions';
import {EventDebugging} from '../utils/EventDebugging';
import {StateMachineCallbacks} from '../types/StateMachineCallbacks';
import {AnalyticsStateMachine} from '../types/AnalyticsStateMachine';

enum State {
  SETUP = 'SETUP',
  STARTUP = 'STARTUP',
  READY = 'READY',
  PLAYING = 'PLAYING',
  REBUFFERING = 'REBUFFERING',
  PAUSE = 'PAUSE',
  QUALITYCHANGE = 'QUALITYCHANGE',
  PAUSED_SEEKING = 'PAUSED_SEEKING',
  PLAY_SEEKING = 'PLAY_SEEKING',
  END_PLAY_SEEKING = 'END_PLAY_SEEKING',
  QUALITYCHANGE_PAUSE = 'QUALITYCHANGE_PAUSE',
  QUALITYCHANGE_REBUFFERING = 'QUALITYCHANGE_REBUFFERING',
  END = 'END',
  ERROR = 'ERROR',
  AD = 'AD',
  MUTING_READY = 'MUTING_READY',
  MUTING_PLAY = 'MUTING_PLAY',
  MUTING_PAUSE = 'MUTING_PAUSE',
  CASTING = 'CASTING',
  SOURCE_CHANGING = 'SOURCE_CHANGING',
}

export class Bitmovin7AnalyticsStateMachine implements AnalyticsStateMachine {
  static PAUSE_SEEK_DELAY = 200;
  static SEEKED_PAUSE_DELAY = 300;

  private debuggingStates: EventDebugging[] = [];
  private enabledDebugging = false;

  private States: any;
  private stateMachineCallbacks: StateMachineCallbacks;
  private pausedTimestamp: any;
  private seekTimestamp: number;
  private seekedTimestamp: number;
  private seekedTimeout: number;
  private onEnterStateTimestamp: number;
  private stateMachine: any;

  constructor(stateMachineCallbacks: StateMachineCallbacks, opts: AnalyticsStateMachineOptions) {
    this.stateMachineCallbacks = stateMachineCallbacks;
    this.pausedTimestamp = null;
    this.seekTimestamp = 0;
    this.seekedTimestamp = 0;
    this.seekedTimeout = 0;
    this.onEnterStateTimestamp = 0;

    this.States = State;

    this.createStateMachine(opts);
  }

  getAllStates() {
    return [
      ...Object.keys(this.States).map(key => this.States[key]),
      'FINISH_PLAY_SEEKING',
      'PLAY_SEEK',
      'FINISH_QUALITYCHANGE_PAUSE',
      'FINISH_QUALITYCHANGE',
      'FINISH_QUALITYCHANGE_REBUFFERING',
    ];
  }

  sourceChange = (config: any, timestamp: number) => {
    this.callEvent(Event.MANUAL_SOURCE_CHANGE, config, timestamp);
  };

  createStateMachine(opts: AnalyticsStateMachineOptions) {
    this.stateMachine = StateMachine.create({
      initial: this.States.SETUP,
      error: (eventName, from, to, args, errorCode, errorMessage) => {
        logger.error('Error in statemachine: ' + errorMessage);
      },
      events: [
        {name: Event.READY, from: [this.States.SETUP, this.States.ERROR], to: this.States.READY},
        {name: Event.PLAY, from: this.States.READY, to: this.States.STARTUP},

        {name: Event.START_BUFFERING, from: this.States.STARTUP, to: this.States.STARTUP},
        {name: Event.END_BUFFERING, from: this.States.STARTUP, to: this.States.STARTUP},
        {name: Event.VIDEO_CHANGE, from: this.States.STARTUP, to: this.States.STARTUP},
        {name: Event.AUDIO_CHANGE, from: this.States.STARTUP, to: this.States.STARTUP},
        {name: Event.TIMECHANGED, from: this.States.STARTUP, to: this.States.PLAYING},

        {name: Event.TIMECHANGED, from: this.States.PLAYING, to: this.States.PLAYING},
        {name: Event.END_BUFFERING, from: this.States.PLAYING, to: this.States.PLAYING},
        {name: Event.START_BUFFERING, from: this.States.PLAYING, to: this.States.REBUFFERING},
        {name: Event.END_BUFFERING, from: this.States.REBUFFERING, to: this.States.PLAYING},
        {name: Event.TIMECHANGED, from: this.States.REBUFFERING, to: this.States.REBUFFERING},

        {name: Event.PAUSE, from: this.States.PLAYING, to: this.States.PAUSE},
        {name: Event.PAUSE, from: this.States.REBUFFERING, to: this.States.PAUSE},
        {name: Event.PLAY, from: this.States.PAUSE, to: this.States.PLAYING},

        {name: Event.VIDEO_CHANGE, from: this.States.PLAYING, to: this.States.QUALITYCHANGE},
        {name: Event.AUDIO_CHANGE, from: this.States.PLAYING, to: this.States.QUALITYCHANGE},
        {name: Event.VIDEO_CHANGE, from: this.States.QUALITYCHANGE, to: this.States.QUALITYCHANGE},
        {name: Event.AUDIO_CHANGE, from: this.States.QUALITYCHANGE, to: this.States.QUALITYCHANGE},
        {name: 'FINISH_QUALITYCHANGE', from: this.States.QUALITYCHANGE, to: this.States.PLAYING},

        {name: Event.VIDEO_CHANGE, from: this.States.PAUSE, to: this.States.QUALITYCHANGE_PAUSE},
        {name: Event.AUDIO_CHANGE, from: this.States.PAUSE, to: this.States.QUALITYCHANGE_PAUSE},
        {
          name: Event.VIDEO_CHANGE,
          from: this.States.QUALITYCHANGE_PAUSE,
          to: this.States.QUALITYCHANGE_PAUSE,
        },
        {
          name: Event.AUDIO_CHANGE,
          from: this.States.QUALITYCHANGE_PAUSE,
          to: this.States.QUALITYCHANGE_PAUSE,
        },
        {name: 'FINISH_QUALITYCHANGE_PAUSE', from: this.States.QUALITYCHANGE_PAUSE, to: this.States.PAUSE},

        {name: Event.SEEK, from: this.States.PAUSE, to: this.States.PAUSED_SEEKING},
        {name: Event.SEEK, from: this.States.PAUSED_SEEKING, to: this.States.PAUSED_SEEKING},
        {name: Event.AUDIO_CHANGE, from: this.States.PAUSED_SEEKING, to: this.States.PAUSED_SEEKING},
        {name: Event.VIDEO_CHANGE, from: this.States.PAUSED_SEEKING, to: this.States.PAUSED_SEEKING},
        {name: Event.START_BUFFERING, from: this.States.PAUSED_SEEKING, to: this.States.PAUSED_SEEKING},
        {name: Event.END_BUFFERING, from: this.States.PAUSED_SEEKING, to: this.States.PAUSED_SEEKING},
        {name: Event.SEEKED, from: this.States.PAUSED_SEEKING, to: this.States.PAUSE},
        {name: Event.PLAY, from: this.States.PAUSED_SEEKING, to: this.States.PLAYING},
        {name: Event.PAUSE, from: this.States.PAUSED_SEEKING, to: this.States.PAUSE},

        {name: 'PLAY_SEEK', from: this.States.PAUSE, to: this.States.PLAY_SEEKING},
        {name: 'PLAY_SEEK', from: this.States.PAUSED_SEEKING, to: this.States.PLAY_SEEKING},
        {name: 'PLAY_SEEK', from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: Event.SEEK, from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: Event.AUDIO_CHANGE, from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: Event.VIDEO_CHANGE, from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: Event.START_BUFFERING, from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: Event.END_BUFFERING, from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: Event.SEEKED, from: this.States.PLAY_SEEKING, to: this.States.PLAY_SEEKING},

        // We are ending the seek
        {name: Event.PLAY, from: this.States.PLAY_SEEKING, to: this.States.END_PLAY_SEEKING},

        {name: Event.START_BUFFERING, from: this.States.END_PLAY_SEEKING, to: this.States.END_PLAY_SEEKING},
        {name: Event.END_BUFFERING, from: this.States.END_PLAY_SEEKING, to: this.States.END_PLAY_SEEKING},
        {name: Event.SEEKED, from: this.States.END_PLAY_SEEKING, to: this.States.END_PLAY_SEEKING},
        {name: Event.TIMECHANGED, from: this.States.END_PLAY_SEEKING, to: this.States.PLAYING},

        {name: Event.SEEKED, from: this.States.PLAY_SEEKING, to: this.States.PLAYING},

        {name: Event.END, from: this.States.PLAY_SEEKING, to: this.States.END},
        {name: Event.END, from: this.States.PAUSED_SEEKING, to: this.States.END},
        {name: Event.END, from: this.States.PLAYING, to: this.States.END},
        {name: Event.END, from: this.States.PAUSE, to: this.States.END},
        {name: Event.SEEK, from: this.States.END, to: this.States.END},
        {name: Event.SEEKED, from: this.States.END, to: this.States.END},
        {name: Event.TIMECHANGED, from: this.States.END, to: this.States.END},
        {name: Event.END_BUFFERING, from: this.States.END, to: this.States.END},
        {name: Event.START_BUFFERING, from: this.States.END, to: this.States.END},
        {name: Event.END, from: this.States.END, to: this.States.END},

        {name: Event.PLAY, from: this.States.END, to: this.States.PLAYING},

        {name: Event.ERROR, from: this.getAllStates(), to: this.States.ERROR},

        {name: Event.SEEK, from: this.States.END_PLAY_SEEKING, to: this.States.PLAY_SEEKING},
        {name: 'FINISH_PLAY_SEEKING', from: this.States.END_PLAY_SEEKING, to: this.States.PLAYING},

        {name: Event.UNLOAD, from: this.getAllStates(), to: this.States.END},

        {name: Event.START_AD, from: this.States.PLAYING, to: this.States.AD},
        {name: Event.END_AD, from: this.States.AD, to: this.States.PLAYING},

        {name: Event.MUTE, from: this.States.READY, to: this.States.MUTING_READY},
        {name: Event.UN_MUTE, from: this.States.READY, to: this.States.MUTING_READY},
        {name: 'FINISH_MUTING', from: this.States.MUTING_READY, to: this.States.READY},

        {name: Event.MUTE, from: this.States.PLAYING, to: this.States.MUTING_PLAY},
        {name: Event.UN_MUTE, from: this.States.PLAYING, to: this.States.MUTING_PLAY},
        {name: 'FINISH_MUTING', from: this.States.MUTING_PLAY, to: this.States.PLAYING},

        {name: Event.MUTE, from: this.States.PAUSE, to: this.States.MUTING_PAUSE},
        {name: Event.UN_MUTE, from: this.States.PAUSE, to: this.States.MUTING_PAUSE},
        {name: 'FINISH_MUTING', from: this.States.MUTING_PAUSE, to: this.States.PAUSE},

        {name: Event.START_CAST, from: [this.States.READY, this.States.PAUSE], to: this.States.CASTING},
        {name: Event.PAUSE, from: this.States.CASTING, to: this.States.CASTING},
        {name: Event.PLAY, from: this.States.CASTING, to: this.States.CASTING},
        {name: Event.TIMECHANGED, from: this.States.CASTING, to: this.States.CASTING},
        {name: Event.MUTE, from: this.States.CASTING, to: this.States.CASTING},
        {name: Event.SEEK, from: this.States.CASTING, to: this.States.CASTING},
        {name: Event.SEEKED, from: this.States.CASTING, to: this.States.CASTING},
        {name: Event.END_CAST, from: this.States.CASTING, to: this.States.READY},

        {name: Event.SEEK, from: this.States.READY, to: this.States.READY},
        {name: Event.SEEKED, from: this.States.READY, to: this.States.READY},
        {name: Event.SEEKED, from: this.States.STARTUP, to: this.States.STARTUP},

        {name: Event.MANUAL_SOURCE_CHANGE, from: this.getAllStates(), to: this.States.SOURCE_CHANGING},
        {name: Event.SOURCE_UNLOADED, from: this.getAllStates(), to: this.States.SOURCE_CHANGING},
        {name: Event.READY, from: this.States.SOURCE_CHANGING, to: this.States.READY},

        //{name: Events.SOURCE_LOADED, from: this.States.SETUP, to: this.States.SETUP},
        //{name: Events.SOURCE_LOADED, from: this.States.READY, to: this.States.READY},

        {name: Event.VIDEO_CHANGE, from: this.States.REBUFFERING, to: this.States.QUALITYCHANGE_REBUFFERING},
        {name: Event.AUDIO_CHANGE, from: this.States.REBUFFERING, to: this.States.QUALITYCHANGE_REBUFFERING},
        {
          name: Event.VIDEO_CHANGE,
          from: this.States.QUALITYCHANGE_REBUFFERING,
          to: this.States.QUALITYCHANGE_REBUFFERING,
        },
        {
          name: Event.AUDIO_CHANGE,
          from: this.States.QUALITYCHANGE_REBUFFERING,
          to: this.States.QUALITYCHANGE_REBUFFERING,
        },
        {
          name: 'FINISH_QUALITYCHANGE_REBUFFERING',
          from: this.States.QUALITYCHANGE_REBUFFERING,
          to: this.States.REBUFFERING,
        },
      ],
      callbacks: {
        onpause: (event, from, to, timestamp) => {
          if (from === this.States.PLAYING) {
            this.pausedTimestamp = timestamp;
          }
        },
        onbeforeevent: (event, from, to, timestamp, eventObject) => {
          if (event === Event.SEEK && from === this.States.PAUSE) {
            this.seekTimestamp = timestamp;
            if (timestamp - this.pausedTimestamp < Bitmovin7AnalyticsStateMachine.PAUSE_SEEK_DELAY) {
              this.stateMachine.PLAY_SEEK(timestamp);
              return false;
            }
          }

          if (event === Event.SEEK) {
            window.clearTimeout(this.seekedTimeout);
          }

          if (event === Event.SEEKED && from === this.States.PAUSED_SEEKING) {
            this.seekedTimestamp = timestamp;
            this.seekedTimeout = window.setTimeout(() => {
              this.stateMachine.pause(timestamp, eventObject);
            }, Bitmovin7AnalyticsStateMachine.SEEKED_PAUSE_DELAY);
            return false;
          }

          if (from === this.States.REBUFFERING && to === this.States.QUALITYCHANGE_REBUFFERING) {
            return false;
          }
        },
        onafterevent: (event, from, to, timestamp) => {
          if (to === this.States.QUALITYCHANGE_PAUSE) {
            this.stateMachine.FINISH_QUALITYCHANGE_PAUSE(timestamp);
          }
          if (to === this.States.QUALITYCHANGE) {
            this.stateMachine.FINISH_QUALITYCHANGE(timestamp);
          }
          if (to === this.States.QUALITYCHANGE_REBUFFERING) {
            this.stateMachine.FINISH_QUALITYCHANGE_REBUFFERING(timestamp);
          }
          if (to === this.States.MUTING_READY || to === this.States.MUTING_PLAY || to === this.States.MUTING_PAUSE) {
            this.stateMachine.FINISH_MUTING(timestamp);
          }
        },
        onenterstate: (
          event: string | undefined,
          from: string | undefined,
          to: string | undefined,
          timestamp: number,
          eventObject: any
        ) => {
          if (from === 'none' && opts.starttime) {
            this.onEnterStateTimestamp = opts.starttime;
          } else {
            this.onEnterStateTimestamp = timestamp || new Date().getTime();
          }

          logger.log('[ENTER] ' + padRight(to, 20) + 'EVENT: ' + padRight(event, 20) + ' from ' + padRight(from, 14));
          if (
            eventObject &&
            to !== this.States.PAUSED_SEEKING &&
            to !== this.States.PLAY_SEEKING &&
            to !== this.States.END_PLAY_SEEKING
          ) {
            this.stateMachineCallbacks.setVideoTimeStartFromEvent(eventObject);
          }

          if (
            event === 'PLAY_SEEK' &&
            to === this.States.PLAY_SEEKING &&
            to !== this.States.PLAY_SEEKING &&
            to !== this.States.END_PLAY_SEEKING
          ) {
            this.seekTimestamp = this.onEnterStateTimestamp;
          }

          if (event === Event.START_CAST && to === this.States.CASTING) {
            this.stateMachineCallbacks.startCasting(timestamp, eventObject);
          }
        },
        onleavestate: (event, from, to, timestamp, eventObject) => {
          if (!timestamp) {
            return;
          }
          
          this.addStatesToLog(event, from, to, timestamp, eventObject);
          const stateDuration = timestamp - this.onEnterStateTimestamp;

          if (
            eventObject &&
            to !== this.States.PAUSED_SEEKING &&
            to !== this.States.PLAY_SEEKING &&
            to !== this.States.END_PLAY_SEEKING
          ) {
            this.stateMachineCallbacks.setVideoTimeEndFromEvent(eventObject);
          }

          if (event === 'PLAY_SEEK' && from === this.States.PAUSE) {
            return true;
          }

          const fnName = String(from).toLowerCase();
          if (from === this.States.END_PLAY_SEEKING || from === this.States.PAUSED_SEEKING) {
            const seekDuration = this.seekedTimestamp - this.seekTimestamp;
            this.stateMachineCallbacks[fnName](seekDuration, fnName, eventObject);
          } else if (event === Event.UNLOAD && from === this.States.PLAYING) {
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

          if (
            eventObject &&
            to !== this.States.PAUSED_SEEKING &&
            to !== this.States.PLAY_SEEKING &&
            to !== this.States.END_PLAY_SEEKING
          ) {
            this.stateMachineCallbacks.setVideoTimeStartFromEvent(eventObject);
          }

          if (event === Event.VIDEO_CHANGE) {
            this.stateMachineCallbacks.videoChange(eventObject);
          } else if (event === Event.AUDIO_CHANGE) {
            this.stateMachineCallbacks.audioChange(eventObject);
          } else if (event === Event.MUTE) {
            this.stateMachineCallbacks.mute();
          } else if (event === Event.UN_MUTE) {
            this.stateMachineCallbacks.unMute();
          }
        },
        onseek: (event, from, to, timestamp) => {
          this.seekTimestamp = timestamp;
        },
        onseeked: (event, from, to, timestamp) => {
          this.seekedTimestamp = timestamp;
        },
        ontimechanged: (event, from, to, timestamp, eventObject) => {
          const stateDuration = timestamp - this.onEnterStateTimestamp;

          if (stateDuration > 59700) {
            this.stateMachineCallbacks.setVideoTimeEndFromEvent(eventObject);

            this.stateMachineCallbacks.heartbeat(stateDuration, String(from).toLowerCase(), eventObject);
            this.onEnterStateTimestamp = timestamp;

            this.stateMachineCallbacks.setVideoTimeStartFromEvent(eventObject);
          }
        },
        onplayerError: (event, from, to, timestamp, eventObject) => {
          this.stateMachineCallbacks.error(eventObject);
        },
      },
    });
  }

  callEvent(eventType: string, eventObject: any, timestamp: number) {
    const exec = this.stateMachine[eventType];
    console.log(eventType);
    if (exec) {
      exec.call(this.stateMachine, timestamp, eventObject);
    } else {
      logger.log('Ignored Event: ' + eventType);
    }
  }

  addStatesToLog(
    event: string | undefined,
    from: string | undefined,
    to: string | undefined,
    timestamp: number,
    eventObject: any
  ) {
    if (this.enabledDebugging) {
      this.debuggingStates.push(new EventDebugging(event, from, to, timestamp, eventObject));
    }
  }

  getStates() {
    return this.debuggingStates;
  }

  setEnabledDebugging(enabled: boolean) {
    this.enabledDebugging = enabled;
  }

  updateMetadata(metadata: any) {}
}
