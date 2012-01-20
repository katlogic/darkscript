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
5. Extending

### 1. Asynchronous

Grammar: add '!' to the end of the function name

Input:

    do ->
      # ! always is a function
      foo_0_0!
      @va = obj.foo_2_1! 'pa', 'pb'
      # @ is inherited
      [va, @vb] = obj::foo_2_2! 'pa', 'pb'
      va, @vb = without_brackets!

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
        return obj.foo_2_1('pa', 'pb', function(_$$_va) {
          _this.va = _$$_va;
          return obj.prototype.foo_2_2('pa', 'pb', function(_$$_va, _$$_vb) {
            var va;
            va = _$$_va;
            _this.vb = _$$_vb;
            return without_brackets(function(_$$_va, _$$_vb) {
              va = _$$_va;
              return _this.vb = _$$_vb;
            });
          });
        });
      });
    })();

    (function() {
      var _this = this;
      return this.foo('pa', function(_$$_va) {
        return _this.va = _$$_va;
      });
    })();

    if (true) {
      foo(function(_$$_va) {
        var va;
        return va = _$$_va;
      });
    } else {
      foo(function(_$$_vb) {
        var vb;
        return vb = _$$_vb;
      });
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

### 5. Extending ###

Grammar: Identifier . Object

Example:

    global.
        FOO: 1
        BAR: 2
        BAZ: 3

    obj = {}
    obj.{FOO, BAR, BAZ: 'baz'}
    console.info obj

    obj = {}
    obj.info = {}
    obj.info.
        foo: 'foo'
        bar: ->
            console.info 'bar'

    # it will use __ts_extend function the the assigment as param in function.
    console.info obj.{FOO, BAR: 'bar'}

    # when use {...} the object will become more powerful, any expression could be used as key.
    obj = {}
    obj.{
      a: "b"
      "a" + "b": "ab"
    }
    console.info obj

Output:

    var obj, _asid0,
      __ts_extend = function() { var args, i, len, object; args = Array.prototype.slice.call(arguments); len = args.length; if (len === 0) return null; i = 0; object = args[i++]; while (i<args.length) { object[args[i++]] = args[i++]; } return object; };

    global.FOO = 1;

    global.BAR = 2;

    global.BAZ = 3;

    obj = {};

    obj.FOO = FOO;

    obj.BAR = BAR;

    obj.BAZ = 'baz';

    console.info(obj);

    obj = {};

    obj.info = {};

    _asid0 = obj.info;

    _asid0.foo = 'foo';

    _asid0.bar = function() {
      return console.info('bar');
    };

    console.info(__ts_extend(obj, "FOO", FOO, "BAR", 'bar'));

    obj = {};

    obj.a = "b";

    obj["a" + "b"] = "ab";

    console.info(obj);

Result:
    
    { FOO: 1, BAR: 2, BAZ: 'baz' }
    { info: { foo: 'foo', bar: [Function] }, FOO: 1, BAR: 'bar' }
    { a: 'b', ab: 'ab' }


Installation
============

npm install -g toffee-script

There are two binary file **toffee** and **tcons** relative to coffee and cake


More Aboute Async Syntax
========================

### Async Condition if! unless!

Input

    get = (cb) ->
      cb 'hello'
    a = null
    unless! a
      a = get!
    console.info a

Output:

    var a, get, _asfn0;
    var _this = this;

    get = function(cb) {
      return cb('hello');
    };

    a = null;

    _asfn0 = function() {
      return console.info(a);
    };

    if (!a) {
      get(function(_asp0) {
        a = _asp0;
        return _asfn0();
      });
    } else {
      _asfn0();
    }

get! and unless! are asynchronous, the example above will print 'hello'

### Asnyc call with return


Input:

    net = require 'net'

    # [ and ] is not nesscary, add brackets to make code more readable
    # recommand use standard way if the asynchronous has returns
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
