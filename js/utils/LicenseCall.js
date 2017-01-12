/**
 * Created by lkroepfl on 11.11.16.
 */

class LicenseCall {
  static licenseServerUrl = '//bitmovin-bitanalytics.appspot.com/licensing';

  sendRequest = function(key, domain, version, callback) {
    const licensingRequest = {
      key: key,
      domain: domain,
      analyticsVersion: version
    };

    this.sendLicensingRequest(true, licensingRequest, callback);
  };

  sendLicensingRequest(async, licensingSample, callback) {
    let xhttp;
    let legacyMode = false;

    if (window.XDomainRequest) { legacyMode = true; }

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


    xhttp.open('POST', this.licenseServerUrl, async);
    if (!legacyMode) {
      xhttp.setRequestHeader('Content-Type', 'application/json');
    }
    xhttp.send(JSON.stringify(licensingSample));
  }
}

export default LicenseCall
