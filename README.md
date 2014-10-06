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
3. Regexp Operator `=~` and matches `\~`, `\&`, `\0`~`\9`
4. High efficent code generated.
5. Sourcemap Supported.
    * Follow up to CoffeeScript 1.6.2 so far
6. Safety named-function supported.
	* Added in ToffeeScript 1.6.2-3

Installation
------------

    npm install toffee-script

Named Function
--------------
ToffeeScript support named function which is different from CoffeeScript.
if the function defined in the first level of code block and the function name haven't been used, then compile it as named function. see Code Examples section
It won't have compatible issue with CoffeeScript except one case

	# m never declared above, m must be local variable and assign to undefined
	m()
	m = ->
	m

in CoffeeScript will throw exception `undefined is not function`. Use m as constant undefined variable is rare case.

in ToffeeScript function m is hoisted, and will run function m() as Javascript does.

Code Examples
-------------
Left: ToffeeScript

Right: Generated JavaScript
### Basic

<table width=100%>
<tr>
	<td width=50% valign=top><pre>x, y = a! b
console.log x, y</pre></td>
	<td width=50% valign=top><pre>var x, y,
  _this = this;

a(b, function() {
  x = arguments[0], y = arguments[1];
  return console.log(x, y);
});</pre></td>
</tr>
</table>

with powerful CoffeeScript assignment `[...]`

<table width=100%>
<tr><td width=100%><pre>[@x, y...] = a! b
console.log @x, y</pre></td></tr>
<tr><td width=100%><pre>var y,
  _this = this,
  __slice = [].slice;

a(b, function() {
  _this.x = arguments[0], y = 2 &lt;= arguments.length ? __slice.call(arguments, 1) : [];
  return console.log(_this.x, y);
});</pre></td></tr>
</table>

### Condition

<table width=100%>
<tr>
	<td width=50% valign=top><pre>if i
  x = a!
else
  y = b!
console.log x, y</pre></td>
	<td width=50% valign=top><pre>var x, y,
  _this = this;

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

function _$$_0() {
  return console.log(x, y);
};</pre></td>
</tr>
</table>

Async in condition

<table width=100%>
<tr>
	<td width=50% valign=top><pre>if e = a!
  return cb(e)
foo()</pre></td>
	<td width=50% valign=top><pre>var e,
  _this = this;

a(function() {
  _$cb$_2(e = arguments[0]);
});
function _$cb$_2(_$$_0) {
  if (_$$_0) {
    return cb(e);
  } else {
    _$$_1();
  }
  function _$$_1() {
    return foo();
  };
};</pre></td>
</tr>
</table>

Async in condition with multi return

Async call always return first argument

<table width=100%>
<tr><td width=100%><pre>if e, data = fs.readFile! 'foo'
  return cb(e)
console.log data</pre></td></tr>
<tr><td width=100%><pre>var data, e,
  _this = this;

fs.readFile('foo', function() {
  _$cb$_2((e = arguments[0], data = arguments[1], e));
});
function _$cb$_2(_$$_0) {
  if (_$$_0) {
    return cb(e);
  } else {
    _$$_1();
  }
  function _$$_1() {
    return console.log(data);
  };
};</pre></td></tr>
</table>

### Loop
Support For In, For Of, While with guard `when`

<table width=100%>
<tr>
	<td width=50% valign=top><pre>xs = for i in [1..3] when i &gt; 2
  a!
  # return arguments[0] in default</pre></td>
	<td width=50% valign=top><pre>var i, xs, _$res$_1, _i,
  _this = this;

