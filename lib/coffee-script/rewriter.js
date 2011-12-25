(function() {
  var ASYNC_END, ASYNC_START, BALANCED_PAIRS, EXPRESSION_CLOSE, EXPRESSION_END, EXPRESSION_START, IDENT, IMPLICIT_BLOCK, IMPLICIT_CALL, IMPLICIT_END, IMPLICIT_FUNC, IMPLICIT_UNSPACED_CALL, INVERSES, LINE, LINEBREAKS, PARENS_END, PARENS_START, POP_IDENT, SINGLE_CLOSERS, SINGLE_LINERS, TAG, VALUE, left, rite, _i, _len, _ref,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = Array.prototype.slice;

  exports.Rewriter = (function() {

    Rewriter.name = 'Rewriter';

    function Rewriter() {}

    Rewriter.prototype.rewrite = function(tokens) {
      this.tokens = tokens;
      this.rewriteAsyncCondition();
      this.removeLeadingNewlines();
      this.removeMidExpressionNewlines();
      this.closeOpenCalls();
      this.closeOpenIndexes();
      this.addImplicitIndentation();
      this.tagPostfixConditionals();
      this.addImplicitBraces();
      this.addImplicitParentheses();
      this.rewriteAsynchronous();
      this.extend();
      return this.tokens;
    };

    Rewriter.prototype.scanTokens = function(block) {
      var i, token, tokens;
      tokens = this.tokens;
      i = 0;
      while (token = tokens[i]) {
        i += block.call(this, token, i, tokens);
      }
      return true;
    };

    Rewriter.prototype.detectEnd = function(i, condition, action) {
      var levels, token, tokens, _ref, _ref2;
      tokens = this.tokens;
      levels = 0;
      while (token = tokens[i]) {
        if (levels === 0 && condition.call(this, token, i)) {
          return action.call(this, token, i);
        }
        if (!token || levels < 0) return action.call(this, token, i - 1);
        if (_ref = token[0], __indexOf.call(EXPRESSION_START, _ref) >= 0) {
          levels += 1;
        } else if (_ref2 = token[0], __indexOf.call(EXPRESSION_END, _ref2) >= 0) {
          levels -= 1;
        }
        i += 1;
      }
      return i - 1;
    };

    Rewriter.prototype.removeLeadingNewlines = function() {
      var i, tag, _i, _len, _ref;
      _ref = this.tokens;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        tag = _ref[i][0];
        if (tag !== 'TERMINATOR') break;
      }
      if (i) return this.tokens.splice(0, i);
    };

    Rewriter.prototype.removeMidExpressionNewlines = function() {
      return this.scanTokens(function(token, i, tokens) {
        var _ref;
        if (!(token[0] === 'TERMINATOR' && (_ref = this.tag(i + 1), __indexOf.call(EXPRESSION_CLOSE, _ref) >= 0))) {
          return 1;
        }
        tokens.splice(i, 1);
        return 0;
      });
    };

    Rewriter.prototype.closeOpenCalls = function() {
      var action, condition;
      condition = function(token, i) {
        var _ref;
        return ((_ref = token[0]) === ')' || _ref === 'CALL_END') || token[0] === 'OUTDENT' && this.tag(i - 1) === ')';
      };
      action = function(token, i) {
        return this.tokens[token[0] === 'OUTDENT' ? i - 1 : i][0] = 'CALL_END';
      };
      return this.scanTokens(function(token, i) {
        if (token[0] === 'CALL_START') this.detectEnd(i + 1, condition, action);
        return 1;
      });
    };

    Rewriter.prototype.closeOpenIndexes = function() {
      var action, condition;
      condition = function(token, i) {
        var _ref;
        return (_ref = token[0]) === ']' || _ref === 'INDEX_END';
      };
      action = function(token, i) {
        return token[0] = 'INDEX_END';
      };
      return this.scanTokens(function(token, i) {
        if (token[0] === 'INDEX_START') this.detectEnd(i + 1, condition, action);
        return 1;
      });
    };

    Rewriter.prototype.addImplicitBraces = function() {
      var action, condition, sameLine, stack, start, startIndent, startsLine;
      stack = [];
      start = null;
      startsLine = null;
      sameLine = true;
      startIndent = 0;
      condition = function(token, i) {
        var one, tag, three, two, _ref, _ref2;
        _ref = this.tokens.slice(i + 1, (i + 3) + 1 || 9e9), one = _ref[0], two = _ref[1], three = _ref[2];
        if ('HERECOMMENT' === (one != null ? one[0] : void 0)) return false;
        tag = token[0];
        if (__indexOf.call(LINEBREAKS, tag) >= 0) sameLine = false;
        return (((tag === 'TERMINATOR' || tag === 'OUTDENT') || (__indexOf.call(IMPLICIT_END, tag) >= 0 && sameLine)) && ((!startsLine && this.tag(i - 1) !== ',') || !((two != null ? two[0] : void 0) === ':' || (one != null ? one[0] : void 0) === '@' && (three != null ? three[0] : void 0) === ':'))) || (tag === ',' && one && ((_ref2 = one[0]) !== 'IDENTIFIER' && _ref2 !== 'NUMBER' && _ref2 !== 'STRING' && _ref2 !== '@' && _ref2 !== 'TERMINATOR' && _ref2 !== 'OUTDENT'));
      };
      action = function(token, i) {
        var tok;
        tok = this.generate('}', '}', token[2]);
        return this.tokens.splice(i, 0, tok);
      };
      return this.scanTokens(function(token, i, tokens) {
        var ago, idx, prevTag, tag, tok, value, _ref, _ref2;
        if (_ref = (tag = token[0]), __indexOf.call(EXPRESSION_START, _ref) >= 0) {
          stack.push([(tag === 'INDENT' && this.tag(i - 1) === '{' ? '{' : tag), i]);
          return 1;
        }
        if (__indexOf.call(EXPRESSION_END, tag) >= 0) {
          start = stack.pop();
          return 1;
        }
        if (!(tag === ':' && ((ago = this.tag(i - 2)) === ':' || ((_ref2 = stack[stack.length - 1]) != null ? _ref2[0] : void 0) !== '{'))) {
          return 1;
        }
        sameLine = true;
        stack.push(['{']);
        idx = ago === '@' ? i - 2 : i - 1;
        while (this.tag(idx - 2) === 'HERECOMMENT') {
          idx -= 2;
        }
        prevTag = this.tag(idx - 1);
        startsLine = !prevTag || (__indexOf.call(LINEBREAKS, prevTag) >= 0) || prevTag === '.';
        value = new String('{');
        value.generated = true;
        tok = this.generate('{', value, token[2]);
        tokens.splice(idx, 0, tok);
        this.detectEnd(i + 2, condition, action);
        return 2;
      });
    };

    Rewriter.prototype.addImplicitParentheses = function() {
      var action, condition, noCall, seenControl, seenSingle;
      noCall = seenSingle = seenControl = false;
      condition = function(token, i) {
        var post, tag, _ref, _ref2;
        tag = token[0];
        if (!seenSingle && token.fromThen) return true;
        if (tag === 'IF' || tag === 'ELSE' || tag === 'CATCH' || tag === '->' || tag === '=>' || tag === 'CLASS') {
          seenSingle = true;
        }
        if (tag === 'IF' || tag === 'ELSE' || tag === 'SWITCH' || tag === 'TRY' || tag === '=') {
          seenControl = true;
        }
        if ((tag === '.' || tag === '?.' || tag === '::') && this.tag(i - 1) === 'OUTDENT') {
          return true;
        }
        return !token.generated && this.tag(i - 1) !== ',' && (__indexOf.call(IMPLICIT_END, tag) >= 0 || (tag === 'INDENT' && !seenControl)) && (tag !== 'INDENT' || (((_ref = this.tag(i - 2)) !== 'CLASS' && _ref !== 'EXTENDS') && (_ref2 = this.tag(i - 1), __indexOf.call(IMPLICIT_BLOCK, _ref2) < 0) && !((post = this.tokens[i + 1]) && post.generated && post[0] === '{')));
      };
      action = function(token, i) {
        return this.tokens.splice(i, 0, this.generate('CALL_END', ')', token[2]));
      };
      return this.scanTokens(function(token, i, tokens) {
        var callObject, current, next, prev, tag, _ref, _ref2, _ref3;
        tag = token[0];
        if (tag === 'CLASS' || tag === 'IF') noCall = true;
        _ref = tokens.slice(i - 1, (i + 1) + 1 || 9e9), prev = _ref[0], current = _ref[1], next = _ref[2];
        callObject = !noCall && tag === 'INDENT' && next && next.generated && next[0] === '{' && prev && (_ref2 = prev[0], __indexOf.call(IMPLICIT_FUNC, _ref2) >= 0);
        seenSingle = false;
        seenControl = false;
        if (__indexOf.call(LINEBREAKS, tag) >= 0) noCall = false;
        if (prev && !prev.spaced && tag === '?') token.call = true;
        if (token.fromThen) return 1;
        if (!(callObject || (prev != null ? prev.spaced : void 0) && (prev.call || (_ref3 = prev[0], __indexOf.call(IMPLICIT_FUNC, _ref3) >= 0)) && (__indexOf.call(IMPLICIT_CALL, tag) >= 0 || !(token.spaced || token.newLine) && __indexOf.call(IMPLICIT_UNSPACED_CALL, tag) >= 0))) {
          return 1;
        }
        tokens.splice(i, 0, this.generate('CALL_START', '(', token[2]));
        this.detectEnd(i + 1, condition, action);
        if (prev[0] === '?') prev[0] = 'FUNC_EXIST';
        return 2;
      });
    };

    Rewriter.prototype.addImplicitIndentation = function() {
      var action, condition, indent, outdent, starter;
      starter = indent = outdent = null;
      condition = function(token, i) {
        var _ref;
        return token[1] !== ';' && (_ref = token[0], __indexOf.call(SINGLE_CLOSERS, _ref) >= 0) && !(token[0] === 'ELSE' && (starter !== 'IF' && starter !== 'THEN'));
      };
      action = function(token, i) {
        return this.tokens.splice((this.tag(i - 1) === ',' ? i - 1 : i), 0, outdent);
      };
      return this.scanTokens(function(token, i, tokens) {
        var tag, _ref, _ref2;
        tag = token[0];
        if (tag === 'TERMINATOR' && this.tag(i + 1) === 'THEN') {
          tokens.splice(i, 1);
          return 0;
        }
        if (tag === 'ELSE' && this.tag(i - 1) !== 'OUTDENT') {
          tokens.splice.apply(tokens, [i, 0].concat(__slice.call(this.indentation(token))));
          return 2;
        }
        if (tag === 'CATCH' && ((_ref = this.tag(i + 2)) === 'OUTDENT' || _ref === 'TERMINATOR' || _ref === 'FINALLY')) {
          tokens.splice.apply(tokens, [i + 2, 0].concat(__slice.call(this.indentation(token))));
          return 4;
        }
        if (__indexOf.call(SINGLE_LINERS, tag) >= 0 && this.tag(i + 1) !== 'INDENT' && !(tag === 'ELSE' && this.tag(i + 1) === 'IF')) {
          starter = tag;
          _ref2 = this.indentation(token, true), indent = _ref2[0], outdent = _ref2[1];
          if (starter === 'THEN') indent.fromThen = true;
          tokens.splice(i + 1, 0, indent);
          this.detectEnd(i + 2, condition, action);
          if (tag === 'THEN') tokens.splice(i, 1);
          return 1;
        }
        return 1;
      });
    };

    Rewriter.prototype.tagPostfixConditionals = function() {
      var action, condition, original;
      original = null;
      condition = function(token, i) {
        var _ref;
        return (_ref = token[0]) === 'TERMINATOR' || _ref === 'INDENT';
      };
      action = function(token, i) {
        if (token[0] !== 'INDENT' || (token.generated && !token.fromThen)) {
          return original[0] = 'POST_' + original[0];
        }
      };
      return this.scanTokens(function(token, i) {
        if (token[0] !== 'IF') return 1;
        original = token;
        this.detectEnd(i + 1, condition, action);
        return 1;
      });
    };

    Rewriter.prototype.toffeeHelpers = function() {
      var getTag, getToken, popBlockTokens, popBlockTokensUntil, popCaller, popTokensUntil, shiftBlockTokens, shiftBlockTokensUntil, shiftConditionBlock, shiftNextBlock, shiftNextBlockGreedy, shiftParam, shiftTokensUntil, smartPush, tag,
        _this = this;
      shiftTokensUntil = function(tokens, condition) {
        var result, token;
        result = [];
        while (token = tokens.shift()) {
          result.push(token);
          if (condition(token)) break;
        }
        return result;
      };
      popTokensUntil = function(tokens, condition) {
        var result, token;
        result = [];
        while (token = tokens.pop()) {
          result.unshift(token);
          if (condition(token)) break;
        }
        return result;
      };
      shiftBlockTokensUntil = function(tokens, condition, grab) {
        var found, level, result;
        if (grab == null) grab = true;
        level = 0;
        found = false;
        result = shiftTokensUntil(tokens, function(token) {
          var name, tag;
          tag = token[TAG];
          name = token[VALUE];
          if (ASYNC_END[tag]) --level;
          if (level < 0) return found = true;
          if (ASYNC_START[tag]) ++level;
          return found = condition(token) && level === 0;
        });
        if (found && !grab) tokens.unshift(result.pop());
        return result;
      };
      popBlockTokensUntil = function(tokens, condition, grab) {
        var found, level, result;
        if (grab == null) grab = true;
        level = 0;
        found = false;
        result = popTokensUntil(tokens, function(token) {
          var name, tag;
          tag = token[TAG];
          name = token[VALUE];
          if (ASYNC_START[tag]) --level;
          if (level < 0) return found = true;
          if (ASYNC_END[tag]) ++level;
          return found = condition(token) && level === 0;
        });
        if (found && !grab) tokens.push(result.shift());
        return result;
      };
      shiftBlockTokens = function(tokens, keys, grab) {
        var result;
        if (grab == null) grab = true;
        if (typeof keys === 'string') keys = [keys];
        return result = shiftBlockTokensUntil(tokens, function(token) {
          var found, _ref;
          return found = (_ref = token[TAG], __indexOf.call(keys, _ref) >= 0);
        }, grab);
      };
      popBlockTokens = function(tokens, keys, grab) {
        if (grab == null) grab = true;
        if (typeof keys === 'string') keys = [keys];
        return popBlockTokensUntil(tokens, function(token) {
          var found, _ref;
          return found = (_ref = token[TAG], __indexOf.call(keys, _ref) >= 0);
        }, grab);
      };
      shiftConditionBlock = function(tokens) {
        return shiftBlockTokensUntil(tokens, function(token) {
          return token[TAG] === 'OUTDENT';
        });
      };
      shiftNextBlock = function(tokens) {
        return shiftBlockTokensUntil(tokens, function(token) {
          return ASYNC_END[token[TAG]];
        });
      };
      shiftNextBlockGreedy = function(tokens) {
        return shiftBlockTokensUntil(tokens, function(token) {
          return false;
        }, false);
      };
      shiftParam = function(tokens) {
        var found, result;
        found = false;
        result = shiftBlockTokensUntil(tokens, function(token) {
          var _ref;
          return found = (_ref = token[TAG]) === ',' || _ref === 'TERMINATOR';
        });
        if (found) tokens.unshift(result.pop());
        return result;
      };
      tag = function(tokens, idx) {
        if (idx == null) idx = -1;
        if (idx < 0) idx += tokens.length;
        if ((0 <= idx && idx < tokens.length)) {
          return tokens[idx][TAG];
        } else {
          return null;
        }
      };
      smartPush = function() {
        var args, dest, token, tokens, _i, _j, _len, _len2;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        dest = args.shift();
        for (_i = 0, _len = args.length; _i < _len; _i++) {
          tokens = args[_i];
          if (tokens.length) {
            if (tokens[0].substr) {
              dest.push(tokens);
            } else {
              for (_j = 0, _len2 = tokens.length; _j < _len2; _j++) {
                token = tokens[_j];
                dest.push(token);
              }
            }
          }
        }
        return _this;
      };
      getToken = function(tokens, n) {
        if (n == null) n = -1;
        if (n < 0) n += tokens.length;
        if ((0 <= n && n < tokens.length)) {
          return tokens[n];
        } else {
          return null;
        }
      };
      popCaller = function(tokens) {
        var caller, level, token;
        caller = [];
        level = 0;
        while (token = getToken(tokens)) {
          tag = token[TAG];
          if (!IDENT[tag] && level === 0) break;
          if (PARENS_END[tag]) ++level;
          if (PARENS_START[tag]) --level;
          tokens.pop();
          caller.unshift(token);
        }
        return caller;
      };
      getTag = tag;
      return {
        shiftTokensUntil: shiftTokensUntil,
        shiftConditionBlock: shiftConditionBlock,
        shiftNextBlock: shiftNextBlock,
        shiftParam: shiftParam,
        shiftBlockTokens: shiftBlockTokens,
        shiftNextBlockGreedy: shiftNextBlockGreedy,
        popBlockTokensUntil: popBlockTokensUntil,
        tag: tag,
        getTag: getTag,
        getToken: getToken,
        popCaller: popCaller,
        smartPush: smartPush
      };
    };

    Rewriter.prototype.asyncFunctions = function(stack, async_tokens) {
      var closeCallback, getAsync, getTag, getToken, line, openCallback, popCaller, popParams, pushTokens, raise, setLine,
        _this = this;
      line = 0;
      getToken = function(n) {
        if (n == null) n = -1;
        if (n < 0) n += async_tokens.length;
        if ((0 <= n && n < async_tokens.length)) {
          return async_tokens[n];
        } else {
          return null;
        }
      };
      getTag = function(n) {
        var token;
        if (n == null) n = -1;
        if (token = getToken(n)) {
          return token[0];
        } else {
          return null;
        }
      };
      getAsync = function(token) {
        var m;
        if (token[TAG] === 'IDENTIFIER' && (m = token[VALUE].match(/(.*)!$/))) {
          return m[1];
        } else {
          return null;
        }
      };
      popCaller = function() {
        var caller, level, tag, token;
        caller = [];
        level = 0;
        while (token = getToken()) {
          tag = token[TAG];
          if (!IDENT[tag] && level === 0) break;
          if (PARENS_END[tag]) ++level;
          if (PARENS_START[tag]) --level;
          async_tokens.pop();
          caller.unshift(token);
        }
        return caller;
      };
      popParams = function() {
        var level, params, tag, token;
        params = [];
        level = 0;
        if (getTag() === ']') {
          while (token = getToken()) {
            tag = token[TAG];
            if (PARENS_START[tag]) ++level;
            if (PARENS_END[tag]) --level;
            async_tokens.pop();
            params.unshift(token);
            if (level === 0) break;
          }
          params;

        } else {
          while (token = getToken()) {
            tag = token[TAG];
            if (!(IDENT[tag] || tag === ',')) break;
            async_tokens.pop();
            params.unshift(token);
          }
          params;

        }
        return params;
      };
      pushTokens = function(tokens) {
        var token, _i, _len;
        for (_i = 0, _len = tokens.length; _i < _len; _i++) {
          token = tokens[_i];
          async_tokens.push(token);
        }
        return _this;
      };
      openCallback = function(params) {
        var assignment, async_id, comma, i, ident, ident_name, is_ident, len, level, new_ident, param, param_blocks, push_param, replacement, replacements, tag, _i, _j, _k, _len, _len2, _ref;
        if (params.length && params[0][0] === '[') {
          params[0] = ['PARAM_START', '(', line];
          params[params.length - 1] = ['PARAM_END', ')', line];
        } else {
          params.unshift(['PARAM_START', '(', line]);
          params.push(['PARAM_END', ')', line]);
        }
        if (getTag() !== 'CALL_START') async_tokens.push([',', ',', line]);
        params = params.slice(1, params.length - 1);
        param_blocks = [];
        assignment = [];
        param = comma;
        ident = [];
        level = 0;
        is_ident = true;
        push_param = function() {
          var param, param_block, _i, _len;
          param_block = [];
          param_block.push(ident);
          for (_i = 0, _len = assignment.length; _i < _len; _i++) {
            param = assignment[_i];
            param_block.push(param);
          }
          if (comma) param_block.push(comma);
          return param_blocks.push(param_block);
        };
        while (param = params.shift()) {
          tag = param[TAG];
          if (PARENS_END[tag]) ++level;
          if (PARENS_START[tag]) --level;
          if (level === 0) {
            if (tag === ',') {
              comma = param;
              push_param();
              comma = null;
              ident = [];
              assignment = [];
              is_ident = true;
            } else {
              if (!IDENT[tag]) is_ident = false;
              if (is_ident) {
                ident.push(param);
              } else {
                assignment.push(param);
              }
            }
          }
        }
        if (ident.length) push_param();
        params = param_blocks;
        replacements = [];
        async_tokens.push(['PARAM_START', '(', line]);
        async_id = 0;
        for (_i = 0, _len = params.length; _i < _len; _i++) {
          param = params[_i];
          len = param[0].length;
          ident_name = '';
          for (i = _j = _ref = len - 1; _ref <= 0 ? _j <= 0 : _j >= 0; i = _ref <= 0 ? ++_j : --_j) {
            if (param[0][i][0] === 'IDENTIFIER') ident_name = param[0][i][1];
          }
          new_ident = ['IDENTIFIER', '_$$_' + ident_name, line];
          replacements.push([new_ident, param[0]]);
          param[0] = new_ident;
          pushTokens(param);
        }
        async_tokens.push(['PARAM_END', ')', line]);
        async_tokens.push(['=>', '=>', line]);
        async_tokens.push(['INDENT', 2, line]);
        for (_k = 0, _len2 = replacements.length; _k < _len2; _k++) {
          replacement = replacements[_k];
          pushTokens(replacement[1]);
          pushTokens([['=', '=']]);
          pushTokens([replacement[0], ['TERMINATOR', "\n"]]);
        }
        return _this;
      };
      closeCallback = function() {
        var status;
        status = stack.pop();
        if (status === 'PARAM_END') {
          if (getTag() === 'TERMINATOR') async_tokens.pop();
          async_tokens.push(['OUTDENT', 2, line]);
          async_tokens.push(['CALL_END', ')', line]);
          return true;
        } else {
          stack.push(status);
          return false;
        }
      };
      setLine = function(new_line) {
        return line = new_line;
      };
      raise = function(message) {
        throw new Error("Parse error on line " + line + ": Async " + message);
      };
      return {
        TAG: TAG,
        VALUE: VALUE,
        LINE: LINE,
        PARENS_START: PARENS_START,
        PARENS_END: PARENS_END,
        IDENT: IDENT,
        ASYNC_START: ASYNC_START,
        ASYNC_END: ASYNC_END,
        getToken: getToken,
        getTag: getTag,
        getAsync: getAsync,
        popCaller: popCaller,
        popParams: popParams,
        pushTokens: pushTokens,
        openCallback: openCallback,
        closeCallback: closeCallback,
        raise: raise,
        setLine: setLine
      };
    };

    Rewriter.prototype.async_id = function() {
      if (this.async_id_num == null) this.async_id_num = 0;
      return "_asfn" + this.async_id_num++;
    };

    Rewriter.prototype.rewriteAsyncCondition = function() {
      var async_tokens, call_func, condition, func_name, getAsync, line, name, next, next_tokens, old_tokens, outdent, shiftConditionBlock, shiftNextBlockGreedy, shiftTokensUntil, smartPush, stack, tag, token, _ref;
      stack = [];
      async_tokens = [];
      line = 0;
      getAsync = this.asyncFunctions().getAsync;
      _ref = this.toffeeHelpers(), shiftTokensUntil = _ref.shiftTokensUntil, shiftConditionBlock = _ref.shiftConditionBlock, shiftNextBlockGreedy = _ref.shiftNextBlockGreedy, tag = _ref.tag, smartPush = _ref.smartPush;
      while (token = this.tokens.shift()) {
        line = token[LINE];
        if ((name = getAsync(token)) && (name === 'if' || name === 'unless')) {
          token[VALUE] = name;
          token[TAG] = 'IF';
          condition = shiftConditionBlock(this.tokens);
          next = shiftNextBlockGreedy(this.tokens);
          old_tokens = this.tokens;
          this.tokens = next;
          this.rewriteAsyncCondition();
          next = this.tokens;
          this.tokens = old_tokens;
          condition.unshift(token);
          func_name = this.async_id();
          next_tokens = [["IDENTIFIER", func_name, line], ["=", "=", line], ["=>", "=>", line], ["INDENT", 2, line]];
          if (tag(next, 0) === 'TERMINATOR') next.shift();
          if (tag(next, -1) === 'TERMINATOR') next.pop();
          smartPush(next_tokens, next, ["OUTDENT", 2, line], ["TERMINATOR", "\n", line]);
          call_func = [["TERMINATOR", "\n", line], ["IDENTIFIER", func_name, line], ["CALL_START", "(", line], [')', ')', line]];
          outdent = condition.pop();
          smartPush(condition, call_func, outdent);
          old_tokens = this.tokens;
          this.tokens = condition;
          this.rewriteAsyncCondition();
          condition = this.tokens;
          this.tokens = old_tokens;
          smartPush(async_tokens, next_tokens, condition, ['ELSE', 'else', line], ["INDENT", 2, line], call_func, ["OUTDENT", 2, line]);
        } else {
          async_tokens.push(token);
        }
      }
      return this.tokens = async_tokens;
    };

    Rewriter.prototype.rewriteAsynchronous = function() {
      var async_tokens, caller, closeCallback, getAsync, getTag, getToken, line, name, openCallback, params, popCaller, popParams, pushTokens, raise, setLine, stack, status, tag, token, _ref;
      stack = [];
      async_tokens = [];
      line = 0;
      _ref = this.asyncFunctions(stack, async_tokens), getToken = _ref.getToken, getTag = _ref.getTag, getAsync = _ref.getAsync, popCaller = _ref.popCaller, popParams = _ref.popParams, pushTokens = _ref.pushTokens, openCallback = _ref.openCallback, closeCallback = _ref.closeCallback, raise = _ref.raise, setLine = _ref.setLine;
      while (token = this.tokens.shift()) {
        line = setLine(token[LINE]);
        if (name = getAsync(token)) {
          async_tokens.push(token);
          token[VALUE] = name;
          caller = popCaller();
          if (getTag() === '=') {
            async_tokens.pop();
            params = popParams();
          } else {
            params = [];
          }
          pushTokens(caller);
          stack.push(params);
          stack.push('PARAM_START');
          if (this.tokens[0] && this.tokens[0][0] === 'CALL_START') {
            this.tokens.shift();
          } else {
            this.tokens.unshift(['CALL_END', ')', line]);
          }
          async_tokens.push(['CALL_START', '(', line]);
        } else {
          tag = token[TAG];
          if (tag === 'IDENTIFIER' && token[VALUE] === '__async_end') {
            tag = 'ASYNC_END';
          }
          if (ASYNC_END[tag]) {
            while (closeCallback()) {
              continue;
            }
            status = stack.pop();
            if (status === 'PARAM_START') {
              params = stack.pop();
              openCallback(params);
              stack.push('PARAM_END');
              continue;
            }
          }
          if (ASYNC_START[tag]) stack.push(tag);
          switch (tag) {
            case 'TERMINATOR':
              if (getTag() !== 'INDENT') async_tokens.push(token);
              break;
            case 'ASYNC_END':
              break;
            default:
              async_tokens.push(token);
          }
        }
      }
      while (closeCallback()) {
        continue;
      }
      return this.tokens = async_tokens;
    };

    Rewriter.prototype.new_caller_id = function() {
      if (this.caller_id_num == null) this.caller_id_num = 0;
      return "_asid" + this.caller_id_num++;
    };

    Rewriter.prototype.extend = function(force_complex) {
      var LINE, TAG, VALUE, caller, colon, comma, complex, getTag, getToken, key, lineno, new_caller, new_params, new_tokens, old_tokens, param, params, popBlockTokensUntil, popCaller, shiftBlockTokens, shiftNextBlock, shiftParam, smartPush, token, value, _i, _j, _len, _len2, _ref, _ref2;
      if (force_complex == null) force_complex = false;
      TAG = 0;
      VALUE = 1;
      LINE = 2;
      new_tokens = [];
      _ref = this.toffeeHelpers(), smartPush = _ref.smartPush, getTag = _ref.getTag, getToken = _ref.getToken, popCaller = _ref.popCaller, shiftNextBlock = _ref.shiftNextBlock, shiftParam = _ref.shiftParam, shiftBlockTokens = _ref.shiftBlockTokens, popBlockTokensUntil = _ref.popBlockTokensUntil;
      while (token = this.tokens[0]) {
        if (token[0] === '{' && getTag(new_tokens) === '.') {
          params = shiftNextBlock(this.tokens);
          comma = new_tokens.pop();
          caller = popBlockTokensUntil(new_tokens, function(token) {
            return !POP_IDENT[token[TAG]];
          }, false);
          if (force_complex && new_tokens.length === 0) {
            complex = true;
          } else if (new_tokens.length === 0 || ((_ref2 = getTag(new_tokens)) === 'TERMINATOR' || _ref2 === 'INDENT')) {
            complex = false;
          } else {
            complex = true;
          }
          lineno = token[LINE];
          params.pop();
          params.shift();
          if (getTag(params, 0) === 'INDENT') {
            params.pop();
            params.shift();
          }
          new_params = [];
          while (params.length) {
            key = shiftBlockTokens(params, [',', ':'], false);
            colon = params.shift();
            if (colon && colon[TAG] === ':') {
              value = shiftParam(params);
              comma = params.shift();
            } else {
              comma = colon;
              colon = [':', ':', key[TAG]];
              value = [key[TAG], key[VALUE], key[LINE]];
            }
            old_tokens = this.tokens;
            this.tokens = value;
            this.extend(true);
            value = this.tokens;
            this.tokens = old_tokens;
            new_params.push([key, value]);
          }
          if (complex) {
            smartPush(new_tokens, ['IDENTIFIER', '__ts_extend', lineno], ['CALL_START', '(', lineno], caller, [',', ',', lineno]);
            for (_i = 0, _len = new_params.length; _i < _len; _i++) {
              param = new_params[_i];
              key = param[0], value = param[1];
              if (key.length === 1) key = key[0];
              if (key[TAG] === 'IDENTIFIER') {
                key = ['STRING', JSON.stringify(key[VALUE]), key[LINE]];
              }
              smartPush(new_tokens, key, [',', ',', key[LINE]], value, [',', ',', key[LINE]]);
            }
            new_tokens.pop();
            smartPush(new_tokens, ['CALL_END', ')', lineno]);
          } else {
            if (caller.length > 1 && new_params.length > 1) {
              lineno = caller[0][LINE];
              new_caller = ['IDENTIFIER', this.new_caller_id(), lineno];
              smartPush(new_tokens, new_caller, ['=', '=', lineno], caller, ['TERMINATOR', "\n", lineno]);
              caller = new_caller;
            }
            for (_j = 0, _len2 = new_params.length; _j < _len2; _j++) {
              param = new_params[_j];
              key = param[0], value = param[1];
              lineno = key[LINE];
              if (key.length === 1 && key[0][TAG] === 'IDENTIFIER') {
                key = [['.', '.', lineno], key[0]];
              } else {
                key.unshift(['INDEX_START', '[', lineno]);
                key.push(['INDEX_END', ']', lineno]);
              }
              smartPush(new_tokens, caller, key, ['=', '=', lineno], value, ['TERMINATOR', "\n", lineno]);
            }
          }
        } else {
          new_tokens.push(this.tokens.shift());
        }
      }
      return this.tokens = new_tokens;
    };

    Rewriter.prototype.indentation = function(token, implicit) {
      var indent, outdent;
      if (implicit == null) implicit = false;
      indent = ['INDENT', 2, token[2]];
      outdent = ['OUTDENT', 2, token[2]];
      if (implicit) indent.generated = outdent.generated = true;
      return [indent, outdent];
    };

    Rewriter.prototype.generate = function(tag, value, line) {
      var tok;
      tok = [tag, value, line];
      tok.generated = true;
      return tok;
    };

    Rewriter.prototype.tag = function(i) {
      var _ref;
      return (_ref = this.tokens[i]) != null ? _ref[0] : void 0;
    };

    return Rewriter;

  })();

  BALANCED_PAIRS = [['(', ')'], ['[', ']'], ['{', '}'], ['INDENT', 'OUTDENT'], ['CALL_START', 'CALL_END'], ['PARAM_START', 'PARAM_END'], ['INDEX_START', 'INDEX_END']];

  exports.INVERSES = INVERSES = {};

  EXPRESSION_START = [];

  EXPRESSION_END = [];

  for (_i = 0, _len = BALANCED_PAIRS.length; _i < _len; _i++) {
    _ref = BALANCED_PAIRS[_i], left = _ref[0], rite = _ref[1];
    EXPRESSION_START.push(INVERSES[rite] = left);
    EXPRESSION_END.push(INVERSES[left] = rite);
  }

  EXPRESSION_CLOSE = ['CATCH', 'WHEN', 'ELSE', 'FINALLY'].concat(EXPRESSION_END);

  IMPLICIT_FUNC = ['IDENTIFIER', 'SUPER', ')', 'CALL_END', ']', 'INDEX_END', '@', 'THIS'];

  IMPLICIT_CALL = ['IDENTIFIER', 'NUMBER', 'STRING', 'JS', 'REGEX', 'NEW', 'PARAM_START', 'CLASS', 'IF', 'TRY', 'SWITCH', 'THIS', 'BOOL', 'UNARY', 'SUPER', '@', '->', '=>', '[', '(', '{', '--', '++'];

  IMPLICIT_UNSPACED_CALL = ['+', '-'];

  IMPLICIT_BLOCK = ['->', '=>', '{', '[', ','];

  IMPLICIT_END = ['POST_IF', 'FOR', 'WHILE', 'UNTIL', 'WHEN', 'BY', 'LOOP', 'TERMINATOR'];

  SINGLE_LINERS = ['ELSE', '->', '=>', 'TRY', 'FINALLY', 'THEN'];

  SINGLE_CLOSERS = ['TERMINATOR', 'CATCH', 'FINALLY', 'ELSE', 'OUTDENT', 'LEADING_WHEN'];

  LINEBREAKS = ['TERMINATOR', 'INDENT', 'OUTDENT'];

  PARENS_START = {
    '[': '[',
    '(': '(',
    'CALL_START': 'CALL_START',
    '{': '{',
    'INDEX_START': 'INDEX_START'
  };

  PARENS_END = {
    ']': ']',
    ')': ')',
    'CALL_END': 'CALL_END',
    '}': '}',
    'INDEX_END': 'INDEX_END'
  };

  IDENT = {
    'IDENTIFIER': 'IDENTIFIER',
    '.': '.',
    '?.': '?.',
    '::': '::',
    '@': '@'
  };

  POP_IDENT = {
    'IDENTIFIER': 'IDENTIFIER',
    '.': '.',
    '?.': '?.',
    '::': '::',
    '@': '@',
    '[': '[',
    '(': '(',
    '{': '{',
    'CALL_START': 'CALL_START',
    'INDENT': 'INDENT',
    'INDEX_START': 'INDEX_START'
  };

  ASYNC_START = {
    '[': '[',
    '(': '(',
    '{': '{',
    'CALL_START': 'CALL_START',
    'INDENT': 'INDENT',
    'INDEX_START': 'INDEX_START'
  };

  ASYNC_END = {
    ']': ']',
    ')': ')',
    '}': '}',
    'CALL_END': 'CALL_END',
    'OUTDENT': 'OUTDENT',
    'INDEX_END': 'INDEX_END',
    'ASYNC_END': 'ASYNC_END'
  };

  TAG = 0;

  VALUE = 1;

  LINE = 2;

}).call(this);
