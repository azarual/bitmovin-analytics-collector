/**
 * Created by lkroepfl on 13.01.17.
 */

class HttpCall {
  post(url, body, callback, async = true) {
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

    xhttp.open('POST', url, async);
    if (!legacyMode) {
      xhttp.setRequestHeader('Content-Type', 'text/plain');
    }
    xhttp.send(JSON.stringify(body));
  }
}

export default HttpCall
