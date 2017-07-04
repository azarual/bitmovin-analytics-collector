/**
 * Created by lkroepfl on 12.01.17.
 */

class PlayerDetector {
  isBitmovinVersionPre7 = function(player) {
    if (typeof player.getVersion === 'function') {
      return player.getVersion() < '7';
    }

    return false;
  };

  isBitmovinVersion7Plus = function(player) {
    if (typeof player.version === 'string') {
      return player.version >= '7';
    }

    return false;
  };

  isVideoJs = function(player) {
    if (typeof videojs === 'function') {
      if (videojs(player.id_) === player) {
        return true;
      }
    }
    return false;
  }
}

export default PlayerDetector
