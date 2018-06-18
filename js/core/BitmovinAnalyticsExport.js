require('string.prototype.endswith');

import Analytics from './Analytics';
import {Players} from '../enums/Players';
import CdnProviders from '../enums/CDNProviders';

let analytics;

const register = (player, opts = {}) => {
  analytics.register(player, opts);
};

const getCurrentImpressionId = () => {
  return analytics.getCurrentImpressionId();
};

const analyticsWrapper = (config) => {
  analytics = new Analytics(config);
  return {
    register: register,
    getCurrentImpressionId: getCurrentImpressionId,
    setCustomData: analytics.setCustomData,
    setCustomDataOnce: analytics.setCustomDataOnce,
  };
};

analyticsWrapper.Players = Players;
analyticsWrapper.CdnProviders = CdnProviders;

window.bitmovin = window.bitmovin || {};
window.bitmovin.analytics = analyticsWrapper;

module.exports = analyticsWrapper;
