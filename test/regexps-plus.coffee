# Regexps Plus
# ------------

test "=~ operator", ->
  m = '3-4' =~ /^\d+-(\d+)$/
  ok \& is '3-4'
  ok \1 is '4'
  ok m is \~
  ok m[0] is \~[0]
  ok m[1] is \1

