# Symbols
# -------

test "symbols", ->
  # Symbol style
  eq :one, 'one'
  eq :one-two, 'one-two'
  eq :one\ two, 'one two'
  eq :one\\two, 'one\\two'
  eq :中文测试, '中文测试'
