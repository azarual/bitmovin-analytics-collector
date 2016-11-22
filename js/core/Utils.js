/**
 * Created by lkroepfl on 11.11.16.
 */

function Utils() {
  this.validString = function(string) {
    return (string != undefined && typeof string == 'string');
  };

  this.validBoolean = function(boolean) {
    return (boolean != undefined && typeof boolean == 'boolean');
  };

  this.validNumber = function(number) {
    return (number != undefined && typeof number == 'number');
  };

  this.sanitizePath = function(path) {
    return path.replace(/\/$/g, '');
  };

  this.calculateTime = function(time) {
    time = time * 1000;
    return Math.round(time);
  };

  this.getCurrentTimestamp = function() {
    return new Date().getTime();
  };

  this.generateUUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  this.getCookie = function(cname) {
    var name = cname + '=';
    var ca   = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }

    return'';
  };

  this.noOp = function() {

  };

  this.times = function (fn, times) {
    var that = this;
    var count = 0;
    var retVal;
    return function () {
      if (count >= times) {
        return retVal;
      }
      retVal = fn.apply(that, arguments);
      count++;
      return retVal;
    };
  };

  this.once = function (fn) {
    return this.times(fn, 1);
  };
}