_$res$_1 = [];
i = _i = 1;
function _step() {
  i = ++_i;
  _body();
};
function _body() {
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
function _done() {
  _$cb$_0(_$res$_1);
};
_body();
function _$cb$_0() {
  return xs = arguments[0];
};</pre></td>
</tr>
</table>

### Mathematics

<table width=100%>
<tr>
	<td width=50% valign=top><pre>x = a! + b! * c!</pre></td>
	<td width=50% valign=top><pre>var x,
  _this = this;

a(function(_$$_1) {
  b(function(_$$_3) {
    c(function(_$$_4) {
      _$cb$_2(_$$_3 * _$$_4);
    });
  });
  function _$cb$_2(_$$_5) {
    _$cb$_0(_$$_1 + _$$_5);
  };
});
function _$cb$_0() {
  return x = arguments[0];
};</pre></td>
</tr>
</table>

### Object

<table width=100%>
<tr>
	<td width=50% valign=top><pre>A =
  a: a
  b: b!
  c: c</pre></td>
	<td width=50% valign=top><pre>var A, _$$_1,
  _this = this;

_$$_1 = a;
b(function(_$$_2) {
  _$cb$_0({
    a: _$$_1,
    b: _$$_2,
    c: c
  });
});
function _$cb$_0() {
  return A = arguments[0];
};</pre></td>
</tr>
</table>

### Logical
Support `||`, `&&`, `?`, `&&=`, `||=`, `?=`

<table width=100%>
<tr>
	<td width=50% valign=top><pre>x = a! || b!
console.log x</pre></td>
	<td width=50% valign=top><pre>var x,
  _this = this;

a(function(_$$_1) {
  if (_$$_1) {
    _$cb$_3(_$$_1);
  } else {
    b(function(_$$_2) {
      _$cb$_3(_$$_2);
    });
  }
});
function _$cb$_3(_$$_4) {
  _$cb$_0(_$$_4);
};
function _$cb$_0() {
  x = arguments[0];
  return console.log(x);
};</pre></td>
</tr>
</table>

### Auto Callback

<table width=100%>
<tr>
	<td width=50% valign=top><pre>a = (autocb) -&gt; return 3</pre></td>
	<td width=50% valign=top><pre>function a(autocb) {
  return autocb(3);
};</pre></td>
</tr>
</table>

Return Multiple Values

<table width=100%>
<tr>
	<td width=50% valign=top><pre>a = (autocb) -&gt; return null, 3</pre></td>
	<td width=50% valign=top><pre>function a(autocb) {
  return autocb(null, 3);
};</pre></td>
</tr>
</table>

Autocb with default args

<table width=100%>
<tr>
	<td width=50% valign=top><pre>a = (paramA, autocb(e, data)) -&gt;
  e = foo!
  if something
    data = 1
  else
    data = 2</pre></td>
	<td width=50% valign=top><pre>function a(paramA, autocb) {
  var data, e,
    _this = this;
  foo(function() {
    e = arguments[0];
    if (something) {
      data = 1;
      autocb(e, data);
    } else {
      data = 2;
      autocb(e, data);
    }
  });
};</pre></td>
</tr>
</table>

### Regexp

<table width=100%>
<tr><td width=100%><pre>if a =~ b || b =~ c
  \~
  \&
  \0
  \9</pre></td></tr>
<tr><td width=100%><pre>var __matches;

if ((__matches = a.match(b)) || (__matches = b.match(c))) {
  __matches;
  __matches[0];
  __matches[0];
  __matches[9];
}</pre></td></tr>
</table>

### Named Function Supported


<table width=100%>
<tr>
	<td width=50% valign=top><pre>a = -&gt;
b = ->
null</pre></td>
	<td width=50% valign=top><pre>function a() {};

function b() {};

null;</pre></td>
</tr>
</table>

Those cases will be kept in non-named function

<table width=100%>
<tr>
	<td width=50% valign=top><pre>f = null
if a
  b = c -&gt;
d e = ->
f = ->
null</pre></td>
	<td width=50% valign=top><pre>var b, e, f;

f = null;

if (a) {
  b = c(function() {});
}

d(e = function() {});

f = function() {};

null;

</pre></td>
</tr>
</table>

     _     _              _                     ___    ___             
    | |   | |            | |                   / __)  / __)            
    | |__ | | _____  ____| |  _     ____ ___ _| |__ _| |__ _____ _____ 
    |  _ \| |(____ |/ ___) |_/ )   / ___) _ (_   __|_   __) ___ | ___ |
    | |_) ) |/ ___ ( (___|  _ (   ( (__| |_| || |    | |  | ____| ____|
    |____/ \_)_____|\____)_| \_)   \____)___/ |_|    |_|  |_____)_____)


What's this?
============

BlackCoffee is a CoffeeScript dialect that adds hygienic macros (also known as black magic, hence the name). We aim for inclusion of this exension into mainline CoffeeScript.

Applications include:
- compile-time calculations,
- file inclusion,
- conditional compilation,
- i18n translation,
- html resource versioning,
- syntactic sugar,
- and whatever else you can think of doing at compile-time.

Besides macros, BlackCoffee sneaks one additional feature in CoffeeScript: Coco-like `!->` and `!=>` procedures. Prefixing an exclamation mark to the function operator, causes the function not to do an implicit return of the last expression.


Installation and usage
======================

