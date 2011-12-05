# The CoffeeScript language has a good deal of optional syntax, implicit syntax,
# and shorthand syntax. This can greatly complicate a grammar and bloat
# the resulting parse table. Instead of making the parser handle it all, we take
# a series of passes over the token stream, using this **Rewriter** to convert
# shorthand into the unambiguous long form, add implicit indentation and
# parentheses, and generally clean things up.

# The **Rewriter** class is used by the [Lexer](lexer.html), directly against
# its internal array of tokens.
class exports.Rewriter

  # Helpful snippet for debugging:
  #     console.log (t[0] + '/' + t[1] for t in @tokens).join ' '

  # Rewrite the token stream in multiple passes, one logical filter at
  # a time. This could certainly be changed into a single pass through the
  # stream, with a big ol' efficient switch, but it's much nicer to work with
  # like this. The order of these passes matters -- indentation must be
  # corrected before implicit parentheses can be wrapped around blocks of code.
  rewrite: (@tokens) ->
    @rewriteAsyncCondition()
    @removeLeadingNewlines()
    @removeMidExpressionNewlines()
    @closeOpenCalls()
    @closeOpenIndexes()
    @addImplicitIndentation()
    @tagPostfixConditionals()
    @addImplicitBraces()
    @addImplicitParentheses()
    @rewriteAsynchronous()
    @cascade()
    @tokens

  # Rewrite the token stream, looking one token ahead and behind.
  # Allow the return value of the block to tell us how many tokens to move
  # forwards (or backwards) in the stream, to make sure we don't miss anything
  # as tokens are inserted and removed, and the stream changes length under
  # our feet.
  scanTokens: (block) ->
    {tokens} = this
    i = 0
    i += block.call this, token, i, tokens while token = tokens[i]
    true

  detectEnd: (i, condition, action) ->
    {tokens} = this
    levels = 0
    while token = tokens[i]
      return action.call this, token, i     if levels is 0 and condition.call this, token, i
      return action.call this, token, i - 1 if not token or levels < 0
      if token[0] in EXPRESSION_START
        levels += 1
      else if token[0] in EXPRESSION_END
        levels -= 1
      i += 1
    i - 1

  # Leading newlines would introduce an ambiguity in the grammar, so we
  # dispatch them here.
  removeLeadingNewlines: ->
    break for [tag], i in @tokens when tag isnt 'TERMINATOR'
    @tokens.splice 0, i if i

  # Some blocks occur in the middle of expressions -- when we're expecting
  # this, remove their trailing newlines.
  removeMidExpressionNewlines: ->
    @scanTokens (token, i, tokens) ->
      return 1 unless token[0] is 'TERMINATOR' and @tag(i + 1) in EXPRESSION_CLOSE
      tokens.splice i, 1
      0

  # The lexer has tagged the opening parenthesis of a method call. Match it with
  # its paired close. We have the mis-nested outdent case included here for
  # calls that close on the same line, just before their outdent.
  closeOpenCalls: ->
    condition = (token, i) ->
      token[0] in [')', 'CALL_END'] or
      token[0] is 'OUTDENT' and @tag(i - 1) is ')'
    action = (token, i) ->
      @tokens[if token[0] is 'OUTDENT' then i - 1 else i][0] = 'CALL_END'
    @scanTokens (token, i) ->
      @detectEnd i + 1, condition, action if token[0] is 'CALL_START'
      1

  # The lexer has tagged the opening parenthesis of an indexing operation call.
  # Match it with its paired close.
  closeOpenIndexes: ->
    condition = (token, i) -> token[0] in [']', 'INDEX_END']
    action    = (token, i) -> token[0] = 'INDEX_END'
    @scanTokens (token, i) ->
      @detectEnd i + 1, condition, action if token[0] is 'INDEX_START'
      1

  # Object literals may be written with implicit braces, for simple cases.
  # Insert the missing braces here, so that the parser doesn't have to.
  addImplicitBraces: ->
    stack       = []
    start       = null
    startIndent = 0
    condition = (token, i) ->
      [one, two, three] = @tokens[i + 1 .. i + 3]
      return false if 'HERECOMMENT' is one?[0]
      [tag] = token
      (tag in ['TERMINATOR', 'OUTDENT'] and
        not (two?[0] is ':' or one?[0] is '@' and three?[0] is ':')) or
        (tag is ',' and one and
          one[0] not in ['IDENTIFIER', 'NUMBER', 'STRING', '@', 'TERMINATOR', 'OUTDENT'])
    action = (token, i) ->
      tok = ['}', '}', token[2]]
      tok.generated = yes
      @tokens.splice i, 0, tok
    @scanTokens (token, i, tokens) ->
      if (tag = token[0]) in EXPRESSION_START
        stack.push [(if tag is 'INDENT' and @tag(i - 1) is '{' then '{' else tag), i]
        return 1
      if tag in EXPRESSION_END
        start = stack.pop()
        return 1
      return 1 unless tag is ':' and
        ((ago = @tag i - 2) is ':' or stack[stack.length - 1]?[0] isnt '{')
      stack.push ['{']
      idx =  if ago is '@' then i - 2 else i - 1
      idx -= 2 while @tag(idx - 2) is 'HERECOMMENT'
      value = new String('{')
      value.generated = yes
      tok = ['{', value, token[2]]
      tok.generated = yes
      tokens.splice idx, 0, tok
      @detectEnd i + 2, condition, action
      2

  # Methods may be optionally called without parentheses, for simple cases.
  # Insert the implicit parentheses here, so that the parser doesn't have to
  # deal with them.
  addImplicitParentheses: ->
    noCall = no
    action = (token, i) -> @tokens.splice i, 0, ['CALL_END', ')', token[2]]
    @scanTokens (token, i, tokens) ->
      tag     = token[0]
      noCall  = yes if tag in ['CLASS', 'IF']
      [prev, current, next] = tokens[i - 1 .. i + 1]
      callObject  = not noCall and tag is 'INDENT' and
                    next and next.generated and next[0] is '{' and
                    prev and prev[0] in IMPLICIT_FUNC
      seenSingle  = no
      seenControl = no
      noCall      = no if tag in LINEBREAKS
      token.call  = yes if prev and not prev.spaced and tag is '?'
      return 1 if token.fromThen
      return 1 unless callObject or
        prev?.spaced and (prev.call or prev[0] in IMPLICIT_FUNC) and
        (tag in IMPLICIT_CALL or not (token.spaced or token.newLine) and tag in IMPLICIT_UNSPACED_CALL)
      tokens.splice i, 0, ['CALL_START', '(', token[2]]
      @detectEnd i + 1, (token, i) ->
        [tag] = token
        return yes if not seenSingle and token.fromThen
        seenSingle  = yes if tag in ['IF', 'ELSE', 'CATCH', '->', '=>']
        seenControl = yes if tag in ['IF', 'ELSE', 'SWITCH', 'TRY']
        return yes if tag in ['.', '?.', '::'] and @tag(i - 1) is 'OUTDENT'
        not token.generated and @tag(i - 1) isnt ',' and (tag in IMPLICIT_END or
        (tag is 'INDENT' and not seenControl)) and
        (tag isnt 'INDENT' or
         (@tag(i - 2) isnt 'CLASS' and @tag(i - 1) not in IMPLICIT_BLOCK and
          not ((post = @tokens[i + 1]) and post.generated and post[0] is '{')))
      , action
      prev[0] = 'FUNC_EXIST' if prev[0] is '?'
      2

  # Because our grammar is LALR(1), it can't handle some single-line
  # expressions that lack ending delimiters. The **Rewriter** adds the implicit
  # blocks, so it doesn't need to. ')' can close a single-line block,
  # but we need to make sure it's balanced.
  addImplicitIndentation: ->
    @scanTokens (token, i, tokens) ->
      [tag] = token
      if tag is 'TERMINATOR' and @tag(i + 1) is 'THEN'
        tokens.splice i, 1
        return 0
      if tag is 'ELSE' and @tag(i - 1) isnt 'OUTDENT'
        tokens.splice i, 0, @indentation(token)...
        return 2
      if tag is 'CATCH' and @tag(i + 2) in ['OUTDENT', 'TERMINATOR', 'FINALLY']
        tokens.splice i + 2, 0, @indentation(token)...
        return 4
      if tag in SINGLE_LINERS and @tag(i + 1) isnt 'INDENT' and
         not (tag is 'ELSE' and @tag(i + 1) is 'IF')
        starter = tag
        [indent, outdent] = @indentation token
        indent.fromThen   = true if starter is 'THEN'
        indent.generated  = outdent.generated = true
        tokens.splice i + 1, 0, indent
        condition = (token, i) ->
          token[1] isnt ';' and token[0] in SINGLE_CLOSERS and
          not (token[0] is 'ELSE' and starter not in ['IF', 'THEN'])
        action = (token, i) ->
          @tokens.splice (if @tag(i - 1) is ',' then i - 1 else i), 0, outdent
        @detectEnd i + 2, condition, action
        tokens.splice i, 1 if tag is 'THEN'
        return 1
      return 1

  # Tag postfix conditionals as such, so that we can parse them with a
  # different precedence.
  tagPostfixConditionals: ->
    condition = (token, i) -> token[0] in ['TERMINATOR', 'INDENT']
    @scanTokens (token, i) ->
      return 1 unless token[0] is 'IF'
      original = token
      @detectEnd i + 1, condition, (token, i) ->
        original[0] = 'POST_' + original[0] if token[0] isnt 'INDENT'
      1


  toffeeHelpers: ->
    # shift from tokens until condition is true
    # the result contains the all shifted tokens with the same order
    shiftTokensUntil = (tokens, condition) =>
      result = []
      while token = tokens.shift()
        result.push token
        if condition(token)
          break
      result

    popTokensUntil = (tokens, condition) =>
      result = []
      while token = tokens.pop()
        result.unshift token
        if condition(token)
          break
      result

    shiftBlockTokensUntil = (tokens, condition, grab=true) =>
      level = 0
      found = false
      result = shiftTokensUntil tokens, (token) =>
        tag = token[TAG]
        name = token[VALUE]
        --level if ASYNC_END[tag]
        return found = true if level < 0
        ++level if ASYNC_START[tag]
        found = condition(token) and level is 0

      if found and !grab
        tokens.unshift result.pop()
      result

    popBlockTokensUntil = (tokens, condition, grab=true) =>
      level = 0
      found = false
      result = popTokensUntil tokens, (token) =>
        tag = token[TAG]
        name = token[VALUE]
        --level if ASYNC_START[tag]
        return found = true if level < 0
        ++level if ASYNC_END[tag]
        found = condition(token) and level is 0

      if found and !grab
        tokens.push result.shift()
      result

    shiftBlockTokens = (tokens, keys, grab = true) =>
      if typeof keys is 'string'
        keys = [keys]

      result = shiftBlockTokensUntil tokens, (token) =>
        found = token[TAG] in keys
      , grab

    popBlockTokens = (tokens, keys, grab = true) =>
      if typeof keys is 'string'
        keys = [keys]

      popBlockTokensUntil tokens, (token) =>
        found = token[TAG] in keys
      , grab

    # shift until met OUTDENT
    shiftConditionBlock = (tokens) =>
      shiftBlockTokensUntil tokens, (token) =>
        token[TAG] is 'OUTDENT'

    # shift a block such as {...}, [...]
    shiftNextBlock = (tokens) =>
      shiftBlockTokensUntil tokens, (token) =>
        ASYNC_END[token[TAG]]

    shiftParam = (tokens) =>
      found = false
      result = shiftBlockTokensUntil tokens, (token) =>
        found = token[TAG] in [',', 'TERMINATOR']
      tokens.unshift result.pop() if found
      result

    # get tag in tokens
    tag = (tokens, idx = -1) ->
      idx += tokens.length if idx < 0
      if 0 <= idx < tokens.length
        tokens[idx][TAG]
      else
        null

    # if args[0] is array  then push tokens
    # if args[0] is string then push token
    smartPush = (args...) =>
      dest = args.shift()
      for tokens in args
        if tokens.length
          if tokens[0].substr
            dest.push tokens
          else
            dest.push token for token in tokens
      @

    getToken = (tokens, n = -1) =>
      n += tokens.length if n < 0 
      if 0 <= n < tokens.length
        tokens[n]
      else
        null

    # pop caller from tokens
    popCaller = (tokens)=>
      caller = []
      level  = 0
      while token = getToken(tokens)
        tag = token[TAG]
        break   if !IDENT[tag] and level is 0
        ++level if PARENS_END[tag]
        --level if PARENS_START[tag]
        tokens.pop()
        caller.unshift token
      caller

    getTag = tag
    {
      shiftTokensUntil, shiftConditionBlock, shiftNextBlock, shiftParam, shiftBlockTokens,
      popBlockTokensUntil,
      tag, getTag, getToken, popCaller,
      smartPush
    }

  asyncFunctions: (stack, async_tokens) ->

    line  = 0

    getToken = (n = -1) =>
      n += async_tokens.length if n < 0 
      if 0 <= n < async_tokens.length
        async_tokens[n]
      else
        null

    getTag = (n = -1)=>
      if token = getToken(n)
        token[0]
      else
        null

    getAsync = (token) =>
      if token[TAG] is 'IDENTIFIER' and m = token[VALUE].match /(.*)!$/
        m[1]
      else
        null

    popCaller = =>
      caller = []
      level  = 0
      while token = getToken()
        tag = token[TAG]
        break   if !IDENT[tag] and level is 0
        ++level if PARENS_END[tag]
        --level if PARENS_START[tag]
        async_tokens.pop()
        caller.unshift token
      caller

    popParams = =>
      params = []
      level  = 0
      if getTag() is ']'
        while token = getToken()
          tag = token[TAG]
          ++level if PARENS_START[tag]
          --level if PARENS_END[tag]
          async_tokens.pop()
          params.unshift token
          break   if level == 0
        params
      else
        while token = getToken()
          tag = token[TAG]
          break unless IDENT[tag] or tag is ','
          async_tokens.pop()
          params.unshift token
        params
      params

    pushTokens = (tokens)=>
      for token in tokens
        async_tokens.push token
      @

    openCallback  = (params) =>
      if params.length and params[0][0] is '['
        # Multi parameters
        params[0]                 = ['PARAM_START', '(', line]
        params[params.length - 1] = ['PARAM_END',   ')', line]
      else
        params.unshift ['PARAM_START', '(', line]
        params.push    ['PARAM_END',   ')', line]

      if getTag() isnt 'CALL_START'
        async_tokens.push [',', ',', line]

      #pushTokens params

      # replace identifier name to template name
      # assign template to identifier name
      # to make any 

      params = params.slice(1, params.length-1)

      # extract params to
      # [
      #   [identifier, assignment, ...]
      #   ...
      # ]
      param_blocks =[]
      assignment = []
      param = comma
      ident = []
      level = 0
      is_ident = true
      push_param = ->
        param_block = []
        param_block.push ident
        param_block.push param for param in assignment
        param_block.push comma if comma
        param_blocks.push param_block
      while param = params.shift()
        tag = param[TAG]
        ++level if PARENS_END[tag]
        --level if PARENS_START[tag]
        if level is 0
          if tag is ','
            comma = param
            push_param()
            comma = null
            ident = []
            assignment = []
            is_ident = true
          else
            unless IDENT[tag]
              is_ident = false
            if is_ident
              ident.push param
            else
              assignment.push param
      push_param() if ident.length
      params = param_blocks

      replacements = []
      async_tokens.push ['PARAM_START', '(', line]
      async_id = 0
      for param in params
        new_ident = ['IDENTIFIER', '_asp' + async_id++ , line]
        replacements.push [new_ident, param[0]]
        param[0] = new_ident
        pushTokens param

      async_tokens.push ['PARAM_END',   ')', line]

      async_tokens.push ['=>', '=>', line]
      async_tokens.push ['INDENT', 2, line]
      for replacement in replacements
        pushTokens replacement[1]
        pushTokens  [
          ['=', '='],
        ]
        pushTokens [
          replacement[0],
          ['TERMINATOR', "\n"]
        ]
      @

    closeCallback = =>
      status = stack.pop()
      if status is 'PARAM_END'
        async_tokens.pop() if getTag() is 'TERMINATOR'
        async_tokens.push ['OUTDENT',  2,   line]
        async_tokens.push ['CALL_END', ')', line]
        true
      else
        stack.push status
        false

    setLine = (new_line) =>
      line = new_line

    raise = (message) =>
      throw new Error("Parse error on line #{line}: Async #{message}")

    {
      TAG, VALUE, LINE, PARENS_START, PARENS_END, IDENT, ASYNC_START, ASYNC_END,
      getToken, getTag, getAsync, 
      popCaller, popParams, pushTokens, openCallback, closeCallback,
      raise, setLine
    }

  async_id: ->
    @async_id_num = 0 unless @async_id_num?
    "_asfn" + @async_id_num++


  rewriteAsyncCondition: ->
    stack        = []
    async_tokens = []
    line         = 0

    {getAsync} = @asyncFunctions()
    {shiftTokensUntil, shiftConditionBlock, shiftNextBlock, tag, smartPush} = @toffeeHelpers()

    while token = @tokens.shift()
      line = token[LINE]
      if (name = getAsync token) and name in ['if', 'unless']
        token[VALUE] = name
        token[TAG]   = 'IF'

        condition = shiftConditionBlock(@tokens)
        next      = shiftNextBlock(@tokens)
        old_tokens = @tokens
        @tokens = next
        @rewriteAsyncCondition()
        next = @tokens
        @tokens = old_tokens
        condition.unshift token
        func_name = @async_id()

        next_tokens = [
          ["IDENTIFIER", func_name, line],
          ["=", "=", line]
          ["=>", "=>", line],
          ["INDENT", 2, line],
        ]

        next.shift() if tag(next, 0) is 'TERMINATOR'
        next.pop()   if tag(next, -1) is 'TERMINATOR'
        smartPush next_tokens,
          next,
          ["OUTDENT", 2, line],
          ["TERMINATOR", "\n", line]

        call_func = [
          ["TERMINATOR", "\n", line]
          ["IDENTIFIER", func_name, line],
          ["CALL_START", "(", line],
          [')', ')', line]
        ]

        outdent = condition.pop()
        smartPush condition,
          call_func
          outdent

        smartPush async_tokens,
          next_tokens,
          condition,
          ['ELSE', 'else', line], 
          ["INDENT", 2, line],
          call_func,
          ["OUTDENT", 2, line]
      else
        async_tokens.push token

    @tokens = async_tokens

  rewriteAsynchronous: ->
    stack        = []
    async_tokens = []
    line         = 0

    {
      getToken, getTag, getAsync, 
      popCaller, popParams, pushTokens, openCallback, closeCallback,
      raise, setLine
    } = @asyncFunctions(stack, async_tokens)

    while token = @tokens.shift()
      line = setLine(token[LINE])
      if name = getAsync token
        async_tokens.push token
        token[VALUE] = name
        caller = popCaller()
        if getTag() is '='
          # async has parameters
          # remove '=' which is unnesscary
          async_tokens.pop()
          params = popParams()
        else
          params = []
        pushTokens caller
        stack.push params
        stack.push 'PARAM_START'

        # async always a function
        if @tokens[0] and @tokens[0][0] is 'CALL_START'
          @tokens.shift()
        else
          @tokens.unshift ['CALL_END',   ')', line]
        async_tokens.push ['CALL_START', '(', line]
      else
        tag = token[TAG]
        # Modify __asnyc_end
        if tag is 'IDENTIFIER' and token[VALUE] is '__async_end'
          tag = 'ASYNC_END'

        if ASYNC_END[tag]
            continue while closeCallback()
            status = stack.pop()
            if status is 'PARAM_START'
              # insert the callback
              # CALL_END will be moved to another CALL_END, OUTDENT or ASYNC_END
              params = stack.pop()
              openCallback(params)
              stack.push 'PARAM_END'
              continue

        if ASYNC_START[tag]
          stack.push tag

        switch tag
          when 'TERMINATOR'
            if getTag() isnt 'INDENT'
              async_tokens.push token
          when 'ASYNC_END'
            # ignore ASYNC_END
          else
            async_tokens.push token

    continue while closeCallback()
    @tokens = async_tokens

  
  # Cascade
  new_caller_id: ->
    @caller_id_num = 0 unless @caller_id_num?
    "_asid" + @caller_id_num++

  cascade: (force_complex = false)->
    TAG  = 0
    VALUE = 1
    LINE = 2
    new_tokens = []
    {smartPush, getTag, getToken, popCaller, shiftNextBlock, shiftParam, shiftBlockTokens, popBlockTokensUntil} = @toffeeHelpers()
    while token = @tokens[TAG]
      if token[0] is '{' and getTag(new_tokens) is '.'
        params =  shiftNextBlock(@tokens)
        comma = new_tokens.pop()
        caller = popBlockTokensUntil new_tokens, (token)->
          !POP_IDENT[token[TAG]]
        , false
        if force_complex and new_tokens.length == 0
          complex = true
        else if new_tokens.length == 0 || getTag(new_tokens) in ['TERMINATOR', 'INDENT']
          complex = false
        else
          complex = true

        lineno = token[LINE]
        # remone '{' and '}'
        params.pop()
        params.shift()

        if getTag(params, 0) is 'INDENT'
          params.pop()
          params.shift()

        new_params = []
        while params.length
          key = shiftBlockTokens params, [',', ':'], false
          colon = params.shift()
          if colon and colon[TAG] is ':'
            value = shiftParam(params)
            comma = params.shift()
          else
            comma = colon
            colon = [':', ':', key[TAG]]
            value = [key[TAG], key[VALUE], key[LINE]]

          old_tokens = @tokens
          @tokens    = value
          @cascade(true)
          value      = @tokens
          @tokens    = old_tokens

          new_params.push [key, value]

        if complex
          smartPush new_tokens, 
            ['IDENTIFIER', '__cascade', lineno],
            ['CALL_START', '(', lineno],
            caller,
            [',', ',', lineno],

          for param in new_params
            [key, value] = param
            # convert IDENTIFIER to String use for cascading
            if key.length is 1
              key = key[0]
            if key[TAG] is 'IDENTIFIER'
              key = [ 'STRING',JSON.stringify(key[VALUE]), key[LINE] ]

            smartPush new_tokens,
              key,
              [',', ',', key[LINE]],
              value
              [',', ',', key[LINE]],

          # remove last ','
          new_tokens.pop()
          smartPush new_tokens,
            ['CALL_END', ')', lineno]

        else
          # the caller is complex expression
          if caller.length > 1 and new_params.length > 1
            lineno = caller[0][LINE]
            new_caller = ['IDENTIFIER', @new_caller_id(), lineno]
            smartPush new_tokens,
              new_caller,
              ['=', '=', lineno],
              caller,
              ['TERMINATOR', "\n", lineno]
            caller = new_caller

          for param in new_params
            [key, value] = param
            lineno = key[LINE]
            if key.length == 1 and key[0][TAG] is 'IDENTIFIER'
              key = [
                ['.', '.', lineno],
                key[0]
              ]
            else
              # the key is complex use [...] instead of .
              key.unshift ['INDEX_START', '[', lineno]
              key.push ['INDEX_END', ']', lineno]

            smartPush new_tokens,
              caller,
              key,
              ['=', '=', lineno],
              value,
              ['TERMINATOR', "\n", lineno]

      else
        new_tokens.push @tokens.shift()

    @tokens = new_tokens


  # Generate the indentation tokens, based on another token on the same line.
  indentation: (token) ->
    [['INDENT', 2, token[2]], ['OUTDENT', 2, token[2]]]

  # Look up a tag by token index.
  tag: (i) -> @tokens[i]?[0]

