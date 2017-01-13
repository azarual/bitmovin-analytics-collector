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
    register: register,
    CdnProviders: Analytics.CdnProviders,
    Events: Analytics.Events,
    Players: Analytics.Players
  }
};

let bitmovin = window.bitmovin;
bitmovin = bitmovin || {};

bitmovin.analytics = analyticsWrapper;