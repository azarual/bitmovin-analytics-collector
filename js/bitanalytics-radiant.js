/**
 * Created by Bitmovin on 23.09.2016.
 */

/**
 * prevent player raising init seeking event
 * just once
 */
var skipInitSeek = true;

var lastQuality = null;

function registerEvents(container, player) {
    container.addEventListener("loadstart", function() {
        analytics.record(analytics.events.SOURCE_LOADED);
    });

    container.addEventListener("ready", function() {
        analytics.record(analytics.events.READY, {
            type:       player.getPlayerMode(),
            version:    player.getPlayerVersion(),
            streamType: player.getStreamType()
            //isLive:     player.isLive(),
            //videoId:    player.getConfig().source.videoId,
            //userId:     player.getConfig().source.userId
        });
    });

    container.addEventListener('durationchange', function() {
        analytics.record(analytics.events.READY, {
            duration:   toSeconds(player.getDuration())
        });
    });

    container.addEventListener("play", function() {
        analytics.record(analytics.events.PLAY);
    });

    container.addEventListener("timeupdate", function() {

        /**
         * get video qualities
         */
        var quality = player.getBitrates()[player.getCurrentBitrateIndex()];
        if (JSON.stringify(quality) != JSON.stringify(lastQuality)) {
            analytics.record(analytics.events.VIDEO_CHANGE, {
                width:          quality.width,
                height:         quality.height,
                bitrate:        quality.bitrate,
                currentTime:    toSeconds(player.getCurrentTime())
            });
            lastQuality = quality;
        }

        analytics.record(analytics.events.TIMECHANGED, {
            currentTime:    toSeconds(player.getCurrentTime())
        });
    });

    container.addEventListener("pause", function() {
        
        /**
         * prevent player to raise pause event during playback finish
         */
        if (player.getCurrentTime() < player.getDuration()) {
            analytics.record(analytics.events.PAUSE, {
                currentTime:    toSeconds(player.getCurrentTime())
            });
        }
    });

    container.addEventListener("seeking", function() {
        if (!skipInitSeek) {
            analytics.record(analytics.events.SEEK, {
                currentTime:    toSeconds(player.getCurrentTime())
            });
        }
    });

    container.addEventListener("waiting", function() {
        analytics.record(analytics.events.START_BUFFERING, {
            currentTime:   toSeconds(player.getCurrentTime())
        });
    });

    container.addEventListener("seeked", function() {
        if (!skipInitSeek) {
            analytics.record(analytics.events.END_BUFFERING, {
                currentTime:    toSeconds(player.getCurrentTime())
            });
        }
        else {
            skipInitSeek = false;
        }

    });

    container.addEventListener("enterfullscreen", function() {
        analytics.record(analytics.events.START_FULLSCREEN, {
            currentTime:    toSeconds(player.getCurrentTime())
        });
    });

    container.addEventListener("exitfullscreen", function() {
        analytics.record(analytics.events.END_FULLSCREEN, {
            currentTime:    toSeconds(player.getCurrentTime())
        });
    });

    container.addEventListener('error', function() {
        analytics.record(analytics.events.ERROR, {
            message:        "Radiant error occurs",
            currentTime:    player.getCurrentTime()
        });
    });

    rmpContainer.addEventListener('ended', function() {
        analytics.record(analytics.events.PLAYBACK_FINISHED);
    });

    container.addEventListener("qualitychangestarted", function() {
        console.log("SWITCH");
    });

    container.addEventListener("adloaded", function() {
        analytics.record(analytics.events.START_AD);
    });

    container.addEventListener("adcomplete", function() {
        analytics.record(analytics.events.END_AD, {
            currentTime:    toSeconds(player.getCurrentTime())
        });
    });

    window.addEventListener("unload", function() {
        analytics.record(analytics.events.UNLOAD, {
            currentTime:    toSeconds(player.getCurrentTime())
        });
    });
}

function toSeconds(time) {

    return time / 1000;
}