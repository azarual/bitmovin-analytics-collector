/**
 * Created by lkroepfl on 11.11.16.
 */

class Utils {
  validString = function(string) {
    return (string != undefined && typeof string == 'string');
  };

  validBoolean = function(boolean) {
    return (boolean != undefined && typeof boolean == 'boolean');
  };

  validNumber = function(number) {
    return (number != undefined && typeof number == 'number');
  };

  sanitizePath = function(path) {
    return path.replace(/\/$/g, '');
  };

  calculateTime = function(time) {
    time = time * 1000;
    return Math.round(time);
  };

  getCurrentTimestamp = function() {
    return new Date().getTime();
  };

  getDurationFromTimestampToNow = function(timestamp) {
    return this.getCurrentTimestamp() - timestamp;
  };

  generateUUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  getCookie = function(cname) {
    const name = cname + '=';
    const ca   = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }

    return'';
  };

  noOp = function() {

  };

  times = function (fn, times) {
    const that = this;
    let count = 0;
    let retVal;
    return function () {
      if (count >= times) {
        return retVal;
      }
      retVal = fn.apply(that, arguments);
      count++;
      return retVal;
    };
  };

  once = function (fn) {
    return times(fn, 1);
  };

  getHiddenProp = function() {
    const prefixes = ['webkit','moz','ms','o'];
    if ('hidden' in document) { return 'hidden'; }
    for (let i = 0; i < prefixes.length; i++){
      if ((prefixes[i] + 'Hidden') in document) {
        return prefixes[i] + 'Hidden';
      }
    }
    return null;
  };

  getCustomDataString = function(customData) {
    if (typeof customData === 'object') {
      return JSON.stringify(customData);
    } else if (typeof customData === 'function') {
      return getCustomDataString(customData());
    } else if (typeof customData === 'undefined') {
      return customData;
    } else if (typeof customData !== 'string') {
      return String(customData);
    }

    return customData;
  };
}

export default Utils
