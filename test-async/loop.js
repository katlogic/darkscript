// Generated by CoffeeScript 1.6.2
var code_eq, p, _ref;

_ref = require('./helper'), p = _ref.p, code_eq = _ref.code_eq;

describe('for', function() {
  it('simple', function() {
    return code_eq("for i in [1..3]\n	x!\nnull", "var i, _i,\n  _this = this;\n\ni = _i = 1;\nfunction _step() {\n  i = ++_i;\n  _body();\n};\nfunction _body() {\n  if (_i <= 3) {\n	x(function(_$$_1) {\n	  _step(_$$_1);\n	});\n  } else {\n	_$cb$_0();\n  }\n};\n_body();\nfunction _$cb$_0() {\n  return null;\n};");
  });
  it('returns', function() {
    return code_eq("xs = for i in [1..3]\n	x!\nnull", "var i, xs, _$res$_1, _i,\n  _this = this;\n\n_$res$_1 = [];\ni = _i = 1;\nfunction _step() {\n  i = ++_i;\n  _body();\n};\nfunction _body() {\n  if (_i <= 3) {\n	x(function(_$$_2) {\n	  _step(_$res$_1.push(_$$_2));\n	});\n  } else {\n	_done();\n  }\n};\nfunction _done() {\n  _$cb$_0(_$res$_1);\n};\n_body();\nfunction _$cb$_0() {\n  xs = arguments[0];\n  return null;\n};");
  });
  it('guard', function() {
    return code_eq("for i in [1..3] when i > 10\n	x!\nnull", "var i, _i,\n  _this = this;\n\ni = _i = 1;\nfunction _step() {\n  i = ++_i;\n  _body();\n};\nfunction _body() {\n  if (_i <= 3) {\n	if (i > 10) {\n	  x(function(_$$_1) {\n		_step(_$$_1);\n	  });\n	} else {\n	  _step();\n	}\n  } else {\n	_$cb$_0();\n  }\n};\n_body();\nfunction _$cb$_0() {\n  return null;\n};");
  });
  it('pluckdirectcall', function() {
    return code_eq("for i in [1..10]\n	c = b!\nnull", "var c, i, _i,\n  _this = this;\n\ni = _i = 1;\nfunction _step() {\n  i = ++_i;\n  _body();\n};\nfunction _body() {\n  if (_i <= 10) {\n	b(function() {\n	  _step(c = arguments[0]);\n	});\n  } else {\n	_$cb$_0();\n  }\n};\n_body();\nfunction _$cb$_0() {\n  return null;\n};");
  });
  it('end with async condition', function() {
    return code_eq("res = for x in a\n	if y = b\n		z = c!", "var res, x, y, z, _$res$_1, _i, _len,\n  _this = this;\n\n_$res$_1 = [];\n_i = 0, _len = a.length;\nfunction _step() {\n  _i++;\n  _body();\n};\nfunction _body() {\n  if (_i < _len) {\n	x = a[_i];\n	if (y = b) {\n	  c(function() {\n		_$cb$_3(z = arguments[0]);\n	  });\n	  function _$cb$_3(_$$_2) {\n		_step(_$res$_1.push(_$$_2));\n	  };\n	} else {\n	  _step(_$res$_1.push(void 0));\n	}\n  } else {\n	_done();\n  }\n};\nfunction _done() {\n  _$cb$_0(_$res$_1);\n};\n_body();\nfunction _$cb$_0() {\n  return res = arguments[0];\n};");
  });
  it('nested for', function() {
    return code_eq("for x in a\n	for y in b\n		c!\nnull", "var x, y, _i, _len,\n  _this = this;\n\n_i = 0, _len = a.length;\nfunction _step() {\n  _i++;\n  _body();\n};\nfunction _body() {\n  var _j, _len1;\n  if (_i < _len) {\n	x = a[_i];\n	_j = 0, _len1 = b.length;\n	function _step1() {\n	  _j++;\n	  _body1();\n	};\n	function _body1() {\n	  if (_j < _len1) {\n		y = b[_j];\n		c(function(_$$_3) {\n		  _step1(_$$_3);\n		});\n	  } else {\n		_$cb$_0();\n	  }\n	};\n	_body1();\n	function _$cb$_0(_$$_2) {\n	  _step(_$$_2);\n	};\n  } else {\n	_$cb$_1();\n  }\n};\n_body();\nfunction _$cb$_1() {\n  return null;\n};");
  });
  it('contain defPart', function() {
    return code_eq("for x in a.b\n	c!\nnull", "var x, _i, _len, _ref,\n  _this = this;\n\n  _ref = a.b;\n_i = 0, _len = _ref.length;\nfunction _step() {\n  _i++;\n  _body();\n};\nfunction _body() {\n  if (_i < _len) {\n	x = _ref[_i];\n	c(function(_$$_1) {\n	  _step(_$$_1);\n	});\n  } else {\n	_$cb$_0();\n  }\n};\n_body();\nfunction _$cb$_0() {\n  return null;\n};");
  });
  return it('for own width defPart', function() {
    return code_eq("for own k, v of a.b\n	c!\nnull", "var k, v, _$$_0, _$$_1, _$$_2, _i, _len,\n  __hasProp = {}.hasOwnProperty,\n  _this = this;\n\n_$$_1 = a.b;\n\n_$$_2 = (function() {\n  var _results;\n  _results = [];\n  for (_$$_0 in _$$_1) {\n	if (!__hasProp.call(_$$_1, _$$_0)) continue;\n	_results.push(_$$_0);\n  }\n  return _results;\n})();\n\n_i = 0, _len = _$$_2.length;\nfunction _step() {\n  _i++;\n  _body();\n};\nfunction _body() {\n  if (_i < _len) {\n	k = _$$_2[_i];\n	v = _$$_1[k];\n	c(function(_$$_4) {\n	  _step(_$$_4);\n	});\n  } else {\n	_$cb$_3();\n  }\n};\n_body();\nfunction _$cb$_3() {\n  return null;\n};");
  });
});

