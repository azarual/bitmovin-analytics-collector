/**
 * Created by lkroepfl on 01.12.16.
 */

var Logger = function() {
  var showLogs = false;

  this.setLogging = function(logging) {
    showLogs = logging;
  };

  this.log = function(msg) {
    if (!showLogs) {
      return;
    }

    console.log(msg);
  };

  this.error = function(msg) {
    if (!showLogs) {
      return;
    }

    console.error(msg);
  };
};
