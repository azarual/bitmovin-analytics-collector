/**
 * Created by lkroepfl on 11.11.16.
 */

function LicenseCall() {
  var licenseServerUrl = '//bitmovin-bitanalytics.appspot.com/licensing';

  this.sendRequest = function(key, domain, version, callback) {
    var licensingRequest = {
      key: key,
      domain: domain,
      analyticsVersion: version
    };

    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == XMLHttpRequest.DONE) {
        if (xhttp.responseText.length <= 0) {
          return;
        }

        var licensingResponse = JSON.parse(xhttp.responseText);
        callback(licensingResponse);
      }
    };

    xhttp.open('POST', licenseServerUrl, true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.send(JSON.stringify(licensingRequest));
  };
  if (window.XDomainRequest) {
    this.sendRequest = function (key, domain, version, callback) {

      var licensingRequest = {
        key: key,
        domain: domain,
        analyticsVersion: version
      };

      var xdr = new XDomainRequest();
      xdr.onload = function () {
        if (xdr.responseText.length <= 0) {
          return;
        }

        var licensingResponse = JSON.parse(xdr.responseText);
        callback(licensingResponse);
      };

      xdr.open('POST', licenseServerUrl, true);
      xdr.send(JSON.stringify(licensingRequest));
    };
  }
}
