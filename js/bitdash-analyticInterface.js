/**
 * Created by Bitmovin on 13.09.2016.
 */

function testAnalytics(player) {

    window.addEventListener("resize", function() {
        analyze.record(analyze.events.SCREEN_RESIZE, {
            currentTime:    player.getCurrentTime()
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_SOURCE_LOADED, function() {
        analyze.record(analyze.events.SOURCE_LOADED);
        //analyze.generateImpressionID;
    });

    player.addEventHandler(bitdash.EVENT.ON_READY, function() {
        analyze.record(analyze.events.READY, {
            isLive:     player.isLive(),
            version:    player.getVersion(),
            type:       player.getPlayerType(),
            duration:   player.getDuration(),
            streamType: player.getStreamType(),
            videoId:    player.getConfig().source.videoId,
            userId:     player.getConfig().source.userId
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_CAST_START, function() {
        analyze.record(analyze.events.START_CAST);
    });

    player.addEventHandler(bitdash.EVENT.ON_CAST_STOP, function() {
        analyze.record(analyze.events.END_CAST);
    });

    player.addEventHandler(bitdash.EVENT.ON_PLAY, function() {
        analyze.record(analyze.events.PLAY, {
            droppedFrames:  player.getDroppedFrames()
        });
    });

    // ALSO FOR AD STARTING
    player.addEventHandler(bitdash.EVENT.ON_PAUSE, function() {
        analyze.record(analyze.events.PAUSE, {
            currentTime:    player.getCurrentTime(),
            droppedFrames:  player.getDroppedFrames()
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_TIME_CHANGED, function() {
        analyze.record(analyze.events.TIMECHANGED, {
            currentTime:    player.getCurrentTime(),
            droppedFrames:  player.getDroppedFrames()
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_SEEK, function() {
        analyze.record(analyze.events.SEEK, {
            currentTime:    player.getCurrentTime(),
            droppedFrames:  player.getDroppedFrames()
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_START_BUFFERING, function() {
        analyze.record(analyze.events.START_BUFFERING);
    });

    // ALSO FOR SEEK END
    player.addEventHandler(bitdash.EVENT.ON_STOP_BUFFERING, function() {
        analyze.record(analyze.events.END_BUFFERING, {
            currentTime:    player.getCurrentTime(),
            droppedFrames:  player.getDroppedFrames()
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_AUDIO_PLAYBACK_QUALITY_CHANGE, function() {
        var quality = player.getPlaybackAudioData();

        analyze.record(analyze.events.AUDIO_CHANGE, {
            bitrate:        quality.bitrate,
            currentTime:    player.getCurrentTime(),
            droppedFrames:  player.getDroppedFrames()
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_VIDEO_PLAYBACK_QUALITY_CHANGE, function() {
        var quality = player.getPlaybackVideoData();
        
        analyze.record(analyze.events.VIDEO_CHANGE, {
            width:          quality.width,
            height:         quality.height,
            bitrate:        quality.bitrate,
            currentTime:    player.getCurrentTime(),
            droppedFrames:  player.getDroppedFrames()
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_FULLSCREEN_ENTER, function() {
        analyze.record(analyze.events.START_FULLSCREEN, {
            currentTime:    player.getCurrentTime(),
            droppedFrames:  player.getDroppedFrames()
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_FULLSCREEN_EXIT, function() {
        analyze.record(analyze.events.END_FULLSCREEN, {
            currentTime:    player.getCurrentTime(),
            droppedFrames:  player.getDroppedFrames()
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_AD_STARTED, function() {
        analyze.record(analyze.events.START_AD);
    });

    player.addEventHandler(bitdash.EVENT.ON_AD_FINISHED, function() {
        analyze.record(analyze.events.END_AD, {
            currentTime:    player.getCurrentTime(),
            droppedFrames:  player.getDroppedFrames()
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_ERROR, function(event) {
        analyze.record(analyze.events.ERROR, {
            code:           event.code,
            message:        event.message,
            currentTime:    player.getCurrentTime(),
            droppedFrames:  player.getDroppedFrames()
        });
    });

    player.addEventHandler(bitdash.EVENT.ON_PLAYBACK_FINISHED, function() {
        analyze.record(analyze.events.PLAYBACK_FINISHED, {
            droppedFrames:  player.getDroppedFrames()
        });
    });
}