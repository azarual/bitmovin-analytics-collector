/**
 * Created by Bitmovin on 19.09.2016.
 */

/**
 * Note
 * Ads are also not working due to a missing JW advertising license
 */


/**
 *
 * @type {boolean}
 * variable to skip init resize event
 */
var skipInitResize = true;
var levelsChanged = false;
var firstSample = true;

function testJWAnalytics(player) {

    player.on("playlist", function() {
        analyze.record(analyze.events.SOURCE_LOADED);
    });

    player.on("ready", function() {
        var streamType;
        if (player.getProvider().name == "shaka") {
            streamType = "DASH";
        }
        else {
            streamType = "unknown";
        }
        
        analyze.record(analyze.events.READY, {
            /**
             *  jw player is always rendering in html5 mode
             *  according to https://github.com/jwplayer/jwplayer/wiki/2.2-JW-Player-API-Reference#getters
             */
            type:       "html5",
            version:    player.version.substring(0, 5),
            duration:   player.getDuration(),
            streamType: streamType
            //isLive:     player.isLive(),
            //videoId:    player.getConfig().source.videoId,
            //userId:     player.getConfig().source.userId
        });
    });

    player.on("play", function() {
        analyze.record(analyze.events.READY, {
            duration:   player.getDuration()
        });
        analyze.record(analyze.events.PLAY);
    });

    player.on("pause", function() {
        if (!levelsChanged && !firstSample) {
            analyze.record(analyze.events.PAUSE, {
                currentTime:    player.getPosition()
            });
        }
        else {
            levelsChanged = false;
        }
    });

    player.on("levelsChanged", function() {
        levelsChanged = true;
    });

    player.on("time", function() {
        firstSample = false;
        skipInitResize = false;
        
        analyze.record(analyze.events.TIMECHANGED, {
            currentTime:    player.getPosition()
        });
    });

    player.on('audioTrackChanged', function(event) {
        console.log("AUDIO: " + JSON.stringify(event));
    });

    player.on('visualQuality', function(event) {
        analyze.record(analyze.events.VIDEO_CHANGE, {
            width:          event.level.width,
            height:         event.level.height,
            bitrate:        event.level.bitrate,
            currentTime:    player.getPosition()
        });
    });

    player.on("seek", function() {
        analyze.record(analyze.events.SEEK, {
            currentTime:    player.getPosition()
        });
    });

    player.on("bufferChange", function() {
        analyze.record(analyze.events.START_BUFFERING, {
            currentTime:    player.getPosition()
        });
    });

    player.on("seeked", function() {
        analyze.record(analyze.events.END_BUFFERING, {
            currentTime:    player.getPosition()
        });
    });

    player.on("qualityChange", function(event) {
        console.log(JSON.stringify(event));
    });

    player.on("fullscreen", function(event) {
        if (event.fullscreen == true) {
            analyze.record(analyze.events.START_FULLSCREEN, {
                currentTime:    player.getPosition()
            });
        }
        else {
            analyze.record(analyze.events.END_FULLSCREEN, {
                currentTime:    player.getPosition()
            });
        }
    });

    player.on("resize", function() {
        /**
         *  this event is thrown before on the first time change event
         *  so we have to skip it the first time
         */
        if (!skipInitResize) {
            analyze.record(analyze.events.SCREEN_RESIZE, {
                currentTime:    player.getPosition()
            });
        }
    });

    player.on("error", function(event) {
        analyze.record(analyze.events.ERROR, {
            message:        event.message,
            currentTime:    player.getPosition()
        });
    });

    player.on("complete", function() {
        analyze.record(analyze.events.PLAYBACK_FINISHED);
    });
}