# Constants
# ---------

# List of the token pairs that must be balanced.
BALANCED_PAIRS = [
  ['(', ')']
  ['[', ']']
  ['{', '}']
  ['INDENT', 'OUTDENT'],
  ['CALL_START', 'CALL_END']
  ['PARAM_START', 'PARAM_END']
  ['INDEX_START', 'INDEX_END']
]

# The inverse mappings of `BALANCED_PAIRS` we're trying to fix up, so we can
# look things up from either end.
exports.INVERSES = INVERSES = {}

# The tokens that signal the start/end of a balanced pair.
EXPRESSION_START = []
EXPRESSION_END   = []

for [left, rite] in BALANCED_PAIRS
  EXPRESSION_START.push INVERSES[rite] = left
  EXPRESSION_END  .push INVERSES[left] = rite

# Tokens that indicate the close of a clause of an expression.
EXPRESSION_CLOSE = ['CATCH', 'WHEN', 'ELSE', 'FINALLY'].concat EXPRESSION_END

# Tokens that, if followed by an `IMPLICIT_CALL`, indicate a function invocation.
IMPLICIT_FUNC    = ['IDENTIFIER', 'SUPER', ')', 'CALL_END', ']', 'INDEX_END', '@', 'THIS']

# If preceded by an `IMPLICIT_FUNC`, indicates a function invocation.
IMPLICIT_CALL    = [
  'IDENTIFIER', 'NUMBER', 'STRING', 'JS', 'REGEX', 'NEW', 'PARAM_START', 'CLASS'
  'IF', 'TRY', 'SWITCH', 'THIS', 'BOOL', 'UNARY', 'SUPER'
  '@', '->', '=>', '[', '(', '{', '--', '++'
]

