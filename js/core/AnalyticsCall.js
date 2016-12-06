/**
 * Created by lkroepfl on 11.11.16.
 */

function AnalyticsCall() {
  var analyticsServerUrl = '//bitmovin-bitanalytics.appspot.com/analytics';

  this.sendRequest = function(sample, callback) {
    sendSampleRequest(true, sample, callback);
  };

  this.sendRequestSynchronous = function(sample, callback) {
    sendSampleRequest(false, sample, callback);
  };

  this.getAnalyticsServerUrl = function() {
    return analyticsServerUrl;
  };

  function sendSampleRequest(async, sample, callback) {
    var xhttp;
    var legacyMode = false;
    if (window.XDomainRequest) { legacyMode = true; }

    if (legacyMode) {
      xhttp = new window.XDomainRequest();
    } else {
      xhttp = new XMLHttpRequest();
    }
    var responseCallback = function() {
      if (xhttp.readyState == XMLHttpRequest.DONE) {
        if (xhttp.responseText <= 0) {
          return;
        }

        var sampleResponse = JSON.parse(xhttp.responseText);

        callback(sampleResponse);
      }
    };

    if (legacyMode) {
      xhttp.onload = responseCallback;
    } else {
      xhttp.onreadystatechange = responseCallback;
    }


    xhttp.open('POST', analyticsServerUrl, async);
    if (!legacyMode) {
      xhttp.setRequestHeader('Content-Type', 'application/json');
    }
    xhttp.send(JSON.stringify(sample));
  }
}
