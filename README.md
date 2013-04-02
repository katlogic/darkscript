ToffeeScript
============

ToffeeScript is a CoffeeScript dialect with Asynchronous Grammar
It follow up to CoffeeScript 1.6.2 so far.

**Features**

1. Asynchronous everywhere, even support logicial operation.
2. High efficent code generated.
3. Sourcemap Supported.

Grammar
-------
It supports

1. Condition: If, Switch
2. Loop: For In, For Of, While with guard `when`
3. Mathematics
4. Logical Operation
5. Auto Callback

### Basic

    x, y = a! b
    console.log x, y

convert to

```javascript
var x, y;
a(b, function() {
  x = arguments[0], y = arguments[1];
  return console.log(x, y);
});
```
    
### Condition

    if i
        x = a!
    else
        y = b!
    console.log x, y
        
convert to

```javascript
var x, y, _$$_0,
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
}
```

### Loop

For...In

    for i in [1..3]
        a!
        
For...Of

    for own k, v of obj
        a!

While

    while i
        a!

With Guard

    for i in [1..3] when i>2
        a!
        
Loop with results

    xs = for i in [1..3]
        a!

### Mathematics

    x = a! + b! * c!

### Object

    A = 
        a: a!
        b: b!

### Logical

Support `||`, `&&`, `?`, `&&=`, `||=`, `?=`

    x = a! || b!
    console.log x

convert to

```javascript
var x,
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
});
```
    
### Auto Callback

    a = (autocb) -> return 3
    
convert to

```javascript
var a;

a = function(autocb) {
  return autocb(3);
};
```
    
Return Multiple Values

    a = (autocb) -> return null, 3

```javascript
var a;

a = function(autocb) {
  return autocb(null, 3);
};
```
