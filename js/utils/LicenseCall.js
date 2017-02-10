/**
 * Created by lkroepfl on 11.11.16.
 */
import HttpCall from './HttpCall'

class LicenseCall extends HttpCall {
  static licenseServerUrl = '//analytics-ingress.bitmovin.com/licensing';

  sendRequest = function(key, domain, version, callback) {
    const licensingRequest = {
      key: key,
      domain: domain,
      analyticsVersion: version
    };

    this.post(LicenseCall.licenseServerUrl, licensingRequest, callback);
  };
}

export default LicenseCall
