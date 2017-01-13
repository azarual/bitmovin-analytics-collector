/**
 * Created by lkroepfl on 11.11.16.
 */
import HttpCall from './HttpCall'

class AnalyticsCall extends HttpCall{
  static analyticsServerUrl = '//bitmovin-bitanalytics.appspot.com/analytics';

  sendRequest = function(sample, callback) {
    this.post(this.analyticsServerUrl, sample, callback);
  };

  sendRequestSynchronous = function(sample, callback) {
    this.post(this.analyticsServerUrl, sample, callback, false);
  };

  getAnalyticsServerUrl = function() {
    return this.analyticsServerUrl;
  }
}

export default AnalyticsCall
