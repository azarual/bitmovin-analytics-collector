/**
 * Created by Bitmovin on 13.09.2016.
 */

function registerEvents(player) {

    player.addEventHandler(bitmovin.player.EVENT.ON_SOURCE_LOADED, function() {
        analytics.record(analytics.events.SOURCE_LOADED);
        //analytics.generateImpressionID;
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_READY, function() {
        analytics.record(analytics.events.READY, {
            isLive:     player.isLive(),
            version:    player.getVersion(),
            type:       player.getPlayerType(),
            duration:   player.getDuration(),
            streamType: player.getStreamType(),
            videoId:    player.getConfig().source.videoId,
            userId:     player.getConfig().source.userId
        });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_CAST_START, function() {
        analytics.record(analytics.events.START_CAST);
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_CAST_STOP, function() {
        analytics.record(analytics.events.END_CAST);
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_PLAY, function() {
        analytics.record(analytics.events.PLAY, {
            droppedFrames:  player.getDroppedFrames()
        });
    });

    // ALSO FOR AD STARTING
    player.addEventHandler(bitmovin.player.EVENT.ON_PAUSE, function() {
        analytics.record(analytics.events.PAUSE, {
            currentTime:    player.getCurrentTime(),
            droppedFrames:  player.getDroppedFrames()
        });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_TIME_CHANGED, function() {
        analytics.record(analytics.events.TIMECHANGED, {
            currentTime:    player.getCurrentTime(),
            droppedFrames:  player.getDroppedFrames()
        });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_SEEK, function() {
        analytics.record(analytics.events.SEEK, {
            currentTime:    player.getCurrentTime(),
            droppedFrames:  player.getDroppedFrames()
        });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_START_BUFFERING, function() {
        analytics.record(analytics.events.START_BUFFERING);
    });

    // ALSO FOR SEEK END
    player.addEventHandler(bitmovin.player.EVENT.ON_STOP_BUFFERING, function() {
        analytics.record(analytics.events.END_BUFFERING, {
            currentTime:    player.getCurrentTime(),
            droppedFrames:  player.getDroppedFrames()
        });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_AUDIO_PLAYBACK_QUALITY_CHANGE, function() {
        var quality = player.getPlaybackAudioData();

        analytics.record(analytics.events.AUDIO_CHANGE, {
            bitrate:        quality.bitrate,
            currentTime:    player.getCurrentTime(),
            droppedFrames:  player.getDroppedFrames()
        });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_VIDEO_PLAYBACK_QUALITY_CHANGE, function() {
        var quality = player.getPlaybackVideoData();
        
        analytics.record(analytics.events.VIDEO_CHANGE, {
            width:          quality.width,
            height:         quality.height,
            bitrate:        quality.bitrate,
            currentTime:    player.getCurrentTime(),
            droppedFrames:  player.getDroppedFrames()
        });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_FULLSCREEN_ENTER, function() {
        analytics.record(analytics.events.START_FULLSCREEN, {
            currentTime:    player.getCurrentTime(),
            droppedFrames:  player.getDroppedFrames()
        });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_FULLSCREEN_EXIT, function() {
        analytics.record(analytics.events.END_FULLSCREEN, {
            currentTime:    player.getCurrentTime(),
            droppedFrames:  player.getDroppedFrames()
        });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_AD_STARTED, function() {
        analytics.record(analytics.events.START_AD);
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_AD_FINISHED, function() {
        analytics.record(analytics.events.END_AD, {
            currentTime:    player.getCurrentTime(),
            droppedFrames:  player.getDroppedFrames()
        });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_ERROR, function(event) {
        analytics.record(analytics.events.ERROR, {
            code:           event.code,
            message:        event.message,
            currentTime:    player.getCurrentTime(),
            droppedFrames:  player.getDroppedFrames()
        });
    });

    player.addEventHandler(bitmovin.player.EVENT.ON_PLAYBACK_FINISHED, function() {
        analytics.record(analytics.events.PLAYBACK_FINISHED, {
            droppedFrames:  player.getDroppedFrames()
        });
    });

    var onBeforeUnLoadEvent = false;
    window.onunload = window.onbeforeunload = function() {
        if(!onBeforeUnLoadEvent) {
            onBeforeUnLoadEvent = true;
            analytics.record(analytics.events.UNLOAD, {
                currentTime: player.getCurrentTime(),
                droppedFrames: player.getDroppedFrames()
            });
        }
    };
}