/**
 * Created by lkroepfl on 01.12.16.
 */

class Logger {
  constructor(showLogs = false) {
    this.showLogs = showLogs;
  }

  setLogging(logging) {
    this.showLogs = logging;
  };

  isLogging() {
    return this.showLogs;
  }

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

  warning = function(msg) {
    if (!this.showLogs) {
      return;
    }

    console.warn(msg);
  }
}

const logger = new Logger();
export default logger;
