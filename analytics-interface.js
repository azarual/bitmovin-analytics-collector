/**
 * Created by Bitmovin on 19.09.2016.
 */

class BitAnalytics {

    constructor(videoId) {

        this.initTime = 0;

        this.debug = false;
        this.containerId = videoId;

        this.firstSample = true;
        this.skipVideoPlaybackChange = true;
        this.skipAudioPlaybackChange = true;

        this.overall = 0;
        this.lastSampleDuration = 0;

        this.playing = 0;

        /*
            members to initialize individual start time depending on the events
        */
        this.initAdTime = 0;
        this.initPlayTime = 0;
        this.initSeekTime = 0;
        this.initPauseTime = 0;
        this.initBufferTime = 0;

        /*
            Bool'sche members to check playing, seeking, pausing and ending status
        */
        this.start = true;
        this.isSeeking = false;
        this.isPausing = false;
        this.playbackFinished = false;

        this.analyticsObject = {
            key:                "",                                             // READY
            domain:             window.location.hostname,                       // READY
            path:               window.location.pathname,                       // READY
            userId:             "",                                             // READY
            language:           navigator.language || navigator.userLanguage,   // READY
            impressionId:       "",                                             // READY
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
            customUserId:       "",                                             // READY
            size:               "WINDOW",                                       // READY
            videoWindowWidth:   0,                                              // READY
            videoWindowHeight:  0,                                              // READY
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

        this.events = {

            READY:                  "ready",
            SOURCE_LOADED:          "sourceLoaded",
            PLAY:                   "play",
            PAUSE:                  "pause",
            TIMECHANGED:            "timechange",
            SEEK:                   "seek",
            START_CAST:             "startCasting",
            END_CAST:               "endCasting",
            START_BUFFERING:        "startBuffering",
            END_BUFFERING:          "endBuffering",
            AUDIO_CHANGE:           "audioChange",
            VIDEO_CHANGE:           "videoChange",
            START_FULLSCREEN:       "startFullscreen",
            END_FULLSCREEN:         "endFullscreen",
            START_AD:               "adStart",
            END_AD:                 "adEnd",
            ERROR:                  "error",
            PLAYBACK_FINISHED:      "end"
        };
    }

    init(object) {

        if (object.key == "") {

            console.log("Invalid API key\nConnection refused.")
        }
        else {

            this.initTime = new Date().getTime();

            this.debug = object.debug;
            this.analyticsObject.key = object.key;

            /*
                initialize width and height of player container
            */
            this.analyticsObject.videoWindowWidth = document.getElementById(this.containerId).offsetWidth;
            this.analyticsObject.videoWindowHeight = document.getElementById(this.containerId).offsetHeight;
        }
    }

    record(event, eventObject) {

        switch(event) {

            case this.events.SOURCE_LOADED:     this.analyticsObject.impressionId = this.generateImpressionID;
                                                console.log(this.analyticsObject.impressionId);
                                                break;

            case this.events.READY:             this.analyticsObject.playerStartupTime = eventObject.timestamp - this.initTime;
                                                break;

            case this.events.PLAY:              /*
                                                    init playing time
                                                */
                                                this.initPlayTime = eventObject.timestamp;

                                                /*
                                                 generate new impression id if new playback
                                                 */
                                                if (this.playbackFinished) {

                                                    this.lastSampleDuration = 0;
                                                    this.playbackFinished = false;
                                                    this.initTime = eventObject.timestamp;
                                                    this.skipAudioPlaybackChange = true;
                                                    this.skipVideoPlaybackChange = true;
                                                    this.analyticsObject.videoTimeEnd = 0;
                                                    this.analyticsObject.videoTimeStart = 0;
                                                    this.analyticsObject.impressionId = this.generateImpressionID;
                                                }

                                                /*
                                                 call sample which was paused after resuming
                                                 */
                                                if (this.initPauseTime != 0) {

                                                    this.analyticsObject.paused = eventObject.timestamp - this.initPauseTime;
                                                    this.analyticsObject.duration = this.calculateDuration(this.initTime, eventObject.timestamp);

                                                    this.debugReport();
                                                    //sendRequest(analyticsObject);

                                                    this.clearValues(eventObject.timestamp);
                                                    this.isPausing = false;
                                                }
                                                break;

            case this.events.PAUSE:             this.analyticsObject.videoTimeEnd = this.calculateTime(eventObject.currentTime);
                                                this.analyticsObject.duration = this.calculateDuration(this.initTime, eventObject.timestamp);

                                                this.debugReport();
                                                //sendRequest(analyticsObject);

                                                this.clearValues(eventObject.timestamp);
                                                /*
                                                 init playing time
                                                 */
                                                this.initPauseTime = eventObject.timestamp;
                                                this.isPausing = true;
                                                break;

            case this.events.TIMECHANGED:       if (!this.playbackFinished) {

                                                    /*
                                                        if not pausing set or update played attribute
                                                    */
                                                    if (!this.isPausing && !this.isSeeking) {
                                                        this.playing = eventObject.timestamp - this.initPlayTime;
                                                        this.analyticsObject.played = Math.round(this.playing);
                                                        if (this.debug) {
                                                            console.log(this.playing);
                                                        }
                                                    }

                                                    /*
                                                        only relevant if first frame occurs
                                                    */
                                                    if (this.firstSample == true) {

                                                        this.firstSample = false;
                                                        this.analyticsObject.videoStartupTime = eventObject.timestamp - this.initPlayTime;
                                                        this.lastSampleDuration = eventObject.timestamp - this.initTime;
                                                        this.analyticsObject.duration = this.lastSampleDuration;
                                                        this.overall = this.analyticsObject.duration;

                                                        this.debugReport();
                                                        //sendRequest(analyticsObject);

                                                        this.clearValues(eventObject.timestamp);
                                                    }
                                                    else if (!this.firstSample && this.start == true) {
                                                        this.start = false;
                                                        this.analyticsObject.videoTimeStart = this.calculateTime(eventObject.currentTime);
                                                    }
                                                }
                                                break;

            case this.events.SEEK:              if (!this.isSeeking && !this.playbackFinished) {

                                                    /*
                                                         set init seek time
                                                         represents the beginning of seek progress
                                                    */
                                                    this.initSeekTime = eventObject.timestamp;

                                                    this.analyticsObject.videoTimeEnd = this.calculateTime(eventObject.currentTime);
                                                    this.analyticsObject.duration = this.calculateDuration(this.initTime, eventObject.timestamp);

                                                    this.debugReport();
                                                    //sendRequest(analyticsObject);

                                                    this.clearValues(eventObject.timestamp);

                                                    this.start = false;
                                                    this.isSeeking = true;
                                                    this.analyticsObject.videoTimeStart = this.calculateTime(eventObject.currentTime);
                                                }
                                                break;

            case this.events.START_BUFFERING:   this.initBufferTime = eventObject.timestamp;
                                                break;

            case this.events.END_BUFFERING:     /*
                                                    calculate time of whole seeking process
                                                */
                                                this.analyticsObject.buffered = eventObject.timestamp - this.initBufferTime;

                                                if (this.isSeeking) {

                                                    /* have to set played attribute to 0 due to some time changing between seek end and buffering */
                                                    this.analyticsObject.played = 0;

                                                    this.analyticsObject.seeked = eventObject.timestamp - this.initSeekTime;
                                                    this.analyticsObject.videoTimeEnd = this.calculateTime(eventObject.currentTime);
                                                    this.analyticsObject.duration = this.calculateDuration(this.initTime, eventObject.timestamp);

                                                    this.debugReport();
                                                    //sendRequest(analyticsObject);

                                                    this.clearValues(eventObject.timestamp);
                                                    this.isSeeking = false;
                                                }
                                                break;

            case this.events.AUDIO_CHANGE:      if (!this.skipAudioPlaybackChange && !this.isSeeking) {

                                                    /*
                                                        get the audio bitrate data for the new sample
                                                    */
                                                    this.analyticsObject.audioBitrate = eventObject.bitrate;
                                                    this.analyticsObject.videoTimeEnd = this.calculateTime(eventObject.currentTime);
                                                    this.analyticsObject.duration = this.calculateDuration(this.initTime, eventObject.timestamp);

                                                    this.debugReport();
                                                    //sendRequest(analyticsObject);

                                                    this.clearValues(eventObject.timestamp);
                                                }
                                                else {
                                                    /*
                                                     set audio playback data
                                                     for first frame and if audio playback data has not changed yet
                                                     */
                                                    this.analyticsObject.audioBitrate = eventObject.bitrate;
                                                    this.skipAudioPlaybackChange = false;
                                                    this.skipVideoPlaybackChange = false;
                                                }
                                                break;

            case this.events.VIDEO_CHANGE:      if (!this.skipVideoPlaybackChange && !this.isSeeking) {
                                                    /*
                                                     get the video playback data for the new sample
                                                     */
                                                    this.analyticsObject.videoPlaybackWidth = eventObject.width;
                                                    this.analyticsObject.videoPlaybackHeight = eventObject.height;
                                                    this.analyticsObject.videoBitrate = eventObject.bitrate;

                                                    this.analyticsObject.videoTimeEnd = this.calculateTime(eventObject.currentTime);
                                                    this.analyticsObject.duration = this.calculateDuration(this.initTime, eventObject.timestamp);

                                                    this.debugReport();
                                                    //sendRequest(analyticsObject);

                                                    this.clearValues(eventObject.timestamp);
                                                }
                                                else {
                                                    /*
                                                     set video playback data
                                                     for first frame and if video playback data has not changed yet
                                                     */
                                                    this.analyticsObject.videoPlaybackWidth = eventObject.width;
                                                    this.analyticsObject.videoPlaybackHeight = eventObject.height;
                                                    this.analyticsObject.videoBitrate = eventObject.bitrate;
                                                    this.skipVideoPlaybackChange = false;
                                                    this.skipAudioPlaybackChange = false;
                                                }
                                                break;

            case this.events.START_FULLSCREEN:  this.analyticsObject.duration = this.calculateDuration(this.initTime, eventObject.timestamp);
                                                this.analyticsObject.videoTimeEnd = this.calculateTime(eventObject.currentTime);

                                                this.debugReport();
                                                //sendRequest(analyticsObject);

                                                this.clearValues(eventObject.timestamp);
                                                this.analyticsObject.size = "FULLSCREEN";
                                                break;

            case this.events.END_FULLSCREEN:    this.analyticsObject.duration = this.calculateDuration(this.initTime, eventObject.timestamp);
                                                this.analyticsObject.videoTimeEnd = this.calculateTime(eventObject.currentTime);

                                                this.debugReport();
                                                //sendRequest(analyticsObject);

                                                this.clearValues(eventObject.timestamp);
                                                this.analyticsObject.size = "WINDOW";
                                                break;

            case this.events.START_AD:          this.initAdTime = new Date().getTime();
                                                this.clearValues(new Date().getTime());
                                                break;

            case this.events.END_AD:            this.analyticsObject.ad = new Date().getTime() - this.initAdTime;

                                                this.analyticsObject.played = 0;
                                                this.analyticsObject.duration = this.calculateDuration(this.initTime, new Date().getTime());
                                                this.analyticsObject.videoTimeEnd = this.calculateTime(eventObject.currentTime);

                                                this.debugReport();
                                                //sendRequest(analyticsObject);

                                                this.clearValues(new Date().getTime());
                                                break;

            case this.events.ERROR:             /*
                                                    add error code property from analytics object
                                                */
                                                this.analyticsObject.errorCode = eventObject.code;
                                                this.analyticsObject.errorMessage = eventObject.message;

                                                this.analyticsObject.duration = this.calculateDuration(this.initTime, eventObject.timestamp);
                                                this.analyticsObject.videoTimeEnd = this.calculateTime(eventObject.currentTime);

                                                this.debugReport();
                                                //sendRequest(analyticsObject);

                                                /*
                                                    delete error code property from analytics object
                                                */
                                                delete this.analyticsObject.errorCode;
                                                delete this.analyticsObject.errorMessage;

                                                this.clearValues(new Date().getTime());
                                                break;

            case this.events.PLAYBACK_FINISHED: this.firstSample = true;
                                                this.playbackFinished = true;
                                                this.analyticsObject.duration = this.calculateDuration(this.initTime, eventObject.timestamp);
                                                this.analyticsObject.videoTimeEnd = this.calculateTime(eventObject.duration);

                                                this.debugReport();
                                                //sendRequest(analyticsObject);
                                                break;

            case this.events.START_CAST:        this.analyticsObject.isCasting = true;
                                                break;

            case this.events.END_CAST:          this.analyticsObject.isCasting = false;
                                                break;

        }
    }

    debugReport() {
        if (this.debug) {
            console.log("Sending: " + JSON.stringify(this.analyticsObject));
            console.log("duration: " + this.lastSampleDuration);
        }
    }

    calculateTime(time) {
        time = time * 1000;
        return Math.round(time);
    }

    calculateDuration(initTime, timestamp) {

        this.lastSampleDuration = timestamp - initTime - this.overall;
        this.overall += this.lastSampleDuration;
        return this.lastSampleDuration;
    }

    get generateImpressionID() {

        var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {

            var r = Math.random()*16|0;
            var v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
        return id;
    }

    clearValues(timestamp) {

        this.start = true;
        this.initPauseTime = 0;
        this.isPausing = false;
        this.initPlayTime = timestamp;

        this.analyticsObject.ad = 0;
        this.analyticsObject.paused = 0;
        this.analyticsObject.played = 0;
        this.analyticsObject.seeked = 0;
        this.analyticsObject.buffered = 0;
    }
}