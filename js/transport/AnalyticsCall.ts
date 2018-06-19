import {HttpCall, HttpCallAsyncReturn} from './HttpCall';

import {ANALYTICS_BACKEND_BASE_URL} from '../Settings';

import {AnalyticsSample} from '../core/AnalyticsEngine';

const analyticsServerUrl = ANALYTICS_BACKEND_BASE_URL + '/analytics';

export class AnalyticsCall extends HttpCall {

  constructor(sample: AnalyticsSample, callback: HttpCallAsyncReturn, synchroneous: boolean = false) {
    super(analyticsServerUrl, callback, sample, !synchroneous);
  }

  static get AnalyticsServerUrl() {
    return analyticsServerUrl
  }

  static sendRequest(sample: AnalyticsSample, callback: HttpCallAsyncReturn, synchroneous: boolean = false) {
    new AnalyticsCall(sample, callback, synchroneous).post();
  }
}
