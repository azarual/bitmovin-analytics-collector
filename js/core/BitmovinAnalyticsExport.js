/**
 * Created by lkroepfl on 13.09.2016.
 */

import Analytics from './Analytics'

let analytics;

const init = (config) => {
  analytics = new Analytics(config);
};

const register = (player) => {
  analytics.register(player);
};

const analyticsWrapper = (config) => {
  init(config);
  return {
    register: register
  }
};

let bitmovin = window.bitmovin;
bitmovin = bitmovin || {};

bitmovin.analytics = analyticsWrapper;