IMPLICIT_UNSPACED_CALL = ['+', '-']

# Tokens indicating that the implicit call must enclose a block of expressions.
IMPLICIT_BLOCK   = ['->', '=>', '{', '[', ',']

# Tokens that always mark the end of an implicit call for single-liners.
IMPLICIT_END     = ['POST_IF', 'FOR', 'WHILE', 'UNTIL', 'WHEN', 'BY', 'LOOP', 'TERMINATOR']

# Single-line flavors of block expressions that have unclosed endings.
# The grammar can't disambiguate them, so we insert the implicit indentation.
SINGLE_LINERS    = ['ELSE', '->', '=>', 'TRY', 'FINALLY', 'THEN']
SINGLE_CLOSERS   = ['TERMINATOR', 'CATCH', 'FINALLY', 'ELSE', 'OUTDENT', 'LEADING_WHEN']

# Tokens that end a line.
LINEBREAKS       = ['TERMINATOR', 'INDENT', 'OUTDENT']


PARENS_START = {'[', '(', 'CALL_START', '{', 'INDEX_START'}
PARENS_END   = {']', ')', 'CALL_END',   '}', 'INDEX_END'}
IDENT        = {'IDENTIFIER', '.', '?.', '::', '@'}
# ident use for greedy pop
POP_IDENT = {'IDENTIFIER', '.', '?.', '::', '@', '[', '(', '{', 'CALL_START', 'INDENT',  'INDEX_START'}
ASYNC_START  = {'[', '(', '{', 'CALL_START', 'INDENT',  'INDEX_START'}
ASYNC_END    = {']', ')', '}', 'CALL_END',   'OUTDENT', 'INDEX_END', 'ASYNC_END'}

TAG   = 0
VALUE = 1
LINE  = 2
