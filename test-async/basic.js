// Generated by CoffeeScript 1.6.3
var code_eq, p, _ref;

_ref = require('./helper'), p = _ref.p, code_eq = _ref.code_eq;

describe('basic', function() {
  it('simple', function() {
    return code_eq("x!", "var _this = this;\nx(function(v){return v})");
  });
  it('with returns', function() {
    return code_eq("y = x!", "var y\nx(function() {\n	return y = arguments[0]\n})");
  });
  return it('full feature', function() {
    return code_eq("x, y = a! b, c", "var x, y\na(b, c, function() {\n	x = arguments[0]\n	y = arguments[1]\n	return x\n})");
  });
});
