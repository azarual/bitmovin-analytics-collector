/**
 * Created by Bitmovin on 19.09.2016.
 */

var debug;
var analyticsObject = {

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

function init(object) {

    debug = object.debug;
    analyticsObject.key = object.key;

    console.log(JSON.stringify(analyticsObject));
}