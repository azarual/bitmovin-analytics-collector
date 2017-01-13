/**
 * Created by lkroepfl on 12.01.17.
 */

import PlayerDetector from '../utils/PlayerDetector'
import BitmovinAdapter from '../adapters/BitmovinAdapter'
import Bitmovin7Adapter from '../adapters/Bitmovin7Adapter'

class AdapterFactory {
  static playerDetector = new PlayerDetector;

  getAdapter(player, eventCallback) {
    if (this.playerDetector.isBitmovinVersionPre7(player)) {
      return new BitmovinAdapter(player, eventCallback);
    } else if (this.playerDetector.isBitmovinVersion7Plus(player)) {
      return new Bitmovin7Adapter(player, eventCallback);
    }
  };
}

export default AdapterFactory