/**
 * Created by Bitmovin on 13.09.2016.
 */

function testAnalytics(player) {

    player.addEventHandler(bitdash.EVENT.ON_SOURCE_LOADED, function() {

        analyze.record(analyze.events.SOURCE_LOADED, {});
    });

    player.addEventHandler(bitdash.EVENT.ON_READY, function(event) {

        analyze.record(analyze.events.READY, {
            timestamp:    event.timestamp
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_CAST_START, function() {

        analyze.record(analyze.events.START_CAST, {});
    });

    player.addEventHandler(bitdash.EVENT.ON_CAST_STOP, function() {

        analyze.record(analyze.events.END_CAST, {});
    });

    player.addEventHandler(bitdash.EVENT.ON_PLAY, function(event) {

        analyze.record(analyze.events.PLAY, {
            timestamp:    event.timestamp
        });
    });

    // ALSO FOR AD STARTING
    player.addEventHandler(bitdash.EVENT.ON_PAUSE, function(event) {

        analyze.record(analyze.events.PAUSE, {
            timestamp:      event.timestamp,
            currentTime:    player.getCurrentTime()
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_TIME_CHANGED, function(event) {

        analyze.record(analyze.events.TIMECHANGED, {
            timestamp:      event.timestamp,
            currentTime:    player.getCurrentTime()
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_SEEK, function(event) {

        analyze.record(analyze.events.SEEK, {
            timestamp:      event.timestamp,
            currentTime:    player.getCurrentTime()
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_START_BUFFERING, function(event) {

        analyze.record(analyze.events.START_BUFFERING, {
            timestamp:      event.timestamp
        });
    });

    // ALSO FOR SEEK END
    player.addEventHandler(bitdash.EVENT.ON_STOP_BUFFERING, function(event) {

        analyze.record(analyze.events.END_BUFFERING, {
            timestamp:      event.timestamp,
            currentTime:    player.getCurrentTime()
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_AUDIO_CHANGE, function(event) {

        analyze.record(analyze.events.AUDIO_CHANGE, {
            timestamp:      event.timestamp,
            currentTime:    player.getCurrentTime(),
            bitrate:        event.bitrate
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_VIDEO_PLAYBACK_QUALITY_CHANGE, function(event) {

        analyze.record(analyze.events.VIDEO_CHANGE, {
            timestamp:      event.timestamp,
            currentTime:    player.getCurrentTime(),
            bitrate:        event.bitrate,
            width:          event.width,
            height:         event.height
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_FULLSCREEN_ENTER, function(event) {

        analyze.record(analyze.events.START_FULLSCREEN, {
            timestamp:      event.timestamp,
            currentTime:    player.getCurrentTime()
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_FULLSCREEN_EXIT, function(event) {

        analyze.record(analyze.events.END_FULLSCREEN, {
            timestamp:      event.timestamp,
            currentTime:    player.getCurrentTime()
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_AD_STARTED, function() {

        analyze.record(analyze.events.START_AD, {});
    });

    player.addEventHandler(bitdash.EVENT.ON_AD_FINISHED, function() {

        analyze.record(analyze.events.END_AD, {
            timestamp:      event.timestamp,
            currentTime:    player.getCurrentTime()
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_ERROR, function(event) {

        analyze.record(analyze.events.ERROR, {
            timestamp:      event.timestamp,
            currentTime:    player.getCurrentTime(),
            code:           event.code,
            message:        event.message
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_PLAYBACK_FINISHED, function(event) {

        analyze.record(analyze.events.PLAYBACK_FINISHED, {
            timestamp:      event.timestamp,
            duration:    player.getDuration()
        });
    });
}