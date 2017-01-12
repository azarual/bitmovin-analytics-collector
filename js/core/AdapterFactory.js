/**
 * Created by lkroepfl on 12.01.17.
 */

var AdapterFactory = function() {
  var playerDetector = new PlayerDetector();

  var getAdapter = function(player) {
    if (playerDetector.isBitmovinVersionPre7(player)) {
      return new BitmovinAdapter(player);
    } else if (playerDetector.isBitmovinVersion7Plus(player)) {
      return new Bitmovin7Adapter(player);
    }
  };

  return {
    getAdapter: getAdapter
  };
};