describe('while', function() {
  it('simple', function() {
    return code_eq("while true\n	x!\nnull", "var _this = this;\n\nfunction _body() {\n  if (true) {\n	x(function(_$$_1) {\n	  _body(_$$_1);\n	});\n  } else {\n	_$cb$_0();\n  }\n};\n_body();\nfunction _$cb$_0() {\n  return null;\n};");
  });
  it('returns', function() {
    return code_eq("xs = while true\n	x!\nnull", "var xs, _$res$_1,\n  _this = this;\n\n_$res$_1 = [];\nfunction _body() {\n  if (true) {\n	x(function(_$$_2) {\n	  _body(_$res$_1.push(_$$_2));\n	});\n  } else {\n	_done();\n  }\n};\nfunction _done() {\n  _$cb$_0(_$res$_1);\n};\n_body();\nfunction _$cb$_0() {\n  xs = arguments[0];\n  return null;\n};");
  });
  it('for own of', function() {
    return code_eq("for own k, v of vs\n	x!\nnull", "var k, v, _$$_0, _$$_1, _i, _len,\n  __hasProp = {}.hasOwnProperty,\n  _this = this;\n\n_$$_1 = (function() {\n  var _results;\n  _results = [];\n  for (_$$_0 in vs) {\n	if (!__hasProp.call(vs, _$$_0)) continue;\n	_results.push(_$$_0);\n  }\n  return _results;\n})();\n\n_i = 0, _len = _$$_1.length;\nfunction _step() {\n  _i++;\n  _body();\n};\nfunction _body() {\n  if (_i < _len) {\n	k = _$$_1[_i];\n	v = vs[k];\n	x(function(_$$_3) {\n	  _step(_$$_3);\n	});\n  } else {\n	_$cb$_2();\n  }\n};\n_body();\nfunction _$cb$_2() {\n  return null;\n};");
  });
  it('nested for with break', function() {
    return code_eq("while true\n	a!\n	for i in a\n		if i < 10\n			continue\n		else\n			break\n	b!\nnull", "var i,\n  _this = this;\n\nfunction _body() {\n  if (true) {\n	a(function() {\n	  var _i, _len;\n	  for (_i = 0, _len = a.length; _i < _len; _i++) {\n		i = a[_i];\n		if (i < 10) {\n		  continue;\n		} else {\n		  break;\n		}\n	  }\n	  b(function(_$$_1) {\n		_body(_$$_1);\n	  });\n	});\n  } else {\n	_$cb$_0();\n  }\n};\n_body();\nfunction _$cb$_0() {\n  return null;\n};");
  });
  it('_break', function() {
    return code_eq("while true\n	a!\n	->\n		b _break\nnull", "var _this = this;\n\nfunction _body() {\n  if (true) {\n	a(function() {\n	  _body(function() {\n		return b(_$cb$_0);\n	  });\n	});\n  } else {\n	_$cb$_0();\n  }\n};\n_body();\nfunction _$cb$_0() {\n  return null;\n};");
  });
  it('_continue', function() {
    return code_eq("while true\n	a!\n	->\n		b _continue\nnull", "var _this = this;\n\nfunction _body() {\n  if (true) {\n	a(function() {\n	  _body(function() {\n		return b(_body);\n	  });\n	});\n  } else {\n	_$cb$_0();\n  }\n};\n_body();\nfunction _$cb$_0() {\n  return null;\n};");
  });
  return it('loop with autocb args', function() {
    return code_eq("(autocb(a, b)) ->\n	a = for v in vs\n			x!", "(function(autocb) {\n  var a, b, v, _$res$_1, _i, _len,\n	_this = this;\n  _$res$_1 = [];\n  _i = 0, _len = vs.length;\n  function _step() {\n	_i++;\n	_body();\n  };\n  function _body() {\n	if (_i < _len) {\n	  v = vs[_i];\n	  x(function(_$$_2) {\n		_$res$_1.push(_$$_2);\n		_step(a, b);\n	  });\n	} else {\n	  _done();\n	}\n  };\n  function _done() {\n	_$cb$_0(_$res$_1);\n  };\n  _body();\n  function _$cb$_0() {\n	a = arguments[0];\n	autocb(a, b);\n  };\n});");
  });
});
