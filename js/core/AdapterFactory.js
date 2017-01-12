/**
 * Created by lkroepfl on 12.01.17.
 */

import PlayerDetector from '../utils/PlayerDetector'

class AdapterFactory {
  static playerDetector = new PlayerDetector;

  getAdapter = function(player) {
    if (this.playerDetector.isBitmovinVersionPre7(player)) {
      return new BitmovinAdapter(player);
    } else if (this.playerDetector.isBitmovinVersion7Plus(player)) {
      return new Bitmovin7Adapter(player);
    }
  };
}

export default AdapterFactory