// Generated by ToffeeScript 1.6.3-3
(function() {
  var code_eq, p, _ref;

  _ref = require('./helper'), p = _ref.p, code_eq = _ref.code_eq;

  describe('autocb', function() {
    it('simple', function() {
      return code_eq("x = (autocb)->", "function x(autocb) {\n  autocb();\n};\n");
    });
    it('simple 2', function() {
      return code_eq("x = (autocb) ->\n	y!", "function x(autocb) {\n  var _this = this;\n  y(function(_$$_0) {\n	autocb(_$$_0);\n  });\n};");
    });
    it('simple 3', function() {
      return code_eq("x = (autocb) ->\n	x = y!", "function x(autocb) {\n  var _this = this;\n  y(function() {\n	autocb(x = arguments[0]);\n  });\n};");
    });
    it('empty return', function() {
      return code_eq("x = (autocb)-> return", "function x(autocb) {\n  return autocb();\n};");
    });
    it('autocb with args and condition', function() {
      return code_eq("(autocb(a)) ->\n	if d! + e!\n		f!\n	d = a! + b!\n	c!", "(function(autocb) {\n  var a, d,\n	_this = this;\n  d(function(_$$_7) {\n	e(function(_$$_8) {\n	  _$cb$_6(_$$_7 + _$$_8);\n	});\n  });\n  function _$cb$_6(_$$_0) {\n	if (_$$_0) {\n	  f(function() {\n		_$$_5();\n	  });\n	} else {\n	  _$$_5();\n	}\n	function _$$_5() {\n	  a(function(_$$_2) {\n		b(function(_$$_3) {\n		  _$cb$_1(_$$_2 + _$$_3);\n		});\n	  });\n	  function _$cb$_1() {\n		d = arguments[0];\n		c(function(_$$_10) {\n		  _$$_10;\n		  autocb(a);\n		});\n	  };\n	};\n  };\n});\n");
    });
    return it('autocb in for loop', function() {
      return code_eq("(autocb(e)) ->\n	for a in b\n		c!\n		return\n	@", "(function(autocb) {\n  var a, e, _i, _len,\n	_this = this;\n  _i = 0, _len = b.length;\n  function _step() {\n	_i++;\n	_body();\n  };\n  function _body() {\n	if (_i < _len) {\n	  a = b[_i];\n	  c(function() {\n\n		return autocb(e);\n	  });\n	} else {\n	  _$cb$_0();\n	}\n  };\n  _body();\n  function _$cb$_0() {\n	_this;\n	autocb(e);\n  };\n});");
    });
  });

}).call(this);
