ToffeeScript
============

ToffeeScript is a CoffeeScript dialect with Asynchronous Grammar

**Features**

1. Asynchronous everywhere
    * Condition: If, Switch
    * Loop: For In, For Of, While with guard `when`
    * Mathematics
    * Logical Operation
2. Auto Callback
3. Regexp Operator =~ and matches \&, \0~\9
4. High efficent code generated.
5. Sourcemap Supported.
    * Follow up to CoffeeScript 1.6.2 so far

Code Examples
-------------
Left: ToffeeScript

Right: Generated JavaScript
### Basic
<table width=100%><tr>
	<td width=50% valign=top><pre>x, y = a! b
console.log x, y</pre></td>
	<td width=50% valign=top><pre>var x, y,
  _this = this;

a(b, function() {
  x = arguments[0], y = arguments[1];
  return console.log(x, y);
});</pre></td>
</tr></table>
### Condition
<table width=100%><tr>
	<td width=50% valign=top><pre>if i
  x = a!
else
  y = b!
console.log x, y</pre></td>
	<td width=50% valign=top><pre>var x, y, _$$_0,
  _this = this;

_$$_0 = function() {
  return console.log(x, y);
};

if (i) {
  a(function() {
    x = arguments[0];
    _$$_0();
  });
} else {
  b(function() {
    y = arguments[0];
    _$$_0();
  });
}</pre></td>
</tr></table>
### Loop
Support For In, For Of, While with guard `when`
<table width=100%><tr>
	<td width=50% valign=top><pre>xs = for i in [1..3] when i &gt; 2
  a!</pre></td>
	<td width=50% valign=top><pre>var i, xs,
  _this = this;

(function(_$cb$_0) {
  var _$res$_1, _body, _done, _i, _step;
  _$res$_1 = [];
  i = _i = 1;
  _step = function() {
    i = ++_i;
    _body();
  };
  _body = function() {
    if (_i &lt;= 3) {
      if (i &gt; 2) {
        a(function(_$$_2) {
          _step(_$res$_1.push(_$$_2));
        });
      } else {
        _step();
      }
    } else {
      _done();
    }
  };
  _done = function() {
    _$cb$_0(_$res$_1);
  };
  _body();
})(function() {
  return xs = arguments[0];
});</pre></td>
</tr></table>
### Mathematics
<table width=100%><tr>
	<td width=50% valign=top><pre>x = a! + b! * c!</pre></td>
	<td width=50% valign=top><pre>var x,
  _this = this;

(function(_$cb$_0) {
  a(function(_$$_1) {
    (function(_$cb$_2) {
      b(function(_$$_3) {
        c(function(_$$_4) {
          _$cb$_2(_$$_3 * _$$_4);
        });
      });
    })(function(_$$_5) {
      _$cb$_0(_$$_1 + _$$_5);
    });
  });
})(function() {
  return x = arguments[0];
});</pre></td>
</tr></table>
### Object
<table width=100%><tr>
	<td width=50% valign=top><pre>A =
  a: a
  b: b!
  c: c</pre></td>
	<td width=50% valign=top><pre>var A,
  _this = this;

(function(_$cb$_0) {
  var _$$_1;
  _$$_1 = a;
  b(function(_$$_2) {
    _$cb$_0({
      a: _$$_1,
      b: _$$_2,
      c: c
    });
  });
})(function() {
  return A = arguments[0];
});</pre></td>
</tr></table>
### Logical
Support `||`, `&&`, `?`, `&&=`, `||=`, `?=`
<table width=100%><tr>
	<td width=50% valign=top><pre>x = a! || b!
console.log x</pre></td>
	<td width=50% valign=top><pre>var x,
  _this = this;

(function(_$cb$_0) {
  (function(_$cb$_3) {
    a(function(_$$_1) {
      if (_$$_1) {
        _$cb$_3(_$$_1);
      } else {
        b(function(_$$_2) {
          _$cb$_3(_$$_2);
        });
      }
    });
  })(function(_$$_4) {
    _$cb$_0(_$$_4);
  });
})(function() {
  x = arguments[0];
  return console.log(x);
});</pre></td>
</tr></table>
### Auto Callback
<table width=100%><tr>
	<td width=50% valign=top><pre>a = (autocb) -&gt; return 3</pre></td>
	<td width=50% valign=top><pre>var a;

a = function(autocb) {
  return autocb(3);
};</pre></td>
</tr></table>
Return Multiple Values
<table width=100%><tr>
	<td width=50% valign=top><pre>a = (autocb) -&gt; return null, 3</pre></td>
	<td width=50% valign=top><pre>var a;

a = function(autocb) {
  return autocb(null, 3);
};</pre></td>
</tr></table>
Regexp
<table width=100%><tr>
	<td width=50% valign=top><pre>if a =~ b || b =~ c
  a =~ d</pre></td>
	<td width=50% valign=top><pre>var __matches;

if ((__matches = a.match(b)) || (__matches = b.match(c))) {
  __matches = a.match(d);
}</pre></td>
</tr></table>