/**
 * Created by Bitmovin on 13.09.2016.
 */

function analyze(player) {

    var analyticsObject = {
        key:    "",
        domain: "",
        userId: "",
        language:   "",
        impressionId:   "",
        playerTech:     "",
        userAgent:      ""
    };

    player.addEventHandler(bitdash.EVENT.ON_PLAY, function(event) {
        console.log("Video is playing");
    });

    //TODO


}

function sendRequest(object) {

    var xhttp;
    if (window.XMLHttpRequest) {
        xhttp = new XMLHttpRequest();
    } else {
        // code for IE6, IE5
        xhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xhttp.open("POST", "url", true);
    //xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(object);
}