You can obtain BlackCoffee through npm:
```sh
npm install blackcoffee
```

..or clone the repository:
```sh
git clone https://github.com/paiq/blackcoffee
```

In both cases you'll have a local installation, assuming you don't want to replace your regular CoffeeScript compiler. You'll find the main compiler executable here `blackcoffee/bin/coffee` or here `node\_modules/blackcoffee/bin/coffee`.

The compiler can be used in the exact same way as the regular CoffeeScript compiler (except that macros are supported, of course). In addition, BlackCoffee comes with its own very simple CLI named `blackcoffee`, which supports multiple source files and command line flags that can be used by macros. Read the 'blackcoffee cli' section for more info.

To install blackcoffee system-wide, *replacing any already installed CoffeeScript version*:
```sh
sudo npm install -g blackcoffee
```

...or:
```sh
git clone https://github.com/paiq/blackcoffee
cd blackcoffee
sudo bin/cake install
```


One-time macro calls
====================

The `macro` keyword can be used in two distinct ways. When it's followed directly by a closure, that closure will be executed at compile time. In case the closure returns a BlackCoffee node (see below) it will replace the original macro-call. Otherwise the macro-call will be removed or replaced by `undefined`.

The compile-time closure calls do not get any arguments. They do get a `this`-object that will be the same for all calls to macro closures, which can safely be used to maintain state. This object is also reachable through `cfg` in the global compile-time namespace.

Examples:
```CoffeeScript
macro ->
	@someStateVar = []
# compiles to nothing, because `[]` is not a BlackCoffee node.

macro ->
	macro.fileToNode "test.coffee"
# `macro.fileToNode` reads a js or coffee file, and returns the BlackCoffee
# node for it. As the macro closure returns a node, it will replace the call.
# So in effect, the file is included.

fileContents = macro ->
	macro.valToNode ''+macro.require('fs').readFileSync 'file.txt'
# `macro.valToNode` converts a json-able value to a BlackCoffee node. So
# `fileContents` will contain whatever is in 'file.txt'. Of course, as we're
# using `require('fs')` this will not work when compiling in the browser.
```


Named macro definitions
=======================

When the `macro` keyword is followed by an identifier and then a closure, it's a definition. Every time the identifier is used as a closure call later on in the program, the closure call is replaced by the result of a compile-time call to the defined macro. Arguments to the macro are passed to the compile-time closure as BlackCoffee nodes.

Examples:
```CoffeeScript
macro macroWithoutArgs -> macro.csToNode '3 * a'
# A named macro is defined here, but no code is generated yet.

z = macroWithoutArgs() + 4
# Here we're actually using the macro. Expands to: `z = 3 * a + 4`.

macro replaceFooWithBar (node) -> node.subst {foo: macro.csToNode 'bar'}
# Here, the macro takes an argument. `subst` is a method that can be used on
# every type of BlackCoffee node, to recursively search and replace
# identifiers with a node.

arr = replaceFooWithBar -> [foo+foo, -> foo]
# Expands to: `arr = [bar+bar, -> bar]`
```


Helper functions
================

We've already seen some examples of helper functions defined in the compile-time `macro.` namespace. Let's go over them one by one:

**macro.valToNode(value)**
Convert a json-able `value` to a node.
```CoffeeScript
buildInfo = macro -> macro.valToNode
	time: new Date().getTime()
	host: macro.require('os').hostname()
```

**macro.csToNode(scriptString)**
Parse a string of BlackCoffee script and return its main node.
```CoffeeScript
macro -> macro.csToNode "x = a+b+(#{process.env.buildMagic})+4"
```

**macro.jsToNode(scriptString)**
Creates a `literal` node, embedding a piece of unprocessed Javascript. As this node just embeds an opaque piece of Javascript, `subst` (see below) will not have any effect on it.
```CoffeeScript
macro -> macro.jsToNode @someFancyToolThatGeneratesJavascript()
```

**macro.fileToNode(filename,language)**
A little wrapper around `csToNode` and `jsToNode` that tries to load `filename` from disk using `fs.readFileSync`. Of course, this won't work when compiling in the browser. If `language` is `'js'` or `'cs'`, that is how the file will be interpreted. If it is not set, `fileToNode` will make a guess based on the file extension.

This helper can be used for file inclusion, though one may want to write a wrapper macro around it, to search in the appropriate path(s) and maybe to dependency tracking and such.

```CoffeeScript
macro -> macro.fileToNode 'includeMe.coffee'
# or
macro include (fn) -> macro.fileToNode @myPathSearcher(fn+'.coffee')
include 'includeMe'
```

