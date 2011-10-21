About ToffeeScript
==================

Fully compatible with CoffeeScript.

It's the base on [CoffeeScript](http://jashkenas.github.com/coffee-script/) and have some additional features.

Additional Features
===================

1. Asynchronous
2. String In Symbol Style
3. RegExp operator =~
4. RegExp Magic Identifier ```\& \~ \1..9```

### 1. Asynchronous

Grammar: add '!' to the end of the function name

Input:

    do ->
      # ! always is a function
      foo_0_0!
      @va = obj.foo_2_1! 'pa', 'pb'
      # @ is inherited
      [va, @vb] = obj::foo_2_2! 'pa', 'pb'

    # another async block
    do ->
      @va = @foo! 'pa'

    # if, while and so on has block too
    if true
      va = foo!
    else
      vb = foo!

Output:

    var _this = this;

    (function() {
      var _this = this;
      return foo_0_0(function() {
        return obj.foo_2_1('pa', 'pb', function(va) {
          _this.va = va;
          return obj.prototype.foo_2_2('pa', 'pb', function(va, vb) {
            _this.vb = vb;
          });
        });
      });
    })();

    (function() {
      var _this = this;
      return this.foo('pa', function(va) {
        _this.va = va;
      });
    })();

    if (true) {
      foo(function(va) {});
    } else {
      foo(function(vb) {});
    }

#### Theory

ToffeeScript will translate

    [any expression] = foo!
    other expression

to 

    foo (any expression) =>
      other expression

so
    [a = '3', @b = '4'] = foo!
    @a = foo!
    ...
    and so on

is valid too.

### 2. String in Symbol style

It's the similar to Ruby Symbol, but it's just a String, use for the easier to write string.

Grammar: ```/^\:((?:\\.|\w|-)+)/```

Remark:- is valid character of the symbol

Example:

    :hello_world
    :hello-world

Output:

    'hello_world'
    'hello-world'

### 3. RegExp operator =~

Grammar: String =~ RegExp

Example:

    "hello" =~ /\w+/

Output:

    (function() {
      var __matches = null;
      __matches = "hello".match(/\w+/);
    }).call(this);
    

### 4. RegExp Magic Identifier \& \~ \1..9

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

Installation
============

npm install -g toffee-script

There are two binary file **toffee** and **tcons** relative to coffee and cake


More Aboute Async Syntax
========================

### Asnyc call with return

Input:

    net = require 'net'

    # [ and ] is not nesscary, add brackets to make code more readable
    server = [socket] = net.createServer!
    socket.write "Echo server\r\n"
    socket.pipe socket
    # --- means is end of a async scope, Idea is from Kaffeine
    ---
    server.listen 1337, "127.0.0.1"

Output:

    var net, server;
    var _this = this;

    net = require('net');

    server = net.createServer(function(socket) {
      socket.write("Echo server\r\n");
      return socket.pipe(socket);
    });

    server.listen(1337, "127.0.0.1");

### Complex expression for parameters

Input:

    [@a = 'default value'] = foo!

Output:

    var _this = this;

    foo(function(a) {
      _this.a = a != null ? a : 'default value';
    });
