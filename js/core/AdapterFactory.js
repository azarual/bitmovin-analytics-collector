/**
 * Created by lkroepfl on 12.01.17.
 */

var AdapterFactory = function() {
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

  var getAdapter = function(player) {
    if (isBitmovinVersionPre7(player)) {
      return new BitmovinAdapter(player);
    } else if (isBitmovinVersion7Plus(player)) {
      return new Bitmovin7Adapter(player);
    }
  };

  return {
    getAdapter: getAdapter
  };
};
