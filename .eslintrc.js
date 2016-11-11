module.exports = {
  "env"    : {
    "browser": true,
    "jquery" : true
  },
  "extends": "eslint:recommended",
  "rules"  : {
    "semi"              : [2, "always"],
    "quotes"            : [2, "single"],
    "curly"             : 2,
    "no-undef"          : 0,
    "no-console"        : 0,
    "no-unused-vars"    : 0,
    "indent"            : [2, 2, {"SwitchCase": 1}],
    "one-var"           : [2, "never"],
    "no-inline-comments": 2,
    "eol-last"          : 2,
    "no-fallthrough"    : 0,
    "no-debugger"       : 0
  }
};
