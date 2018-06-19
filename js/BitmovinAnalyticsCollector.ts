require('string.prototype.endswith');

import {AnalyticsEngine, AnalyticsEngineConfiguration} from './core/AnalyticsEngine';

import {Player} from './enums/Players';

import {CDNProvider} from './enums/CDNProviders';

let analyticsEngine: AnalyticsEngine | null = null;

export class BitmovinAnalyticsCollectorAPIFacade {

  static get Players() { return Player }
  static get CdnProviders() { return CDNProvider }

  constructor(config: AnalyticsEngineConfiguration) {
    if (analyticsEngine) {
      //throw new Error('Bitmovin AnalyticsEngine already exisits');
      return;
    }
    analyticsEngine = new AnalyticsEngine(config);
  }

  register(player: any, opts = {}) {
    if (analyticsEngine === null) {
      throw new Error('Bitmovin AnalyticsEngine is not initialized');
    }
    analyticsEngine && analyticsEngine.register(player, opts);
  };

  getCurrentImpressionId() {
    if (analyticsEngine === null) {
      throw new Error('Bitmovin AnalyticsEngine is not initialized');
    }
    return analyticsEngine.getCurrentImpressionId();
  };

  setCustomData(values: any) {
    if (analyticsEngine === null) {
      throw new Error('Bitmovin AnalyticsEngine is not initialized');
    }
    return analyticsEngine.setCustomData(values);
  }

  setCustomDataOnce(values: any) {
    if (analyticsEngine === null) {
      throw new Error('Bitmovin AnalyticsEngine is not initialized');
    }
    return analyticsEngine.setCustomDataOnce(values);
  }
}

// FIXME/TODO: this should be done in webpack
/*
window.bitmovin = window.bitmovin || {};
window.bitmovin.analytics = analyticsWrapper;
*/

declare var bitmovin: any;

bitmovin = bitmovin || {};
bitmovin.analytics = BitmovinAnalyticsCollectorAPIFacade;
