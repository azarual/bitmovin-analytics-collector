/**
 * Created by lkroepfl on 13.09.2016.
 */

import Analytics from './Analytics'

let analytics;

const register = (player) => {
  analytics.register(player);
};

const analyticsWrapper = (config) => {
  analytics = new Analytics(config);
  return {
    register: register
  }
};

let bitmovin = window.bitmovin;
bitmovin = bitmovin || {};

bitmovin.analytics = analyticsWrapper;
bitmovin.analytics.Players = Analytics.Players;
bitmovin.analytics.CdnProviders = Analytics.CdnProviders;