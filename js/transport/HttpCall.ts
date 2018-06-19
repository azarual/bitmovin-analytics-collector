declare var XDomainRequest: any;

export type HttpCallAsyncReturn = (response: any) => void;

export class HttpCall {
  constructor(
    public url: string,
    public callback: HttpCallAsyncReturn,
    public payload: any = null,
    public async: boolean = true
  ) {}

  post() {
    const {url, callback, async, payload} = this;

    let xhttp: XMLHttpRequest;
    let legacyMode = false;

    if (typeof XDomainRequest === 'function') {
      legacyMode = true;
    }

    if (legacyMode) {
      xhttp = new XDomainRequest();
    } else {
      xhttp = new XMLHttpRequest();
    }

    const responseCallback = function() {
      if (xhttp.readyState == XMLHttpRequest.DONE) {
        if (!xhttp.responseText) {
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
    xhttp.send(JSON.stringify(payload));
  }
}

