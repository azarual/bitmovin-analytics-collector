/**
 * Created by lkroepfl on 01.12.16.
 */

class Logger {
  static showLogs = false;

  setLogging = function(logging) {
    this.showLogs = logging;
  };

  log = function(msg) {
    if (!this.showLogs) {
      return;
    }

    console.log(msg);
  };

  error = function(msg) {
    if (!this.showLogs) {
      return;
    }

    console.error(msg);
  };
}

export default Logger
