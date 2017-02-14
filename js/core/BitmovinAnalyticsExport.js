/**
 * Created by lkroepfl on 13.09.2016.
 */

import Analytics from './Analytics'
import Players from '../enums/Players'
import CdnProviders from '../enums/CDNProviders'

let analytics;

const register = (player) => {
  analytics.register(player);
};

const getCurrentImpressionId = () => {
  return analytics.getCurrentImpressionId();
};

const analyticsWrapper = (config) => {
  analytics = new Analytics(config);
  return {
    register: register,
    getCurrentImpressionId: getCurrentImpressionId
  }
};

let bitmovin = window.bitmovin;
bitmovin = bitmovin || {};

bitmovin.analytics = analyticsWrapper;
bitmovin.analytics.Players = Players;
bitmovin.analytics.CdnProviders = CdnProviders;