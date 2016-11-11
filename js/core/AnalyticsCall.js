/**
 * Created by lkroepfl on 11.11.16.
 */

function AnalyticsCall() {
  var analyticsServerUrl = 'https://bitmovin-bitanalytics.appspot.com/analytics';

  this.sendRequest = function(sample, callback) {
    sendSampleRequest(true, sample, callback);
  };

  this.sendRequestSynchronous = function(sample, callback) {
    sendSampleRequest(false, sample, callback);
  };

  function sendSampleRequest(async, sample, callback) {
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == XMLHttpRequest.DONE) {
        var sampleResponse = JSON.parse(xhttp.responseText);

        callback(sampleResponse);
      }
    };

    xhttp.open('POST', analyticsServerUrl, async);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.send(JSON.stringify(sample));
  }
}