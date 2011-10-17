About
=====
Fully compatible with CoffeeScript
It's the base on CoffeeScript and with some improvements.

Additional Features
===================
1. String In Symbol Style
2. RegExp operator =~
3. RegExp Magic Identifier ```\& \~ \1..9```

### 1. String in Symbol style
It's the similar to Ruby Symbol, but it's just a String, use for the easier to write string.

Grammar: /^\:((?:\\.|\w|-)+)/

Remark:- is valid character of the symbol

Example:

    :hello_world
    :hello-world

Output:

    'hello_world'
    'hello-world'

### 2. RegExp operator =~
Grammar: String =~ RegExp
Example:

    "hello" =~ /\w+/

Output:

    (function() {
      var __matches = null;
      __matches = "hello".match(/\w+/);
    }).call(this);
    

### 3. RegExp Magic Identifier \& \~ \1..9
Magic Identifiers:

    \~: the match
    \&: match[0]
    \1: match[1]
    \2: match[2]
    ...
    \9: match[9]

Example:

    if :hello =~ /^\w+$/
      console.info :matched

    if :333-444 =~ /^(\d+)-(\d+)$/
      console.info \1, \2

Output:

    (function() {
      var __matches = null;
      if (__matches = 'hello'.match(/^\w+$/)) console.info('matched');
      if (__matches = '333-444'.match(/^(\d+)-(\d+)$/)) {
        console.info(__matches[1], __matches[2]);
      }
    }).call(this);

### 4. Asynchronous

Grammar: add '!' to the end of the function name

Input:

    # ! always is a function
    foo_0_2!
    va = foo_0_1!()
    [va, vb] = foo_0_2!()

    obj.obj.foo_2_0! 'pa', 'pb'
    va = obj.foo_2_1! 'pa', 'pb'
    [va, vb] = obj::foo_2_2! 'pa', 'pb'

Output:

    foo_0_2(function() {
      return foo_0_1(function(va) {
        return foo_0_2(function(va, vb) {
          return obj.obj.foo_2_0('pa', 'pb', function() {
            return obj.foo_2_1('pa', 'pb', function(va) {
              return obj.prototype.foo_2_2('pa', 'pb', function(va, vb) {
                return world(function(result) {
                  return hello(result);
                });
              });
            });
          });
        });
      });
    });
