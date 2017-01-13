/**
 * Created by lkroepfl on 11.11.16.
 */
import HttpCall from './HttpCall'

class LicenseCall extends HttpCall {
  static licenseServerUrl = '//bitmovin-bitanalytics.appspot.com/licensing';

  sendRequest = function(key, domain, version, callback) {
    const licensingRequest = {
      key: key,
      domain: domain,
      analyticsVersion: version
    };

    this.post(this.licenseServerUrl, licensingRequest, callback);
  };
}

export default LicenseCall
