Darkscript
==========

Darkscript is a fork of ToffeeScript and BlackCoffee, both of which
are CoffeeScript dialects. Darkscript attempts to follow bleeding
edge CoffeeScript (1.7.x) and is currently in experimental shape.

Overview of goals
-----------------

Compiler-assisted coroutines ("asynchronous grammar") and hygienic macros.
Additionally, small syntactic extensions are introduced:

* =~ regexp operator (from ToffeeScript)
* !-> and !=> functions mark no implicit return (from Coco)

Coroutines (from ToffeeScript)
==============================
Javascript offers asynchronicity only in form of callbacks (promises are still callbacks too). To prevent
scoping hell, it is possible to simulate true coroutines in Darkscript:

```CoffeeScript
http = require 'http'
req = http.get! host:'www.google.com', path:'/'
data = req.on! 'data'
console.log data.toString()
```

The ! after function value denotes that code which follows will be actually a calback:

```Javascript
// Generated by ToffeeScript 1.7.1
(function() {
  var data, http, req,
    _this = this;

  http = require('http');

  http.get({
    host: 'www.google.com',
    path: '/'
  }, function() {
    req = arguments[0];
    req.on('data', function() {
      data = arguments[0];
      return console.log(data.toString());
    });
  });

}).call(this);
```

More documentation TBD. TS async is not yet fully ported to 1.7.x.

Macros (from BlackCoffee)
=========================

One-time macro calls
--------------------

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
-----------------------

When the `macro` keyword is followed by an identifier and then a closure, it's a definition. Every time the identifier is used as a closure call later on in the program, the closure call is replaced by the result of a compile-time call to the defined macro. Arguments to the macro are passed to the compile-time closure as BlackCoffee nodes.

<<<<<<< HEAD
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
=======
```shell
git clone https://github.com/jashkenas/coffeescript.git
sudo coffeescript/bin/cake install
>>>>>>> cs
```

Helper functions
----------------

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

<<<<<<< HEAD
```CoffeeScript
macro -> macro.fileToNode 'includeMe.coffee'
# or
macro include (fn) -> macro.fileToNode @myPathSearcher(fn+'.coffee')
include 'includeMe'
```
=======
To suggest a feature or report a bug: http://github.com/jashkenas/coffeescript/issues
>>>>>>> cs

**macro.codeToNode(closure)**
Takes a closure (function), and returns its body as a node. So the closure itself is *not* part of the node. Note that `codeToNode` is the only helper function that is not actually a function. It's a predefined macro. It needs to be, because it needs to capture the node of its argument instead of the value.

<<<<<<< HEAD
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
------------------

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

blacktoffee cli
---------------

This version of CoffeeScript comes with the usual `bin/coffee` compiler/runner/repl, adapted to work with macros. You may choose to use the additional `bin/blacktoffee` compiler instead, as it allows for compilation of multiple source files to one target. This is especially useful if you want to prefix each script with a set of common macro definitions.

Syntax: `bin/blacktoffee [-o OUTFILE_JS] [-m OUTFILE_SRCMAP] [-f KEY[=VAL]]... [--] [INFILE]...`

I think these options are pretty much self evident, except for `-f`, which can be used to set key/values on the `flags` object available in the compile-time context. This allows you to specify any sort of build options in your build script, which you can then use in your macros.

Example:
```sh
bin/blacktoffee -o test.js -m test.srcMap -f dev macros.coffee test.coffee
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

=======
The source repository: https://github.com/jashkenas/coffeescript.git

Our lovely and talented contributors are listed here: http://github.com/jashkenas/coffeescript/contributors
>>>>>>> cs
