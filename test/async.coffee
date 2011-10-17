test 'async generate', ->
  foo_0_1 = ->
  foo_0_2 = ->
  foo_1_0 = ->
  foo_1_1 = ->
  foo_1_2 = ->
  foo_2_0 = ->
  foo_2_1 = ->
  foo_2_2 = ->
  va = foo_0_1!()
  [va, vb] = foo_0_2!()

  foo_1_0! 'pa'
  va = foo_1_1! 'pa'
  [va, vb] = foo_1_2! 'pa'

  foo_2_0! 'pa', 'pb'
  va = foo_2_1! 'pa', 'pb'
  [va, vb] = foo_2_2! 'pa', 'pb'

  if true
    foo_2_2!
  else
    b = foo_2_1!
    b = []

test 'async caculate', ->
  fa = (n) ->
    1 + n
  fb = (n) ->
    2 + n
  fc = (n) ->
    3 + n

  a = fa!(0)
  b = fb!(a)
  c = fc!(b)
  eq c, 6

test 'async object', ->
  class F
    a: (n) ->
      1 + n
    b: (n) ->
      2 + n
    @c: (n) ->
      3 + n

  f = new F()
  a = f.a!(0)
  b = f.b!(a)
  c = f::c!(b)
  eq c, 6
