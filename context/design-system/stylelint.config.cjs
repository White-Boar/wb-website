module.exports = {
  extends: ["stylelint-config-standard", "stylelint-config-prettier"],
  rules: {
    indentation: 2,
    "max-nesting-depth": 3,
    "selector-max-specificity": "0,2,0",
    "color-hex-length": "long",
    "declaration-no-important": true
  }
};
