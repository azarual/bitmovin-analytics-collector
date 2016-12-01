/**
 * Created by lkroepfl on 01.12.16.
 */

function Logger() {
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
}
