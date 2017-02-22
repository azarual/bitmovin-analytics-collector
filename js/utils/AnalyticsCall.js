/**
 * Created by lkroepfl on 11.11.16.
 */
import HttpCall from './HttpCall';
import {ANALYTICS_BACKEND_BASE_URL} from './Settings';

class AnalyticsCall extends HttpCall{
  static analyticsServerUrl = ANALYTICS_BACKEND_BASE_URL + '/analytics';

  sendRequest = function(sample, callback) {
    this.post(AnalyticsCall.analyticsServerUrl, sample, callback);
  };

  sendRequestSynchronous = function(sample, callback) {
    this.post(AnalyticsCall.analyticsServerUrl, sample, callback, false);
  };

  getAnalyticsServerUrl = function() {
    return AnalyticsCall.analyticsServerUrl;
  }
}

export default AnalyticsCall
