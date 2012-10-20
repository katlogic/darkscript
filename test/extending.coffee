# Extending
# -------

test "extending", ->
  a = {}
  a.{a: 'a', b: 'b', c: 'c'}
  eq a.a, 'a'
  eq a.b, 'b'
  eq a.c, 'c'

test "returned extending", ->
  a = {}
  b = 2
  c = 3
  a_ref = a.{b, c}
  eq a_ref.b, 2
  eq a_ref.c, 3

test "nested extending", ->
  a = {}
  b = {}
  a.{b: b.{a: 'a'}}
  eq a.b.a, 'a'
  eq b.a, 'a'

test "nested extending 2", ->
  a = {}
  a.
    b: 3
    c: ->
      'c'
    d: (e, f) ->
      'g'
  eq a.c(), 'c'


