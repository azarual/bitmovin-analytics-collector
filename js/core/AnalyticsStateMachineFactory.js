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

  getAnalyticsStateMachine(player, stateMachineCallbacks) {
    if (this.playerDetector.isBitmovinVersionPre7(player)) {
      return new BitmovinAnalyticsStateMachine(stateMachineCallbacks);
    } else if (this.playerDetector.isBitmovinVersion7Plus(player)) {
      return new Bitmovin7AnalyticsStateMachine(stateMachineCallbacks);
    }
  };
}

export default AnalyticsStateMachineFactory
