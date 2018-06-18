module.exports = {
  "env"    : {
    "browser": true,
    "jquery" : true,
    "commonjs": true,
    "es6": true
  },
  "parser": "typescript-eslint-parser",
  "plugins": [
    "typescript",
    "html"
  ],
  "extends": "eslint:recommended",
  "rules"  : {
    // custom error config
    "indent"            : [2, 2, {"SwitchCase": 1}],
    "one-var"           : [2, "never"],
    "no-debugger"       : 2,
    "semi"              : [2, "always"],
    "quotes"            : [2, "single"],
    "curly"             : 2,
    "no-undef"          : 2,
    "no-inline-comments": 2,
    "eol-last"          : 2,
    // custom warning config
    "no-console"        : 1,
    "no-unused-vars"    : 1,
    "no-fallthrough"    : 1,
  },
  "globals": {
    VERSION: true
  }
};
