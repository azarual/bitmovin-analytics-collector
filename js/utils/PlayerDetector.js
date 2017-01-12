/**
 * Created by lkroepfl on 12.01.17.
 */

var PlayerDetector = function() {
  var isBitmovinVersionPre7 = function(player) {
    if (typeof player.getVersion === 'function') {
      return player.getVersion() < '7';
    }

    return false;
  };

  var isBitmovinVersion7Plus = function(player) {
    if (typeof player.version === 'string') {
      return player.version >= '7';
    }

    return false;
  };

  return {
    isBitmovinVersionPre7: isBitmovinVersionPre7,
    isBitmovinVersion7Plus: isBitmovinVersion7Plus
  };
};
