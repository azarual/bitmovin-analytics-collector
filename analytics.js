/**
 * Created by Bitmovin on 13.09.2016.
 */

function analyze(player) {

    var initTime = new Date().getTime();

    var overall = 0;
    var initAdTime;
    var initPlayTime;
    var initBufferTime;
    var initPauseTime = 0;
    var lastSampleDuration;

    var playing;
    var once = true;
    var start = true;
    var firstSample = true;
    var userAgent = navigator.userAgent;
    var screenWidth = screen.width;
    var screenHeight = screen.height;
    var lang = navigator.language || navigator.userLanguage;

    var analyticsObject = {

        key:    "02eaa791-d55c-45ff-9b93-1ca36e0cc0dd",//player.getConfig().key,                 // READY
        domain: window.location.hostname,              // READY
        userId: "",                                    // NOT READY YET
        language:   lang,                              // READY
        impressionId:   "2aaa",                        // NOT READY YET
        playerTech:     "",                            // READY
        userAgent:      userAgent,                     // READY
        screenWidth:    screenWidth,                   // READY
        screenHeight:   screenHeight,                  // READY
        streamFormat:   "",                            // READY
        version:        player.getVersion(),           // READY
        isLive:         player.isLive(),               // READY
        isCasting:      player.isCasting(),            // READY
        videoDuration:  "",                            // READY
        videoId:        "",                            // NOT READY YET
        playerStartupTime:  0,                         // READY
        videoStartupTime:   0,                         // READY
        customUserId:       "",                        // NOT READY YET
        size:               "WINDOW",                  // READY
        videoWindowWidth:  0,                          // NOT READY YET
        videoWindowHeight:  0,                         // NOT READY YET
        droppedFrames:      player.getDroppedFrames(), // READY
        played:             0,                         // READY
        buffered:           0,                         // READY
        paused:             0,                         // READY
        ad:                 0,                         // NOT READY
        seeked:             0,                         // NOT READY
        videoPlaybackWidth: 0,                         // READY
        videoPlaybackHeight:    0,                     // READY
        videoBitrate:       0,                         // READY
        audioBitrate:       0,                         // READY
        videoTimeStart:     0,                         // READY
        videoTimeEnd:       0,                         // READY
        duration:           0                          // READY
    };

    player.addEventHandler(bitdash.EVENT.ON_READY, function(event) {

        // PLAYER STARTUP TIME
        analyticsObject.playerStartupTime = event.timestamp - initTime;

        analyticsObject.playerTech = player.getPlayerType();
        analyticsObject.streamFormat = player.getStreamType().toUpperCase();
        analyticsObject.videoDuration = player.getDuration();
    });

    player.addEventHandler(bitdash.EVENT.ON_PLAY, function(event) {

        // INIT FOR PLAYING
        initPlayTime = event.timestamp;

        if (initPauseTime != 0) {
            var pause = event.timestamp - initPauseTime;
            initPauseTime = 0;

            analyticsObject.paused = pause;

            //sendRequest(analyticsObject);
            console.log("Sending: " + JSON.stringify(analyticsObject));
            console.log("duration: " + lastSampleDuration);

            // CLEAR VALUES
            start = true;
            initPlayTime = event.timestamp;
            analyticsObject.buffered = 0;
            analyticsObject.paused = 0;
            analyticsObject.ad = 0;
        }
    });

    player.addEventHandler(bitdash.EVENT.ON_PAUSE, function(event) {

        initPauseTime = event.timestamp;

        analyticsObject.videoTimeEnd = player.getCurrentTime();

        // CALCULATE SAMPLE DURATION
        lastSampleDuration = event.timestamp - initTime - overall;
        overall += lastSampleDuration;
        analyticsObject.duration = lastSampleDuration;
    });

    player.addEventHandler(bitdash.EVENT.ON_TIME_CHANGED, function(event) {

        // PLAYING
        playing = event.timestamp - initPlayTime;
        analyticsObject.played = Math.round(playing);
        console.log(playing);

        // PLAYBACK VIDEO DATA
        analyticsObject.videoPlaybackWidth = player.getPlaybackVideoData().width;
        analyticsObject.videoPlaybackHeight = player.getPlaybackVideoData().height;
        analyticsObject.videoBitrate = player.getPlaybackVideoData().bitrate;

        // PLAYBACK AUDIO DATA
        analyticsObject.audioBitrate = player.getPlaybackAudioData().bitrate;

        if (firstSample == true) {
            firstSample = false;

            // VIDEO STARTUP TIME
            analyticsObject.videoStartupTime = event.timestamp - initPlayTime;

            // CALCULATE SAMPLE DURATION
            lastSampleDuration = event.timestamp - initTime;
            overall = lastSampleDuration;
            analyticsObject.duration = lastSampleDuration;
            console.log("Sending: " + JSON.stringify(analyticsObject));
            console.log("duration: " + lastSampleDuration);
            //sendRequest(analyticsObject);

            //CLEAR VALUES
            start = true;
            initPlayTime = event.timestamp;
            analyticsObject.buffered = 0;
            analyticsObject.ad = 0;
        }
        else if (!firstSample && start == true) {
            start = false;
            analyticsObject.videoTimeStart = player.getCurrentTime();
        }
    });

    player.addEventHandler(bitdash.EVENT.ON_AUDIO_CHANGE, function(event) {

        analyticsObject.audioBitrate = event.bitrate;
        analyticsObject.videoTimeEnd = player.getCurrentTime();

        // CALCULATE SAMPLE DURATION
        lastSampleDuration = event.timestamp - initTime - overall;
        overall += lastSampleDuration;
        analyticsObject.duration = lastSampleDuration;
        console.log("Sending: " + JSON.stringify(analyticsObject));
        console.log("duration: " + lastSampleDuration);
        //sendRequest(analyticsObject);

        // CLEAR VALUES
        start = true;
        initPlayTime = event.timestamp;
        analyticsObject.buffered = 0;
        analyticsObject.ad = 0;
    });

    player.addEventHandler(bitdash.EVENT.ON_VIDEO_PLAYBACK_QUALITY_CHANGE, function(event) {

        if (!once) {
            // PLAYBACK VIDEO DATA
            analyticsObject.videoPlaybackWidth = player.getPlaybackVideoData().width;
            analyticsObject.videoPlaybackHeight = player.getPlaybackVideoData().height;
            analyticsObject.videoBitrate = player.getPlaybackVideoData().bitrate;

            // CALCULATE SAMPLE DURATION
            lastSampleDuration = event.timestamp - initTime - overall;
            overall += lastSampleDuration;
            analyticsObject.duration = lastSampleDuration;

            analyticsObject.videoTimeEnd = player.getCurrentTime();

            console.log("Sending: " + JSON.stringify(analyticsObject));
            console.log("duration: " + lastSampleDuration);
            //sendRequest(analyticsObject);

            // CLEAR VALUES
            start = true;
            initPlayTime = event.timestamp;
            analyticsObject.buffered = 0;
            analyticsObject.ad = 0;
        }
        else {
            once = false;
        }

    });

    player.addEventHandler(bitdash.EVENT.ON_START_BUFFERING, function(event) {

        initBufferTime = event.timestamp;
    });

    player.addEventHandler(bitdash.EVENT.ON_STOP_BUFFERING, function(event) {

        analyticsObject.buffered += event.timestamp - initBufferTime;
    });

    player.addEventHandler(bitdash.EVENT.ON_FULLSCREEN_ENTER, function(event) {

        analyticsObject.size = "FULLSCREEN";

        // CALCULATE SAMPLE DURATION
        lastSampleDuration = event.timestamp - initTime - overall;
        overall += lastSampleDuration;
        analyticsObject.duration = lastSampleDuration;

        analyticsObject.videoTimeEnd = player.getCurrentTime();

        console.log("Sending: " + JSON.stringify(analyticsObject));
        console.log("duration: " + lastSampleDuration);
        //sendRequest(analyticsObject);

        // CLEAR VALUES
        start = true;
        initPlayTime = event.timestamp;
        analyticsObject.buffered = 0;
        analyticsObject.ad = 0;
    });

    player.addEventHandler(bitdash.EVENT.ON_FULLSCREEN_EXIT, function(event) {

        analyticsObject.size = "WINDOW";

        // CALCULATE SAMPLE DURATION
        lastSampleDuration = event.timestamp - initTime - overall;
        overall += lastSampleDuration;
        analyticsObject.duration = lastSampleDuration;

        analyticsObject.videoTimeEnd = player.getCurrentTime();

        console.log("Sending: " + JSON.stringify(analyticsObject));
        console.log("duration: " + lastSampleDuration);
        //sendRequest(analyticsObject);

        // CLEAR VALUES
        start = true;
        initPlayTime = event.timestamp;
        analyticsObject.buffered = 0;
        analyticsObject.ad = 0;
    });

    player.addEventHandler(bitdash.EVENT.ON_AD_STARTED, function() {

        initAdTime = new Date().getTime();

        // CALCULATE SAMPLE DURATION
        lastSampleDuration = initAdTime - initTime - overall;
        overall += lastSampleDuration;
        analyticsObject.duration = lastSampleDuration;

        analyticsObject.videoTimeEnd = player.getCurrentTime();

        console.log("Sending: " + JSON.stringify(analyticsObject));
        console.log("duration: " + lastSampleDuration);
        //sendRequest(analyticsObject);

        // CLEAR VALUES
        start = true;
        initPlayTime = initAdTime;
        analyticsObject.buffered = 0;
        analyticsObject.ad = 0;
        initPauseTime = 0;
    });

    player.addEventHandler(bitdash.EVENT.ON_AD_FINISHED, function() {

        analyticsObject.ad = new Date().getTime() - initAdTime;

        // CALCULATE SAMPLE DURATION
        lastSampleDuration = new Date().getTime() - initTime - overall;
        overall += lastSampleDuration;
        analyticsObject.duration = lastSampleDuration;

        analyticsObject.videoTimeEnd = player.getCurrentTime();

        console.log("Sending: " + JSON.stringify(analyticsObject));
        console.log("duration: " + lastSampleDuration);
        //sendRequest(analyticsObject);

        // CLEAR VALUES
        start = true;
        initPlayTime = new Date().getTime();
        analyticsObject.buffered = 0;
        analyticsObject.ad = 0;
    });

    player.addEventHandler(bitdash.EVENT.ON_ERROR, function(event) {
        //TODO
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