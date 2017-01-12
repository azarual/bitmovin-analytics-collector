/**
 * Created by lkroepfl on 12.01.17.
 */

var AnalyticsStateMachineFactory = function() {
  var playerDetector = new PlayerDetector();

  var getAnalyticsStateMachine = function(player, logger, bitanalytics) {
    if (playerDetector.isBitmovinVersionPre7(player)) {
      return new BitmovinAnalyticsStateMachine(logger, bitanalytics);
    } else if (playerDetector.isBitmovinVersion7Plus(player)) {
      return new Bitmovin7AnalyticsStateMachine(logger, bitanalytics);
    }
  };

  return {
    getAnalyticsStateMachine: getAnalyticsStateMachine
  };
};
