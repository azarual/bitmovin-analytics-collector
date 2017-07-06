/**
 * Created by lkroepfl on 12.01.17.
 */

import PlayerDetector from '../utils/PlayerDetector'
import BitmovinAdapter from '../adapters/BitmovinAdapter'
import Bitmovin7Adapter from '../adapters/Bitmovin7Adapter'
import VideoJsAdapter from '../adapters/VideoJsAdapter'

class AdapterFactory {
  constructor() {
    this.playerDetector = new PlayerDetector;
  }

  getAdapter(player, eventCallback, eventMachine) {
    if (this.playerDetector.isBitmovinVersionPre7(player)) {
      return new BitmovinAdapter(player, eventCallback);
    } else if (this.playerDetector.isBitmovinVersion7Plus(player)) {
      return new Bitmovin7Adapter(player, eventCallback);
    } else if (this.playerDetector.isVideoJs(player)) {
      return new VideoJsAdapter(player, eventCallback, eventMachine);
    }
  };
}

export default AdapterFactory
