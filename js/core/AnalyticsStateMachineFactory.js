/**
 * Created by lkroepfl on 12.01.17.
 */

import PlayerDetector from '../utils/PlayerDetector'
import BitmovinAnalyticsStateMachine from '../analyticsStateMachines/BitmovinAnalyticsStateMachine'
import Bitmovin7AnalyticsStateMachine from '../analyticsStateMachines/Bitmovin7AnalyticsStateMachine'

class AnalyticsStateMachineFactory {
  constructor() {
    this.playerDetector = new PlayerDetector;
  }

  getAnalyticsStateMachine(player, stateMachineCallbacks, isLogging) {
    if (this.playerDetector.isBitmovinVersionPre7(player)) {
      return new BitmovinAnalyticsStateMachine(stateMachineCallbacks, isLogging);
    } else if (this.playerDetector.isBitmovinVersion7Plus(player)) {
      return new Bitmovin7AnalyticsStateMachine(stateMachineCallbacks, isLogging);
    }
  };
}

export default AnalyticsStateMachineFactory
