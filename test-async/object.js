// Generated by CoffeeScript 1.6.3
var code_eq, p, _ref;

_ref = require('./helper'), p = _ref.p, code_eq = _ref.code_eq;

describe('object', function() {
  return it('simple', function() {
    return code_eq("A =\n	x: a\n	y: b!\n	c: d", "var A, _$$_1,\n  _this = this;\n\n_$$_1 = a;\nb(function(_$$_2) {\n  _$cb$_0({\n	x: _$$_1,\n	y: _$$_2,\n	c: d\n  });\n});\nfunction _$cb$_0() {\n  return A = arguments[0];\n};");
  });
});
