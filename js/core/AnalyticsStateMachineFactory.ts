import PlayerDetector from '../utils/PlayerDetector';

import {BitmovinAnalyticsStateMachine} from '../analytics-state-machine/BitmovinAnalyticsStateMachine';
import {Bitmovin7AnalyticsStateMachine} from '../analytics-state-machine/Bitmovin7AnalyticsStateMachine';
import {VideojsAnalyticsStateMachine} from '../analytics-state-machine/VideoJsAnalyticsStateMachine';
import {HTML5AnalyticsStateMachine} from '../analytics-state-machine/HTML5AnalyticsStateMachine';

import { AnalyticsStateMachine, AnalyticsStateMachineCallbacks, AnalyticsStateMachineOptions } from './AnalyticsStateMachine';

/**
 * Stateless. Auto-maps given player instance to new state-machine instances.
 * @class
 */
class AnalyticsStateMachineFactory {
  /**
   * @param {object} player
   * @param {AnalyticsStateMachineCallbacks} stateMachineCallbacks
   * @param {AnalyticsStateMachineOptions} opts
   */
  static createAnalyticsStateMachine(
    player: any,
    stateMachineCallbacks: AnalyticsStateMachineCallbacks,
    opts: AnalyticsStateMachineOptions): AnalyticsStateMachine {

    let stateMachine;

    if (PlayerDetector.isBitmovinVersionPre7(player)) {

      stateMachine = new BitmovinAnalyticsStateMachine(stateMachineCallbacks, opts);

    } else if (PlayerDetector.isBitmovinVersion7Plus(player)) {

      stateMachine = new Bitmovin7AnalyticsStateMachine(stateMachineCallbacks, opts);

    } else if (PlayerDetector.isVideoJs(player)) {

      stateMachine = new VideojsAnalyticsStateMachine(stateMachineCallbacks, opts);

    } else if (

      PlayerDetector.isHlsjs(player) ||
      PlayerDetector.isDashjs(player) ||
      PlayerDetector.isShaka(player)) {

      stateMachine = new HTML5AnalyticsStateMachine(stateMachineCallbacks, opts);

    } else {

      throw new Error('Could not detect player type');

    }

    return <AnalyticsStateMachine> stateMachine;
  }
}

export default AnalyticsStateMachineFactory;
