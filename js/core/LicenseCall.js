/**
 * Created by lkroepfl on 11.11.16.
 */

function LicenseCall() {
  var licenseServerUrl = 'https://bitmovin-bitanalytics.appspot.com/licensing';

  this.sendRequest = function(key, domain, version, callback) {
    var licensingRequest = {
      key: key,
      domain: domain,
      version: version
    };

    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == XMLHttpRequest.DONE) {
        var licensingResponse = JSON.parse(xhttp.responseText);
        callback(licensingResponse);
      }
    };

    xhttp.open('POST', licenseServerUrl, true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.send(JSON.stringify(licensingRequest));
  };
}
