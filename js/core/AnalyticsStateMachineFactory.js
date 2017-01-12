/**
 * Created by lkroepfl on 12.01.17.
 */

import PlayerDetector from '../utils/PlayerDetector'

class AnalyticsStateMachineFactory {
  static playerDetector = new PlayerDetector;

  getAnalyticsStateMachine = function(player, logger, bitanalytics) {
    if (this.playerDetector.isBitmovinVersionPre7(player)) {
      return new BitmovinAnalyticsStateMachine(logger, bitanalytics);
    } else if (this.playerDetector.isBitmovinVersion7Plus(player)) {
      return new Bitmovin7AnalyticsStateMachine(logger, bitanalytics);
    }
  };
}

export default AnalyticsStateMachineFactory
