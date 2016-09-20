/**
 * Created by Bitmovin on 19.09.2016.
 *
 * Bitdash reporting for analytics endpoin
 * developed by Patrick Struger
 */

function BitAnalytics(videoId) {

    var initTime = 0;
    var debug = true;
    var containerId = videoId;

    /*
     firstSample - bollean to check if first sample is being played

     skipAudio and skipVideo
     the quality will change at the beginning as soon as the player enters the play state.
     we will skip it and provide quality information in the first sample otherwise a new sample will be sended.
     this will only happen for the first sample - so just once
     */
    var firstSample = true;
    var skipVideoPlaybackChange = true;
    var skipAudioPlaybackChange = true;

    /*
     overall - summarized time of all samples
     lastSampleDuration - summarized time of last samples except the new one
     */
    var overall = 0;
    var lastSampleDuration = 0;

    var playing = 0;
    var droppedSampleFrames = 0;

    /*
     members to initialize individual start time depending on the events
     */
    var initAdTime = 0;
    var initPlayTime = 0;
    var initSeekTime = 0;
    var initPauseTime = 0;
    var initBufferTime = 0;

    /*
     Bool'sche members to check playing, seeking, pausing and ending status
     */
    var start = true;
    var isSeeking = false;
    var isPausing = false;
    var playbackFinished = false;

    /*
     Boolean to check if right API key was provided
     */
    var once = true;
    var granted = false;

    /*
     analytics backend url
     */
    var url = "https://bitdash-reporting-test-dow.appspot.com/analytics";

    var analyticsObject = {
        key:                    "",                                             // READY
        domain:                 window.location.hostname,                       // READY
        path:                   window.location.pathname,                       // READY
        userId:                 "",                                             // READY
        language:               navigator.language || navigator.userLanguage,   // READY
        impressionId:           "",                                             // READY
        playerTech:             "",                                             // READY
        userAgent:              navigator.userAgent,                            // READY
        screenWidth:            screen.width,                                   // READY
        screenHeight:           screen.height,                                  // READY
        streamFormat:           "",                                             // READY
        version:                "",                                             // READY
        isLive:                 false,                                          // READY
        isCasting:              false,                                          // READY
        videoDuration:          "",                                             // READY
        videoId:                "",                                             // READY
        playerStartupTime:      0,                                              // READY
        videoStartupTime:       0,                                              // READY
        customUserId:           "",                                             // READY
        size:                   "WINDOW",                                       // READY
        videoWindowWidth:       0,                                              // READY
        videoWindowHeight:      0,                                              // READY
        droppedFrames:          0,                                              // READY
        played:                 0,                                              // READY
        buffered:               0,                                              // READY
        paused:                 0,                                              // READY
        ad:                     0,                                              // READY
        seeked:                 0,                                              // READY
        videoPlaybackWidth:     0,                                              // READY
        videoPlaybackHeight:    0,                                              // READY
        videoBitrate:           0,                                              // READY
        audioBitrate:           0,                                              // READY
        videoTimeStart:         0,                                              // READY
        videoTimeEnd:           0,                                              // READY
        duration:               0                                               // READY
    };

    this.events = {

        READY:              "ready",
        SOURCE_LOADED:      "sourceLoaded",
        PLAY:               "play",
        PAUSE:              "pause",
        TIMECHANGED:        "timechange",
        SEEK:               "seek",
        START_CAST:         "startCasting",
        END_CAST:           "endCasting",
        START_BUFFERING:    "startBuffering",
        END_BUFFERING:      "endBuffering",
        AUDIO_CHANGE:       "audioChange",
        VIDEO_CHANGE:       "videoChange",
        START_FULLSCREEN:   "startFullscreen",
        END_FULLSCREEN:     "endFullscreen",
        START_AD:           "adStart",
        END_AD:             "adEnd",
        ERROR:              "error",
        PLAYBACK_FINISHED:  "end",
        SCREEN_RESIZE:      "resize"
    };

    /**
     *
     *  private methods
     *  not accessible from outside
     *
     *  - debugReport       --> output to console if debug is enabled
     *  - sendRequest       --> method to send analytics object to bitmovin analytics backend
     *  - calculateTime     --> converts milliseconds to seconds and rounds them
     *  - calculateDuration --> needed to calculate duration of one individual sample
     *  - generateImpresID  --> needed to generate an impression or user id if not available
     *  - getCookie         --> function to read cookie from customer to obtain bitmovin user id
     *  - clearValues       --> after a sample is sended, all values are cleared to provide exacct data for next sample
     *  - getDroppedFrames  --> calculates dropped frames for every single sample
     *
     */

    function debugReport() {
        if (debug) {
            console.log("Sending: " + JSON.stringify(analyticsObject));
            console.log("duration: " + lastSampleDuration);
        }
    }

    function sendRequest() {

        var xhttp;

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
        xhttp.send(JSON.stringify(analyticsObject));
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

    function generateImpressionID() {

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {

            var r = Math.random()*16|0;
            var v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
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

    function clearValues() {

        start = true;
        initPauseTime = 0;
        isPausing = false;
        initPlayTime = new Date().getTime();

        analyticsObject.ad = 0;
        analyticsObject.paused = 0;
        analyticsObject.played = 0;
        analyticsObject.seeked = 0;
        analyticsObject.buffered = 0;
    }

    function getDroppedFrames(frames) {

        if (frames != undefined && frames != 0) {

            var droppedFrames = frames - droppedSampleFrames;
            droppedSampleFrames = frames;
            return droppedFrames;
        }
        else {
            return 0;
        }
    }

    /**
     *
     *  public methods
     *  accessible from outside
     *
     *  - init      --> initialize analytics instance to provide right API key
     *  - record    --> event based analytics reporting function
     *
     */

    this.init = function(object) {

        if (object.key == "" || object.key == undefined || typeof object.key != 'string') {

            console.log("Invalid API key\nConnection refused.")
        }
        else {

            granted = true;
            initTime = new Date().getTime();

            if (object.debug != undefined && typeof object.debug === 'boolean') {

                debug = object.debug;
            }

            analyticsObject.key = object.key;

            /*
                initialize width and height of player container
            */
            analyticsObject.videoWindowWidth = document.getElementById(containerId).offsetWidth;
            analyticsObject.videoWindowHeight = document.getElementById(containerId).offsetHeight;

            /**
             *
             *      get bitdash userId from cookie if exists
             *      if not make sure to generate one
             *
             */
            var userID = getCookie("bitdash_uuid");

            if (userID == "") {

                document.cookie = "bitmovin_player_uuid=" + generateImpressionID();
                analyticsObject.userId = getCookie("bitmovin_player_uuid");
            }
            else {
                analyticsObject.userId = userID;
            }
        }
    };

    this.record = function(event, eventObject = {}) {

        if (granted) {

            var timestamp = new Date().getTime();

            switch (event) {

                case this.events.SOURCE_LOADED:

                    analyticsObject.impressionId = generateImpressionID();
                    break;


                case this.events.READY:

                    analyticsObject.playerStartupTime = timestamp - initTime;

                    analyticsObject.isLive = eventObject.isLive;
                    analyticsObject.version = eventObject.version;
                    analyticsObject.playerTech = eventObject.type;
                    analyticsObject.videoDuration = eventObject.duration;
                    analyticsObject.streamFormat = eventObject.streamType;
                    analyticsObject.videoId = eventObject.videoId;
                    analyticsObject.customUserId = eventObject.userId;
                    break;


                case this.events.PLAY:

                    /*
                        init playing time
                    */
                    initPlayTime = timestamp;

                    /*
                        generate new impression id if new playback
                    */
                    if (playbackFinished) {

                        lastSampleDuration = 0;
                        playbackFinished = false;
                        initTime = timestamp;
                        skipAudioPlaybackChange = true;
                        skipVideoPlaybackChange = true;
                        analyticsObject.videoTimeEnd = 0;
                        analyticsObject.videoTimeStart = 0;
                        analyticsObject.impressionId = generateImpressionID();
                    }

                    /*
                        call sample which was paused after resuming
                    */
                    if (initPauseTime != 0) {

                        analyticsObject.paused = timestamp - initPauseTime;
                        analyticsObject.duration = calculateDuration(initTime, timestamp);
                        analyticsObject.droppedFrames = getDroppedFrames(eventObject.droppedFrames);

                        debugReport();
                        sendRequest();

                        clearValues();
                        isPausing = false;
                    }
                    break;


                case this.events.PAUSE:

                    analyticsObject.videoTimeEnd = calculateTime(eventObject.currentTime);
                    analyticsObject.duration = calculateDuration(initTime, timestamp);
                    analyticsObject.droppedFrames = getDroppedFrames(eventObject.droppedFrames);

                    debugReport();
                    sendRequest();

                    clearValues();
                    /*
                    init playing time
                    */
                    initPauseTime = timestamp;
                    isPausing = true;
                    break;


                case this.events.TIMECHANGED:

                    if (!playbackFinished) {
                        /*
                            if not pausing set or update played attribute
                        */
                        if (!isPausing && !isSeeking) {
                            playing = timestamp - initPlayTime;
                            analyticsObject.played = Math.round(playing);
                            if (debug) {
                                console.log(playing);
                            }
                        }

                        /*
                            only relevant if first frame occurs
                        */
                        if (firstSample == true) {

                            firstSample = false;
                            analyticsObject.videoStartupTime = timestamp - initPlayTime;
                            lastSampleDuration = timestamp - initTime;
                            analyticsObject.duration = lastSampleDuration;
                            overall = analyticsObject.duration;
                            analyticsObject.droppedFrames = getDroppedFrames(eventObject.droppedFrames);

                            debugReport();
                            sendRequest();

                            clearValues();
                        }
                        else if (!firstSample && start == true) {
                            start = false;
                            analyticsObject.videoTimeStart = calculateTime(eventObject.currentTime);
                        }
                    }
                    break;


                case this.events.SEEK:

                    if (!isSeeking && !playbackFinished) {
                        /*
                            set init seek time
                            represents the beginning of seek progress
                        */
                        initSeekTime = timestamp;

                        analyticsObject.videoTimeEnd = calculateTime(eventObject.currentTime);
                        analyticsObject.duration = calculateDuration(initTime, timestamp);
                        analyticsObject.droppedFrames = getDroppedFrames(eventObject.droppedFrames);

                        debugReport();
                        sendRequest();

                        clearValues();

                        start = false;
                        isSeeking = true;
                        analyticsObject.videoTimeStart = calculateTime(eventObject.currentTime);
                    }
                    break;


                case this.events.START_BUFFERING:

                    initBufferTime = timestamp;
                    break;


                case this.events.END_BUFFERING:

                /*
                calculate time of whole seeking process
                */
                analyticsObject.buffered = timestamp - initBufferTime;

                    if (isSeeking) {

                        /* have to set played attribute to 0 due to some time changing between seek end and buffering */
                        analyticsObject.played = 0;

                        analyticsObject.seeked = timestamp - initSeekTime;
                        analyticsObject.videoTimeEnd = calculateTime(eventObject.currentTime);
                        analyticsObject.duration = calculateDuration(initTime, timestamp);
                        analyticsObject.droppedFrames = getDroppedFrames(eventObject.droppedFrames);

                        debugReport();
                        sendRequest();

                        clearValues();
                        isSeeking = false;
                    }
                    break;


                case this.events.AUDIO_CHANGE:

                    if (!skipAudioPlaybackChange && !isSeeking) {

                        /*
                            get the audio bitrate data for the new sample
                        */
                        analyticsObject.audioBitrate = eventObject.bitrate;
                        analyticsObject.videoTimeEnd = calculateTime(eventObject.currentTime);
                        analyticsObject.duration = calculateDuration(initTime, timestamp);
                        analyticsObject.droppedFrames = getDroppedFrames(eventObject.droppedFrames);

                        debugReport();
                        sendRequest();

                        clearValues();
                    }
                    else {
                        /*
                            set audio playback data
                            for first frame and if audio playback data has not changed yet
                        */
                        analyticsObject.audioBitrate = eventObject.bitrate;
                        skipAudioPlaybackChange = false;
                        skipVideoPlaybackChange = false;
                    }
                    break;


                case this.events.VIDEO_CHANGE:

                    if (!skipVideoPlaybackChange && !isSeeking) {
                        /*
                            get the video playback data for the new sample
                        */
                        analyticsObject.videoPlaybackWidth = eventObject.width;
                        analyticsObject.videoPlaybackHeight = eventObject.height;
                        analyticsObject.videoBitrate = eventObject.bitrate;

                        analyticsObject.videoTimeEnd = calculateTime(eventObject.currentTime);
                        analyticsObject.duration = calculateDuration(initTime, timestamp);
                        analyticsObject.droppedFrames = getDroppedFrames(eventObject.droppedFrames);

                        debugReport();
                        sendRequest();

                        clearValues();
                    }
                    else {
                        /*
                            set video playback data
                            for first frame and if video playback data has not changed yet
                        */
                        analyticsObject.videoPlaybackWidth = eventObject.width;
                        analyticsObject.videoPlaybackHeight = eventObject.height;
                        analyticsObject.videoBitrate = eventObject.bitrate;
                        skipVideoPlaybackChange = false;
                        skipAudioPlaybackChange = false;
                    }
                    break;


                case this.events.START_FULLSCREEN:

                    analyticsObject.duration = calculateDuration(initTime, timestamp);
                    analyticsObject.videoTimeEnd = calculateTime(eventObject.currentTime);
                    analyticsObject.droppedFrames = getDroppedFrames(eventObject.droppedFrames);

                    debugReport();
                    sendRequest();

                    clearValues();
                    analyticsObject.size = "FULLSCREEN";
                    break;


                case this.events.END_FULLSCREEN:

                    analyticsObject.duration = calculateDuration(initTime, timestamp);
                    analyticsObject.videoTimeEnd = calculateTime(eventObject.currentTime);
                    analyticsObject.droppedFrames = getDroppedFrames(eventObject.droppedFrames);

                    debugReport();
                    sendRequest();

                    clearValues();
                    analyticsObject.size = "WINDOW";
                    break;


                case this.events.START_AD:

                    initAdTime = timestamp;
                    clearValues();
                    break;


                case this.events.END_AD:

                    analyticsObject.ad = timestamp - initAdTime;

                    analyticsObject.played = 0;
                    analyticsObject.duration = calculateDuration(initTime, timestamp);
                    analyticsObject.videoTimeEnd = calculateTime(eventObject.currentTime);
                    analyticsObject.droppedFrames = getDroppedFrames(eventObject.droppedFrames);

                    debugReport();
                    sendRequest();

                    clearValues();
                    break;


                case this.events.ERROR:

                    /*
                        add error code property from analytics object
                    */
                    analyticsObject.errorCode = eventObject.code;
                    analyticsObject.errorMessage = eventObject.message;

                    analyticsObject.duration = calculateDuration(initTime, timestamp);
                    analyticsObject.videoTimeEnd = calculateTime(eventObject.currentTime);
                    analyticsObject.droppedFrames = getDroppedFrames(eventObject.droppedFrames);

                    debugReport();
                    sendRequest();

                    /*
                        delete error code property from analytics object
                    */
                    delete analyticsObject.errorCode;
                    delete analyticsObject.errorMessage;

                    clearValues();
                    break;


                case this.events.PLAYBACK_FINISHED:

                    firstSample = true;
                    playbackFinished = true;
                    analyticsObject.duration = calculateDuration(initTime, timestamp);
                    analyticsObject.videoTimeEnd = calculateTime(eventObject.duration);
                    analyticsObject.droppedFrames = getDroppedFrames(eventObject.droppedFrames);

                    debugReport();
                    sendRequest();
                    break;


                case this.events.START_CAST:

                    analyticsObject.isCasting = true;
                    break;


                case this.events.END_CAST:

                    analyticsObject.isCasting = false;
                    break;


                case this.events.SCREEN_RESIZE:

                    /*
                        send new sample if window size is changing
                    */
                    analyticsObject.droppedFrames = getDroppedFrames(eventObject.droppedFrames);

                    debugReport();
                    sendRequest();

                    analyticsObject.videoWindowWidth = document.getElementById(containerId).offsetWidth;
                    analyticsObject.videoWindowHeight = document.getElementById(containerId).offsetHeight;

                    clearValues();
                    break;


                default:
                    break;
            }
        }
        else {

            if (once) {
                once = false;
                console.log("No right API key provided - Connection refused");
            }
        }
    }
}