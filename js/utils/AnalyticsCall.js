/**
 * Created by lkroepfl on 11.11.16.
 */
import HttpCall from './HttpCall'

class AnalyticsCall extends HttpCall{
  static analyticsServerUrl = '//bitmovin-bitanalytics.appspot.com/analytics';

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
