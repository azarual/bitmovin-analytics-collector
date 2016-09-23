/**
 * Created by Bitmovin on 23.09.2016.
 */

/**
 * prevent player raising init seeking event
 * just once
 */
var skipInitSeek = true;

var lastQuality = null;

function testRadiantAnalytics(container, player) {

    console.log("RESIZE");
    window.addEventListener("resize", function() {

        analyze.record(analyze.events.SCREEN_RESIZE, {
            currentTime:    toSeconds(player.getCurrentTime())
        });
    });

    container.addEventListener("loadstart", function() {

        analyze.record(analyze.events.SOURCE_LOADED);
    });

    container.addEventListener("ready", function() {

        analyze.record(analyze.events.READY, {

            type:       player.getPlayerMode(),
            version:    player.getPlayerVersion(),
            streamType: player.getStreamType()
            //isLive:     player.isLive(),
            //videoId:    player.getConfig().source.videoId,
            //userId:     player.getConfig().source.userId
        });
    });

    container.addEventListener('durationchange', function() {

        analyze.record(analyze.events.READY, {
            duration:   toSeconds(player.getDuration())
        });
    });

    container.addEventListener("play", function() {

        analyze.record(analyze.events.PLAY);
    });

    container.addEventListener("timeupdate", function() {

        /**
         * get video qualities
         */
        var quality = player.getBitrates()[player.getCurrentBitrateIndex()];
        if (JSON.stringify(quality) != JSON.stringify(lastQuality)) {

            analyze.record(analyze.events.VIDEO_CHANGE, {

                width:          quality.width,
                height:         quality.height,
                bitrate:        quality.bitrate,
                currentTime:    toSeconds(player.getCurrentTime())
            });
            lastQuality = quality;
        }

        analyze.record(analyze.events.TIMECHANGED, {
            currentTime:    toSeconds(player.getCurrentTime())
        });
    });

    container.addEventListener("pause", function() {

        /**
         * prevent player to raise pause event during playback finish
         */
        if (player.getCurrentTime() < player.getDuration()) {

            analyze.record(analyze.events.PAUSE, {
                currentTime:    toSeconds(player.getCurrentTime())
            });
        }
    });

    container.addEventListener("seeking", function() {

        if (!skipInitSeek) {

            analyze.record(analyze.events.SEEK, {
                currentTime:    toSeconds(player.getCurrentTime())
            });
        }
    });

    container.addEventListener("waiting", function() {

        analyze.record(analyze.events.START_BUFFERING, {
            currentTime:   toSeconds(player.getCurrentTime())
        });
    });

    container.addEventListener("seeked", function() {

        if (!skipInitSeek) {

            analyze.record(analyze.events.END_BUFFERING, {
                currentTime:    toSeconds(player.getCurrentTime())
            });
        }
        else {
            skipInitSeek = false;
        }

    });

    container.addEventListener("enterfullscreen", function() {

        analyze.record(analyze.events.START_FULLSCREEN, {

            currentTime:    toSeconds(player.getCurrentTime())
        });
    });

    container.addEventListener("exitfullscreen", function() {

        analyze.record(analyze.events.END_FULLSCREEN, {

            currentTime:    toSeconds(player.getCurrentTime())
        });
    });

    container.addEventListener('error', function() {

        analyze.record(analyze.events.ERROR, {

            message:        "Radiant error occurs",
            currentTime:    player.getCurrentTime()
        });
    });

    rmpContainer.addEventListener('ended', function() {

        analyze.record(analyze.events.PLAYBACK_FINISHED);
    });

    container.addEventListener("qualitychangestarted", function() {

        console.log("SWITCH");
    });

    container.addEventListener("adloaded", function() {

        analyze.record(analyze.events.START_AD);
    });

    container.addEventListener("adcomplete", function() {

        analyze.record(analyze.events.END_AD, {

            currentTime:    toSeconds(player.getCurrentTime())
        });
    });
}

function toSeconds(time) {

    return time / 1000;
}