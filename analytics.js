/**
 * Created by Bitmovin on 13.09.2016.
 */

var overall;
var lastSampleDuration;

var initAdTime;
var initPlayTime;
var initBufferTime;
var initSeekTime = 0;
var initPauseTime = 0;

var playing;
var start = true;
var isSeeking = false;
var isPausing = false;

var analyticsObject = {

    key:                "02eaa791-d55c-45ff-9b93-1ca36e0cc0dd",         // READY
    domain:             window.location.hostname,                       // READY
    userId:             "",                                             // NOT READY YET
    language:           navigator.language || navigator.userLanguage,   // READY
    impressionId:       "2aaa",                                         // NOT READY YET
    playerTech:         "",                                             // READY
    userAgent:          navigator.userAgent,                            // READY
    screenWidth:        screen.width,                                   // READY
    screenHeight:       screen.height,                                  // READY
    streamFormat:       "",                                             // READY
    version:            "",                                             // READY
    isLive:             false,                                          // READY
    isCasting:          false,                                          // READY
    videoDuration:      "",                                             // READY
    videoId:            "",                                             // READY
    playerStartupTime:  0,                                              // READY
    videoStartupTime:   0,                                              // READY
    customUserId:       "",                                             // NOT READY YET
    size:               "WINDOW",                                       // READY
    videoWindowWidth:   0,                                              // NOT READY YET
    videoWindowHeight:  0,                                              // NOT READY YET
    droppedFrames:      0,                                              // READY
    played:             0,                                              // READY
    buffered:           0,                                              // READY
    paused:             0,                                              // READY
    ad:                 0,                                              // READY
    seeked:             0,                                              // READY
    videoPlaybackWidth: 0,                                              // READY
    videoPlaybackHeight:    0,                                          // READY
    videoBitrate:       0,                                              // READY
    audioBitrate:       0,                                              // READY
    videoTimeStart:     0,                                              // READY
    videoTimeEnd:       0,                                              // READY
    duration:           0                                               // READY
};

