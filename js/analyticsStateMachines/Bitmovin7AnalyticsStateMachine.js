/**
 * Created by lkroepfl on 12.01.17.
 */

var Bitmovin7AnalyticsStateMachine = function(logger, bitanalytics) {
  var pausedTimestamp = null;
  var seekTimestamp = 0;
  var seekedTimestamp = 0;
  var seekedTimeout = 0;
  var PAUSE_SEEK_DELAY = 200;
  var SEEKED_PAUSE_DELAY = 300;
  var onEnterStateTimestamp = 0;

  var States = {
    SETUP: 'SETUP',
    STARTUP : 'STARTUP',
    READY: 'READY',
    PLAYING: 'PLAYING',
    REBUFFERING: 'REBUFFERING',
    PAUSE: 'PAUSE',
    QUALITYCHANGE: 'QUALITYCHANGE',
    PAUSED_SEEKING: 'PAUSED_SEEKING',
    PLAY_SEEKING: 'PLAY_SEEKING',
    END_PLAY_SEEKING: 'END_PLAY_SEEKING',
    QUALITYCHANGE_PAUSE: 'QUALITYCHANGE_PAUSE',
    END: 'END',
    ERROR: 'ERROR',
    AD: 'AD'
  };

  var pad = function (str, length) {
    var padStr = Array(length).join(' ');
    return (str + padStr).slice(0, length);
  };

  var stateMachine = StateMachine.create({
    initial: States.SETUP,
    events: [
      { name: bitmovin.analytics.Events.READY, from: States.SETUP, to: States.READY },
      { name: bitmovin.analytics.Events.PLAY, from: States.READY, to: States.STARTUP },

      { name: bitmovin.analytics.Events.START_BUFFERING, from: States.STARTUP, to: States.STARTUP},
      { name: bitmovin.analytics.Events.END_BUFFERING, from: States.STARTUP, to: States.STARTUP},
      { name: bitmovin.analytics.Events.TIMECHANGED, from: States.STARTUP, to: States.PLAYING},

      { name: bitmovin.analytics.Events.TIMECHANGED, from: States.PLAYING, to: States.PLAYING },
      { name: bitmovin.analytics.Events.END_BUFFERING, from: States.PLAYING, to: States.PLAYING },
      { name: bitmovin.analytics.Events.START_BUFFERING, from: States.PLAYING, to: States.REBUFFERING },
      { name: bitmovin.analytics.Events.END_BUFFERING, from: States.REBUFFERING, to: States.PLAYING },
      { name: bitmovin.analytics.Events.TIMECHANGED, from: States.REBUFFERING, to: States.REBUFFERING },

      { name: bitmovin.analytics.Events.PAUSE, from: States.PLAYING, to: States.PAUSE },
      { name: bitmovin.analytics.Events.PAUSE, from: States.REBUFFERING, to: States.PAUSE },
      { name: bitmovin.analytics.Events.PLAY, from: States.PAUSE, to: States.PLAYING },

      { name: bitmovin.analytics.Events.VIDEO_CHANGE, from: States.PLAYING, to: States.QUALITYCHANGE },
      { name: bitmovin.analytics.Events.AUDIO_CHANGE, from: States.PLAYING, to: States.QUALITYCHANGE },
      { name: bitmovin.analytics.Events.VIDEO_CHANGE, from: States.QUALITYCHANGE, to: States.QUALITYCHANGE },
      { name: bitmovin.analytics.Events.AUDIO_CHANGE, from: States.QUALITYCHANGE, to: States.QUALITYCHANGE },
      { name: 'FINISH_QUALITYCHANGE', from: States.QUALITYCHANGE, to: States.PLAYING },

      { name: bitmovin.analytics.Events.VIDEO_CHANGE, from: States.PAUSE, to: States.QUALITYCHANGE_PAUSE },
      { name: bitmovin.analytics.Events.AUDIO_CHANGE, from: States.PAUSE, to: States.QUALITYCHANGE_PAUSE },
      { name: bitmovin.analytics.Events.VIDEO_CHANGE, from: States.QUALITYCHANGE_PAUSE, to: States.QUALITYCHANGE_PAUSE },
      { name: bitmovin.analytics.Events.AUDIO_CHANGE, from: States.QUALITYCHANGE_PAUSE, to: States.QUALITYCHANGE_PAUSE },
      { name: 'FINISH_QUALITYCHANGE_PAUSE', from: States.QUALITYCHANGE_PAUSE, to: States.PAUSE },

      { name: bitmovin.analytics.Events.SEEK, from: States.PAUSE, to: States.PAUSED_SEEKING },
      { name: bitmovin.analytics.Events.SEEK, from: States.PAUSED_SEEKING, to: States.PAUSED_SEEKING },
      { name: bitmovin.analytics.Events.AUDIO_CHANGE, from: States.PAUSED_SEEKING, to: States.PAUSED_SEEKING },
      { name: bitmovin.analytics.Events.VIDEO_CHANGE, from: States.PAUSED_SEEKING, to: States.PAUSED_SEEKING },
      { name: bitmovin.analytics.Events.START_BUFFERING, from: States.PAUSED_SEEKING, to: States.PAUSED_SEEKING },
      { name: bitmovin.analytics.Events.END_BUFFERING, from: States.PAUSED_SEEKING, to: States.PAUSED_SEEKING },
      { name: bitmovin.analytics.Events.SEEKED, from: States.PAUSED_SEEKING, to: States.PAUSE },
      { name: bitmovin.analytics.Events.PLAY, from: States.PAUSED_SEEKING, to: States.PLAYING },
      { name: bitmovin.analytics.Events.PAUSE, from: States.PAUSED_SEEKING, to: States.PAUSE },

      { name: 'PLAY_SEEK', from: States.PAUSE, to: States.PLAY_SEEKING },
      { name: 'PLAY_SEEK', from: States.PAUSED_SEEKING, to: States.PLAY_SEEKING },
      { name: 'PLAY_SEEK', from: States.PLAY_SEEKING, to: States.PLAY_SEEKING },
      { name: bitmovin.analytics.Events.SEEK, from: States.PLAY_SEEKING, to: States.PLAY_SEEKING },
      { name: bitmovin.analytics.Events.AUDIO_CHANGE, from: States.PLAY_SEEKING, to: States.PLAY_SEEKING },
      { name: bitmovin.analytics.Events.VIDEO_CHANGE, from: States.PLAY_SEEKING, to: States.PLAY_SEEKING },
      { name: bitmovin.analytics.Events.START_BUFFERING, from: States.PLAY_SEEKING, to: States.PLAY_SEEKING },
      { name: bitmovin.analytics.Events.END_BUFFERING, from: States.PLAY_SEEKING, to: States.PLAY_SEEKING },
      { name: bitmovin.analytics.Events.SEEKED, from: States.PLAY_SEEKING, to: States.PLAY_SEEKING },

      // We are ending the seek
      { name: bitmovin.analytics.Events.PLAY, from: States.PLAY_SEEKING, to: States.END_PLAY_SEEKING },

      { name: bitmovin.analytics.Events.START_BUFFERING, from: States.END_PLAY_SEEKING, to: States.END_PLAY_SEEKING },
      { name: bitmovin.analytics.Events.END_BUFFERING, from: States.END_PLAY_SEEKING, to: States.END_PLAY_SEEKING },
      { name: bitmovin.analytics.Events.SEEKED, from: States.END_PLAY_SEEKING, to: States.END_PLAY_SEEKING },
      { name: bitmovin.analytics.Events.TIMECHANGED, from: States.END_PLAY_SEEKING, to: States.PLAYING },

      { name: bitmovin.analytics.Events.END, from: States.PLAY_SEEKING, to: States.END },
      { name: bitmovin.analytics.Events.END, from: States.PAUSED_SEEKING, to: States.END },
      { name: bitmovin.analytics.Events.END, from: States.PLAYING, to: States.END },
      { name: bitmovin.analytics.Events.END, from: States.PAUSE, to: States.END },
      { name: bitmovin.analytics.Events.SEEK, from: States.END, to: States.END },
      { name: bitmovin.analytics.Events.SEEKED, from: States.END, to: States.END },
      { name: bitmovin.analytics.Events.TIMECHANGED, from: States.END, to: States.END },
      { name: bitmovin.analytics.Events.END_BUFFERING, from: States.END, to: States.END },
      { name: bitmovin.analytics.Events.START_BUFFERING, from: States.END, to: States.END },
      { name: bitmovin.analytics.Events.END, from: States.END, to: States.END },

      { name: bitmovin.analytics.Events.PLAY, from: States.END, to: States.PLAYING },

      { name: bitmovin.analytics.Events.ERROR, from: [
        States.SETUP,
        States.STARTUP,
        States.READY,
        States.PLAYING,
        States.REBUFFERING,
        States.PAUSE,
        States.QUALITYCHANGE,
        States.PAUSED_SEEKING,
        States.PLAY_SEEKING,
        States.END_PLAY_SEEKING,
        States.QUALITYCHANGE_PAUSE,
        'FINISH_PLAY_SEEKING',
        'PLAY_SEEK',
        'FINISH_QUALITYCHANGE_PAUSE',
        'FINISH_QUALITYCHANGE',
        States.END], to          : States.ERROR
      },

      { name: bitmovin.analytics.Events.SEEK, from: States.END_PLAY_SEEKING, to: States.PLAY_SEEKING },
      { name: 'FINISH_PLAY_SEEKING', from: States.END_PLAY_SEEKING, to: States.PLAYING },

      { name: bitmovin.analytics.Events.UNLOAD, from: States.PLAYING, to: States.END },

      { name: bitmovin.analytics.Events.START_AD, from: States.PLAYING, to: States.AD },
      { name: bitmovin.analytics.Events.END_AD, from: States.AD, to: States.PLAYING }
    ],
    callbacks: {
      onpause      : function(event, from, to, timestamp) {
        if (from === States.PLAYING) {
          pausedTimestamp = timestamp;
        }
      },
      onbeforeevent: function(event, from, to, timestamp, eventObject) {
        if (event === bitmovin.analytics.Events.SEEK && from === States.PAUSE) {
          if (timestamp - pausedTimestamp < PAUSE_SEEK_DELAY) {
            stateMachine.PLAY_SEEK(timestamp);
            return false;
          }
        }
        if (event === bitmovin.analytics.Events.SEEK) {
          window.clearTimeout(seekedTimeout);
        }

        if (event === bitmovin.analytics.Events.SEEKED && from === States.PAUSED_SEEKING) {
          seekedTimestamp = timestamp;
          seekedTimeout = window.setTimeout(function() {
            stateMachine.pause(timestamp, eventObject);
          }, SEEKED_PAUSE_DELAY);
          return false;
        }
      },
      onafterevent : function(event, from, to, timestamp) {
        logger.log(pad(timestamp, 20) + 'EVENT: ' + pad(event, 20) + ' from ' + pad(from, 14) + '-> ' + pad(to, 14));
        if (to === States.QUALITYCHANGE_PAUSE) {
          stateMachine.FINISH_QUALITYCHANGE_PAUSE(timestamp);
        }
        if (to === States.QUALITYCHANGE) {
          stateMachine.FINISH_QUALITYCHANGE(timestamp);
        }
      },
      onenterstate : function(event, from, to, timestamp, eventObject) {
        onEnterStateTimestamp = timestamp || new Date().getTime();

        logger.log('Entering State ' + to + ' with ' + event);
        if (eventObject && to !== States.PAUSED_SEEKING) {
          bitanalytics.setVideoTimeStartFromEvent(eventObject);
        }

        if (event === 'PLAY_SEEK' && to === States.PLAY_SEEKING) {
          seekTimestamp = onEnterStateTimestamp;
        }
      },
      onleavestate : function(event, from, to, timestamp, eventObject) {
        if (!timestamp) {
          return;
        }

        var stateDuration = timestamp - onEnterStateTimestamp;
        logger.log('State ' + from + ' was ' + stateDuration + ' ms event:' + event);

        if (eventObject && to !== States.PAUSED_SEEKING) {
          bitanalytics.setVideoTimeEndFromEvent(eventObject);
        }

        if (event === 'PLAY_SEEK' && from === States.PAUSE) {
          return true;
        }

        var fnName = from.toLowerCase();
        if (from === States.END_PLAY_SEEKING || from === States.PAUSED_SEEKING) {
          var seekDuration = seekedTimestamp - seekTimestamp;
          bitanalytics[fnName](seekDuration, fnName, eventObject);
          logger.log('Seek was ' + seekDuration + 'ms');
        } else if (event === bitmovin.analytics.Events.UNLOAD) {
          bitanalytics.playingAndBye(stateDuration, fnName, eventObject);
        } else if (from === States.PAUSE && to !== States.PAUSED_SEEKING) {
          bitanalytics.setVideoTimeStartFromEvent(event);
          bitanalytics.pause(stateDuration, fnName, eventObject);
        } else {
          var callbackFunction = bitanalytics[fnName];
          if (typeof callbackFunction === 'function') {
            callbackFunction(stateDuration, fnName, eventObject);
          } else {
            logger.error('Could not find callback function for ' + fnName);
          }
        }

        if (eventObject && to !== States.PAUSED_SEEKING) {
          bitanalytics.setVideoTimeStartFromEvent(eventObject);
        }

        if (event === bitmovin.analytics.Events.VIDEO_CHANGE) {
          bitanalytics.videoChange(eventObject);
        } else if (event === bitmovin.analytics.Events.AUDIO_CHANGE) {
          bitanalytics.audioChange(eventObject);
        }
      },
      onseek: function(event, from, to, timestamp) {
        seekTimestamp = timestamp;
      },
      onseeked: function(event, from, to, timestamp) {
        seekedTimestamp = timestamp;
      },
      ontimechanged: function(event, from, to, timestamp, eventObject) {
        var stateDuration = timestamp - onEnterStateTimestamp;

        if (stateDuration > 59700) {
          bitanalytics.setVideoTimeEndFromEvent(eventObject);

          logger.log('Sending heartbeat');
          bitanalytics.heartbeat(stateDuration, from.toLowerCase(), eventObject);
          onEnterStateTimestamp = timestamp;

          bitanalytics.setVideoTimeStartFromEvent(eventObject);
        }
      },
      onplayerError: function(event, from, to, timestamp, eventObject) {
        bitanalytics.error(eventObject);
      }
    }
  });

  this.callEvent = function(eventType, eventObject, timestamp) {
    var exec = stateMachine[eventType];

    if (exec) {
      exec.call(stateMachine, timestamp, eventObject);
    } else {
      logger.log('Ignored Event: ' + eventType);
    }
  };
};