**macro.codeToNode(closure)**
Takes a closure (function), and returns its body as a node. So the closure itself is *not* part of the node. Note that `codeToNode` is the only helper function that is not actually a function. It's a predefined macro. It needs to be, because it needs to capture the node of its argument instead of the value.

```CoffeeScript
macro swap (a,b) -> macro.codeToNode(-> [x,y]=[y,x]).subst {x:a, y:b}
swap c, d
```

**macro.nodeToVal(node)**
Try to evaluate the `node` at compile-time and return the value. Any errors (such as referencing run-time variables), will throw at compile-time.

```
# Example for those who long for the bad old C-preprocessor days. ;-)
macro ifdef (key) ->
	key = macro.nodeToVal key
	macro.csToNode(if @defines[key] then "if true" else "if false")
throw 'party' ifdef 'firstBeta'
```

**macro.idToVal(node)**
In case `node` is a bare identifier, return its string value. Return `undefined` otherwise.
```
# Example for those who long for the bad old C-preprocessor days. ;-)
macro ifdef (key) ->
	key = macro.nodeToId key
	macro.csToNode(if @defines[key] then "if true" else "if false")
throw 'party' ifdef firstBeta
```


Working with Nodes
==================

WARNING: Manipulating BlackCoffee nodes directly exposes compiler implementation details. Therefore, documentation is mostly absent and things may change between compiler versions without notice. It is recommended to use these techniques as little as possible.

**macro.[NodeType]**
The compile-time `macro` object provides direct access to BlackCoffee `node` classes. You can use these to test if an argument node has some specific type, or to programatically generate nodes. Node types and their constructor arguments can be found in the compiler sources, in `nodes.coffee`.

```CoffeeScript
macro something (arg) ->
	if arg instanceof macro.Bool
		@someting()
	else
		@somethingElse()
macro debug (args...) ->
	if @debugging
		new macro.Call(new macro.Literal("debugImpl"), args)
```

**macro.walk(node,visitor)**
For each of `node`s (recursive) child nodes, call `visitor(child)`. In case the visitor returns a BlackCoffee node, that node is used to replace the original child. If `false` is returned, the child is removed (or replaced by undefined if it cannot be removed). Otherwise, the original child is left unmodified.

```CoffeeScript
macro delegateArithmetic (func) ->
    operators =
        '+': 'add'
        '-': 'sub'
        '*': 'mult'
    macro.walk func.body, (node) ->
        if node instanceof macro.Op and (op = operators[node.operator])
            macro.csToNode("(a).#{op}(b)").subst {a: node.first, b: node.second}

# Next, we'd have to define the `add/sub/mult` methods for the types that we'll
# be working with in a `delegateArithmetic` section.
Array::add = (other) -> 42 # do something smart here instead
Number::sub = (other) -> -42
# etc...

# So, now this uses regular javascript operators:
eq 7, 3+4
eq "3,45,6", [3,4]+[5,6]

delegateArithmetic ->
    # And this uses the arithmetic methods defined on the prototypes:
    eq [3,4,5], [1,2,3]+2  
    eq 20, [1,2,3]*[2,3,4]
    eq [1,0,1], [3,2,4]-[2,0,3]
    eq 9, 3*3
```


blackcoffee cli
===============

This version of CoffeeScript comes with the usual `bin/coffee` compiler/runner/repl, adapted to work with macros. You may choose to use the additional `bin/blackcoffee` compiler instead, as it allows for compilation of multiple source files to one target. This is especially useful if you want to prefix each script with a set of common macro definitions.

Syntax: `bin/blackcoffee [-o OUTFILE_JS] [-m OUTFILE_SRCMAP] [-f KEY[=VAL]]... [--] [INFILE]...`

I think these options are pretty much self evident, except for `-f`, which can be used to set key/values on the `flags` object available in the compile-time context. This allows you to specify any sort of build options in your build script, which you can then use in your macros.

Example:
```sh
bin/blackcoffee -o test.js -m test.srcMap -f dev macros.coffee test.coffee
```
macros.coffee:
```CoffeeScript
macro LOG (str) ->
	macro.codeToNode(->console.log x).subst {x: str} if flags.dev
```
test.coffee:
```CoffeeScript
# We can use macros defined in the other file here. The following will
# compile to nothing, unless the '-f dev' flag is specified at compile time:
LOG "Hello developers!"
```