function analyze(player) {

    var initTime = new Date().getTime();

    // bool variable to recognize first sample
    // at the beginning of the function it is true

    var firstSample = true;

    // the quality will change at the beginning as soon as the player enters the play state.
    // we will skip it and provide quality information in the first sample otherwise a new sample will be sended.
    // this will only happen for the first sample - so just once

    var skipVideoPlaybackChange = true;
    var skipAudioPlaybackChange = true;

    analyticsObject.isLive = player.isLive();
    analyticsObject.version = player.getVersion();
    analyticsObject.isCasting = player.isCasting();
    analyticsObject.droppedFrames = player.getDroppedFrames();

    /*
        set videoID of player instance if available
    */
    if (player.getConfig().source.videoId != undefined) {

        analyticsObject.videoId = player.getConfig().source.videoId;
    }

    player.addEventHandler(bitdash.EVENT.ON_READY, function(event) {

        /*
            set playerStartupTime
            from init time till player is ready for API calls
        */
        analyticsObject.playerStartupTime = event.timestamp - initTime;

        /*
            set playerTech, streamFormat, videoDuration
            they are first available on player ready function
        */
        analyticsObject.playerTech = player.getPlayerType();
        analyticsObject.streamFormat = player.getStreamType().toUpperCase();
        analyticsObject.videoDuration = player.getDuration() * 1000;
    });

    player.addEventHandler(bitdash.EVENT.ON_PLAY, function(event) {

        /*
            init playing time
        */
        initPlayTime = event.timestamp;

        /*
            call sample which was paused after resuming
        */
        if (initPauseTime != 0) {

            analyticsObject.paused = event.timestamp - initPauseTime;
            analyticsObject.duration = calculateDuration(initTime, event.timestamp);

            console.log("Sending: " + JSON.stringify(analyticsObject));
            console.log("duration: " + lastSampleDuration);
            //sendRequest(analyticsObject);

            clearValues(event.timestamp);
            isPausing = false;
        }
    });

    // ALSO FOR AD STARTING
    player.addEventHandler(bitdash.EVENT.ON_PAUSE, function(event) {

        analyticsObject.videoTimeEnd = calculateTime(player.getCurrentTime());
        analyticsObject.duration = calculateDuration(initTime, event.timestamp);

        console.log("Sending: " + JSON.stringify(analyticsObject));
        console.log("duration: " + lastSampleDuration);
        //sendRequest(analyticsObject);
        
        clearValues(event.timestamp);
        /*
         init playing time
         */
        initPauseTime = event.timestamp;
        isPausing = true;
    });

    player.addEventHandler(bitdash.EVENT.ON_TIME_CHANGED, function(event) {

        /*
            if not pausing set or update played attribute
        */
        if (!isPausing && !isSeeking) {
            playing = event.timestamp - initPlayTime;
            analyticsObject.played = Math.round(playing);
            console.log(playing);
        }

        /*
            set video playback data
            for first frame and if video playback data has not changed yet
        */
        analyticsObject.videoPlaybackWidth = player.getPlaybackVideoData().width;
        analyticsObject.videoPlaybackHeight = player.getPlaybackVideoData().height;
        analyticsObject.videoBitrate = player.getPlaybackVideoData().bitrate;

        /*
             set audio playback data
             for first frame and if audio playback data has not changed yet
        */
        analyticsObject.audioBitrate = player.getPlaybackAudioData().bitrate;

        /*
            only relevant if first frame occurs
        */
        if (firstSample == true) {

            firstSample = false;
            analyticsObject.videoStartupTime = event.timestamp - initPlayTime;
            analyticsObject.duration = event.timestamp - initTime;
            overall = analyticsObject.duration;

            console.log("Sending: " + JSON.stringify(analyticsObject));
            console.log("duration: " + analyticsObject.duration);
            //sendRequest(analyticsObject);

            clearValues(event.timestamp);
        }
        else if (!firstSample && start == true) {
            start = false;
            analyticsObject.videoTimeStart = calculateTime(player.getCurrentTime());
        }
    });

    player.addEventHandler(bitdash.EVENT.ON_SEEK, function(event) {

        if (!isSeeking) {

            /*
                set init seek time
                represents the beginning of seek progress
            */
            initSeekTime = event.timestamp;

            analyticsObject.videoTimeEnd = calculateTime(player.getCurrentTime());
            analyticsObject.duration = calculateDuration(initTime, event.timestamp);

            console.log("Sending: " + JSON.stringify(analyticsObject));
            console.log("duration: " + lastSampleDuration);
            //sendRequest(analyticsObject);

            clearValues(event.timestamp);

            start = false;
            isSeeking = true;
            analyticsObject.videoTimeStart = calculateTime(player.getCurrentTime());
        }
    });

    player.addEventHandler(bitdash.EVENT.ON_START_BUFFERING, function(event) {

        /*
             set init buffer time
             represents the beginning of buffer progress
        */
        initBufferTime = event.timestamp;
    });

    // ALSO FOR SEEK END
    player.addEventHandler(bitdash.EVENT.ON_STOP_BUFFERING, function(event) {

        /*
             calculate time of whole seeking process
        */
        analyticsObject.buffered = event.timestamp - initBufferTime;

        if (isSeeking) {

            /* have to set played attribute to 0 due to some time changing between seek end and buffering */
            analyticsObject.played = 0;

            analyticsObject.seeked = event.timestamp - initSeekTime;
            analyticsObject.videoTimeEnd = calculateTime(player.getCurrentTime());
            analyticsObject.duration = calculateDuration(initTime, event.timestamp);

            console.log("Sending: " + JSON.stringify(analyticsObject));
            console.log("duration: " + lastSampleDuration);
            //sendRequest(analyticsObject);

            clearValues(event.timestamp);
            isSeeking = false;
        }
    });

    player.addEventHandler(bitdash.EVENT.ON_AUDIO_CHANGE, function(event) {

        if (!skipAudioPlaybackChange && !isSeeking) {

            /*
             get the audio bitrate data for the new sample
             */
            analyticsObject.audioBitrate = event.bitrate;
            analyticsObject.videoTimeEnd = calculateTime(player.getCurrentTime());
            analyticsObject.duration = calculateDuration(initTime, event.timestamp);

            console.log("Sending: " + JSON.stringify(analyticsObject));
            console.log("duration: " + lastSampleDuration);
            //sendRequest(analyticsObject);

            clearValues(event.timestamp);
        }
        else {
            skipAudioPlaybackChange = false;
            skipVideoPlaybackChange = false;
        }
    });

    player.addEventHandler(bitdash.EVENT.ON_VIDEO_PLAYBACK_QUALITY_CHANGE, function(event) {

        if (!skipVideoPlaybackChange && !isSeeking) {
            /*
                get the video playback data for the new sample
            */
            analyticsObject.videoPlaybackWidth = player.getPlaybackVideoData().width;
            analyticsObject.videoPlaybackHeight = player.getPlaybackVideoData().height;
            analyticsObject.videoBitrate = player.getPlaybackVideoData().bitrate;

            analyticsObject.videoTimeEnd = calculateTime(player.getCurrentTime());
            analyticsObject.duration = calculateDuration(initTime, event.timestamp);

            console.log("Sending: " + JSON.stringify(analyticsObject));
            console.log("duration: " + lastSampleDuration);
            //sendRequest(analyticsObject);

            clearValues(event.timestamp);
        }
        else {
            skipVideoPlaybackChange = false;
            skipAudioPlaybackChange = false;
        }

    });

    player.addEventHandler(bitdash.EVENT.ON_FULLSCREEN_ENTER, function(event) {

        analyticsObject.duration = calculateDuration(initTime, event.timestamp);
        analyticsObject.videoTimeEnd = calculateTime(player.getCurrentTime());

        console.log("Sending: " + JSON.stringify(analyticsObject));
        console.log("duration: " + lastSampleDuration);
        //sendRequest(analyticsObject);

        clearValues(event.timestamp);
        analyticsObject.size = "FULLSCREEN";
    });

    player.addEventHandler(bitdash.EVENT.ON_FULLSCREEN_EXIT, function(event) {

        analyticsObject.duration = calculateDuration(initTime, event.timestamp);
        analyticsObject.videoTimeEnd = calculateTime(player.getCurrentTime());

        console.log("Sending: " + JSON.stringify(analyticsObject));
        console.log("duration: " + lastSampleDuration);
        //sendRequest(analyticsObject);

        clearValues(event.timestamp);
        analyticsObject.size = "WINDOW";
    });

    player.addEventHandler(bitdash.EVENT.ON_AD_STARTED, function() {

        initAdTime = new Date().getTime();
        clearValues(new Date().getTime());
    });

    player.addEventHandler(bitdash.EVENT.ON_AD_FINISHED, function() {

        analyticsObject.ad = new Date().getTime() - initAdTime;

        analyticsObject.played = 0;
        analyticsObject.duration = calculateDuration(initTime, new Date().getTime());
        analyticsObject.videoTimeEnd = calculateTime(player.getCurrentTime());

        console.log("Sending: " + JSON.stringify(analyticsObject));
        console.log("duration: " + lastSampleDuration);
        //sendRequest(analyticsObject);

        clearValues(new Date().getTime());
    });

    player.addEventHandler(bitdash.EVENT.ON_ERROR, function(event) {
        //TODO
    });

    player.addEventHandler(bitdash.EVENT.ON_PLAYBACK_FINISHED, function(event) {

        analyticsObject.duration = calculateDuration(initTime, event.timestamp);
        analyticsObject.videoTimeEnd = calculateTime(player.getDuration());

        console.log("Sending: " + JSON.stringify(analyticsObject));
        console.log("duration: " + lastSampleDuration);
        //sendRequest(analyticsObject);
    });
}

function sendRequest(object) {

    var xhttp;
    var url = "https://bitdash-reporting-test-dow.appspot.com/analytics";

    if (window.XMLHttpRequest) {
        xhttp = new XMLHttpRequest();
    } else {
        // code for IE6, IE5
        xhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }

    // CHECK RESPONSE
    xhttp.onreadystatechange = function() {

        if (xhttp.readyState == 4) {
            if (xhttp.status == 204) {
                console.log('Connection successful');
            } else {
                console.log('Connection failed');
            }
        }
    };

    // SEND ANALYZE OBJECT
    xhttp.open("POST", url, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify(object));
}

function calculateTime(time) {
    time = time * 1000;
    return Math.round(time);
}

function calculateDuration(initTime, timestamp) {

    lastSampleDuration = timestamp - initTime - overall;
    overall += lastSampleDuration;
    return lastSampleDuration;
}

function clearValues(timestamp) {

    start = true;
    initPauseTime = 0;
    isPausing = false;
    initPlayTime = timestamp;

    analyticsObject.ad = 0;
    analyticsObject.paused = 0;
    analyticsObject.played = 0;
    analyticsObject.buffered = 0;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length,c.length);
        }
    }
    return "";
}