/**
 * Created by lkroepfl on 22.11.16.
 */

bitmovin.analytics.AnalyticsStateMachine = function(logger, bitanalytics) {
  var pausedTimestamp = null;
  var seekTimestamp = 0;
  var seekedTimestamp = 0;
  var seekedTimeout = 0;
  var PAUSE_SEEK_DELAY = 60;
  var SEEKED_PAUSE_DELAY = 120;
  var onEnterStateTimestamp = 0;

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
    END_PLAY_SEEKING: 'END_PLAY_SEEKING',
    QUALITYCHANGE_PAUSE: 'QUALITYCHANGE_PAUSE',
    END: 'END',
    ERROR: 'ERROR'
  };

  var pad = function (str, length) {
    var padStr = Array(length).join(' ');
    return (str + padStr).slice(0, length);
  };

  var AnalyticsStateMachine = StateMachine.create({
    initial: Fsm.SETUP,
    events: [
      { name: bitmovin.analytics.events.READY, from: Fsm.SETUP, to: Fsm.READY },
      { name: bitmovin.analytics.events.PLAY, from: Fsm.READY, to: Fsm.STARTUP },

      { name: bitmovin.analytics.events.START_BUFFERING, from: Fsm.STARTUP, to: Fsm.STARTUP},
      { name: bitmovin.analytics.events.END_BUFFERING, from: Fsm.STARTUP, to: Fsm.STARTUP},
      { name: bitmovin.analytics.events.TIMECHANGED, from: Fsm.STARTUP, to: Fsm.PLAYING},

      { name: bitmovin.analytics.events.TIMECHANGED, from: Fsm.PLAYING, to: Fsm.PLAYING },
      { name: bitmovin.analytics.events.END_BUFFERING, from: Fsm.PLAYING, to: Fsm.PLAYING },
      { name: bitmovin.analytics.events.START_BUFFERING, from: Fsm.PLAYING, to: Fsm.REBUFFERING },
      { name: bitmovin.analytics.events.END_BUFFERING, from: Fsm.REBUFFERING, to: Fsm.PLAYING },
      { name: bitmovin.analytics.events.TIMECHANGED, from: Fsm.REBUFFERING, to: Fsm.REBUFFERING },

      { name: bitmovin.analytics.events.PAUSE, from: Fsm.PLAYING, to: Fsm.PAUSE },
      { name: bitmovin.analytics.events.PAUSE, from: Fsm.REBUFFERING, to: Fsm.PAUSE },
      { name: bitmovin.analytics.events.PLAY, from: Fsm.PAUSE, to: Fsm.PLAYING },

      { name: bitmovin.analytics.events.VIDEO_CHANGE, from: Fsm.PLAYING, to: Fsm.QUALITYCHANGE },
      { name: bitmovin.analytics.events.AUDIO_CHANGE, from: Fsm.PLAYING, to: Fsm.QUALITYCHANGE },
      { name: bitmovin.analytics.events.VIDEO_CHANGE, from: Fsm.QUALITYCHANGE, to: Fsm.QUALITYCHANGE },
      { name: bitmovin.analytics.events.AUDIO_CHANGE, from: Fsm.QUALITYCHANGE, to: Fsm.QUALITYCHANGE },
      { name: 'FINISH_QUALITYCHANGE', from: Fsm.QUALITYCHANGE, to: Fsm.PLAYING },

      { name: bitmovin.analytics.events.VIDEO_CHANGE, from: Fsm.PAUSE, to: Fsm.QUALITYCHANGE_PAUSE },
      { name: bitmovin.analytics.events.AUDIO_CHANGE, from: Fsm.PAUSE, to: Fsm.QUALITYCHANGE_PAUSE },
      { name: bitmovin.analytics.events.VIDEO_CHANGE, from: Fsm.QUALITYCHANGE_PAUSE, to: Fsm.QUALITYCHANGE_PAUSE },
      { name: bitmovin.analytics.events.AUDIO_CHANGE, from: Fsm.QUALITYCHANGE_PAUSE, to: Fsm.QUALITYCHANGE_PAUSE },
      { name: 'FINISH_QUALITYCHANGE_PAUSE', from: Fsm.QUALITYCHANGE_PAUSE, to: Fsm.PAUSE },

      { name: bitmovin.analytics.events.SEEK, from: Fsm.PAUSE, to: Fsm.PAUSED_SEEKING },
      { name: bitmovin.analytics.events.SEEK, from: Fsm.PAUSED_SEEKING, to: Fsm.PAUSED_SEEKING },
      { name: bitmovin.analytics.events.AUDIO_CHANGE, from: Fsm.PAUSED_SEEKING, to: Fsm.PAUSED_SEEKING },
      { name: bitmovin.analytics.events.VIDEO_CHANGE, from: Fsm.PAUSED_SEEKING, to: Fsm.PAUSED_SEEKING },
      { name: bitmovin.analytics.events.START_BUFFERING, from: Fsm.PAUSED_SEEKING, to: Fsm.PAUSED_SEEKING },
      { name: bitmovin.analytics.events.END_BUFFERING, from: Fsm.PAUSED_SEEKING, to: Fsm.PAUSED_SEEKING },
      { name: bitmovin.analytics.events.SEEKED, from: Fsm.PAUSED_SEEKING, to: Fsm.PAUSE },
      { name: bitmovin.analytics.events.PLAY, from: Fsm.PAUSED_SEEKING, to: Fsm.PLAYING },
      { name: bitmovin.analytics.events.PAUSE, from: Fsm.PAUSED_SEEKING, to: Fsm.PAUSE },

      { name: 'PLAY_SEEK', from: Fsm.PAUSE, to: Fsm.PLAY_SEEKING },
      { name: 'PLAY_SEEK', from: Fsm.PAUSED_SEEKING, to: Fsm.PLAY_SEEKING },
      { name: 'PLAY_SEEK', from: Fsm.PLAY_SEEKING, to: Fsm.PLAY_SEEKING },
      { name: bitmovin.analytics.events.SEEK, from: Fsm.PLAY_SEEKING, to: Fsm.PLAY_SEEKING },
      { name: bitmovin.analytics.events.AUDIO_CHANGE, from: Fsm.PLAY_SEEKING, to: Fsm.PLAY_SEEKING },
      { name: bitmovin.analytics.events.VIDEO_CHANGE, from: Fsm.PLAY_SEEKING, to: Fsm.PLAY_SEEKING },
      { name: bitmovin.analytics.events.START_BUFFERING, from: Fsm.PLAY_SEEKING, to: Fsm.PLAY_SEEKING },
      { name: bitmovin.analytics.events.END_BUFFERING, from: Fsm.PLAY_SEEKING, to: Fsm.PLAY_SEEKING },
      { name: bitmovin.analytics.events.SEEKED, from: Fsm.PLAY_SEEKING, to: Fsm.PLAY_SEEKING },

      // We are ending the seek
      { name: bitmovin.analytics.events.PLAY, from: Fsm.PLAY_SEEKING, to: Fsm.END_PLAY_SEEKING },

      { name: bitmovin.analytics.events.START_BUFFERING, from: Fsm.END_PLAY_SEEKING, to: Fsm.END_PLAY_SEEKING },
      { name: bitmovin.analytics.events.END_BUFFERING, from: Fsm.END_PLAY_SEEKING, to: Fsm.END_PLAY_SEEKING },
      { name: bitmovin.analytics.events.SEEKED, from: Fsm.END_PLAY_SEEKING, to: Fsm.END_PLAY_SEEKING },
      { name: bitmovin.analytics.events.TIMECHANGED, from: Fsm.END_PLAY_SEEKING, to: Fsm.PLAYING },

      { name: bitmovin.analytics.events.END, from: Fsm.PLAY_SEEKING, to: Fsm.END },
      { name: bitmovin.analytics.events.END, from: Fsm.PAUSED_SEEKING, to: Fsm.END },
      { name: bitmovin.analytics.events.END, from: Fsm.PLAYING, to: Fsm.END },
      { name: bitmovin.analytics.events.END, from: Fsm.PAUSE, to: Fsm.END },
      { name: bitmovin.analytics.events.SEEK, from: Fsm.END, to: Fsm.END },
      { name: bitmovin.analytics.events.SEEKED, from: Fsm.END, to: Fsm.END },
      { name: bitmovin.analytics.events.TIMECHANGED, from: Fsm.END, to: Fsm.END },
      { name: bitmovin.analytics.events.END_BUFFERING, from: Fsm.END, to: Fsm.END },
      { name: bitmovin.analytics.events.START_BUFFERING, from: Fsm.END, to: Fsm.END },
      { name: bitmovin.analytics.events.END, from: Fsm.END, to: Fsm.END },

      { name: bitmovin.analytics.events.PLAY, from: Fsm.END, to: Fsm.PLAYING },

      { name: bitmovin.analytics.events.ERROR, from: [
        Fsm.SETUP,
        Fsm.STARTUP,
        Fsm.READY,
        Fsm.PLAYING,
        Fsm.REBUFFERING,
        Fsm.PAUSE,
        Fsm.QUALITYCHANGE,
        Fsm.PAUSED_SEEKING,
        Fsm.PLAY_SEEKING,
        Fsm.END_PLAY_SEEKING,
        Fsm.QUALITYCHANGE_PAUSE,
        'FINISH_PLAY_SEEKING',
        'PLAY_SEEK',
        'FINISH_QUALITYCHANGE_PAUSE',
        'FINISH_QUALITYCHANGE',
        Fsm.END], to          : Fsm.ERROR
      },

      { name: bitmovin.analytics.events.SEEK, from: Fsm.END_PLAY_SEEKING, to: Fsm.PLAY_SEEKING },
      { name: 'FINISH_PLAY_SEEKING', from: Fsm.END_PLAY_SEEKING, to: Fsm.PLAYING },

      { name: bitmovin.analytics.events.UNLOAD, from: Fsm.PLAYING, to: Fsm.END }
    ],
    callbacks: {
      onpause      : function(event, from, to, timestamp) {
        if (from === Fsm.PLAYING) {
          pausedTimestamp = timestamp;
        }
      },
      onbeforeevent: function(event, from, to, timestamp, eventObject) {
        if (event === bitmovin.analytics.events.SEEK && from === Fsm.PAUSE) {
          if (timestamp - pausedTimestamp < PAUSE_SEEK_DELAY) {
            AnalyticsStateMachine.PLAY_SEEK(timestamp);
            return false;
          }
        }
        if (event === bitmovin.analytics.events.SEEK) {
          window.clearTimeout(seekedTimeout);
        }

        if (event === bitmovin.analytics.events.SEEKED && from === Fsm.PAUSED_SEEKING) {
          seekedTimeout = window.setTimeout(function() {
            AnalyticsStateMachine.pause(timestamp, eventObject);
          }, SEEKED_PAUSE_DELAY);
          return false;
        }
      },
      onafterevent : function(event, from, to, timestamp) {
        logger.log(pad(timestamp, 20) + 'EVENT: ' + pad(event, 20) + ' from ' + pad(from, 14) + '-> ' + pad(to, 14));
        if (to === Fsm.QUALITYCHANGE_PAUSE) {
          AnalyticsStateMachine.FINISH_QUALITYCHANGE_PAUSE(timestamp);
        }
        if (to === Fsm.QUALITYCHANGE) {
          AnalyticsStateMachine.FINISH_QUALITYCHANGE(timestamp);
        }
      },
      onenterstate : function(event, from, to, timestamp, eventObject) {
        onEnterStateTimestamp = timestamp || new Date().getTime();

        logger.log('Entering State ' + to + ' with ' + event);
        if (eventObject) {
          bitanalytics.setVideoTimeStartFromEvent(eventObject);
        }
      },
      onleavestate : function(event, from, to, timestamp, eventObject) {
        if (!timestamp) {
          return;
        }

        var stateDuration = timestamp - onEnterStateTimestamp;
        logger.log('State ' + from + ' was ' + stateDuration + ' ms event:' + event);

        if (eventObject) {
          bitanalytics.setVideoTimeEndFromEvent(eventObject);
        }

        var fnName = from.toLowerCase();
        if (from === Fsm.END_PLAY_SEEKING) {
          var seekDuration = seekedTimestamp - seekTimestamp;
          bitanalytics[fnName](seekDuration, fnName, eventObject);
        } else if (event === bitmovin.analytics.events.UNLOAD) {
          bitanalytics.playingAndBye(stateDuration, fnName, eventObject);
        } else {
          bitanalytics[fnName](stateDuration, fnName, eventObject);
        }

        if (eventObject) {
          bitanalytics.setVideoTimeStartFromEvent(eventObject);
        }

        if (event === bitmovin.analytics.events.VIDEO_CHANGE) {
          bitanalytics.videoChange(eventObject);
        } else if (event === bitmovin.analytics.events.AUDIO_CHANGE) {
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
    var exec = AnalyticsStateMachine[eventType];

    if (exec) {
      exec.call(AnalyticsStateMachine, timestamp, eventObject);
    } else {
      logger.log('Ignored Event: ' + eventType);
    }
  };
};
