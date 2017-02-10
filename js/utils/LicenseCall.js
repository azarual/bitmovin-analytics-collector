/**
 * Created by lkroepfl on 11.11.16.
 */
import HttpCall from './HttpCall';
import {ANALYTICS_BACKEND_BASE_URL} from './Settings';

class LicenseCall extends HttpCall {
  static licenseServerUrl = ANALYTICS_BACKEND_BASE_URL + '/licensing';

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
