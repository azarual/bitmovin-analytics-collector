import {HttpCall, HttpCallAsyncReturn} from './HttpCall';

import {ANALYTICS_BACKEND_BASE_URL} from '../Settings';

const licenseServerUrl = ANALYTICS_BACKEND_BASE_URL + '/licensing';

export class LicenseCall extends HttpCall {

  constructor(key: string, domain: string, analyticsVersion: string, callback: HttpCallAsyncReturn) {

    const licensingRequest = {
      key,
      domain,
      analyticsVersion
    };

    super(licenseServerUrl, callback, licensingRequest);
  }

  static sendRequest(key: string, domain: string, analyticsVersion: string, callback: HttpCallAsyncReturn) {
    new LicenseCall(key, domain, analyticsVersion, callback).post();
  }
}
