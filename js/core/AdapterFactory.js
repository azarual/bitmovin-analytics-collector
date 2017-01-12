/**
 * Created by lkroepfl on 12.01.17.
 */

var AdapterFactory = function() {
  var getAdapter = function(player) {
    return new Bitmovin7Adapter(player);
  };

  return {
    getAdapter: getAdapter
  };
};
