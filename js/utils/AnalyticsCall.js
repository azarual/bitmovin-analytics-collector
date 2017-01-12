/**
 * Created by lkroepfl on 11.11.16.
 */

class AnalyticsCall {
  static analyticsServerUrl = '//bitmovin-bitanalytics.appspot.com/analytics';

  sendRequest = function(sample, callback) {
    this.sendSampleRequest(true, sample, callback);
  };

  sendRequestSynchronous = function(sample, callback) {
    this.sendSampleRequest(false, sample, callback);
  };

  getAnalyticsServerUrl = function() {
    return this.analyticsServerUrl;
  };

  sendSampleRequest(async, sample, callback) {
    let xhttp;
    let legacyMode = false;

    if (window.XDomainRequest) {
      legacyMode = true;
    }

    if (legacyMode) {
      xhttp = new window.XDomainRequest();
    } else {
      xhttp = new XMLHttpRequest();
    }

    const responseCallback = function() {
      if (xhttp.readyState == XMLHttpRequest.DONE) {
        if (xhttp.responseText <= 0) {
          return;
        }

        const sampleResponse = JSON.parse(xhttp.responseText);

        callback(sampleResponse);
      }
    };

    if (legacyMode) {
      xhttp.onload = responseCallback;
    } else {
      xhttp.onreadystatechange = responseCallback;
    }


    xhttp.open('POST', this.analyticsServerUrl, async);
    if (!legacyMode) {
      xhttp.setRequestHeader('Content-Type', 'application/json');
    }
    xhttp.send(JSON.stringify(sample));
  }
}

export default AnalyticsCall
