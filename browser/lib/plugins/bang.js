require.module('./plugins/bang', function(module, exports, require) {
// start module: plugins/bang

var Token = require("../token");

module.exports = function(stream) {
  stream.each(function(token) {

    if(!token.bang) return    
    
    var lbracket = token.next
    
    var func = token.expressionStart()
    
    var indent = token.indent()
    
    var vars = ""
    if(func.prev.assign) {
      var e = func.prev.prev
      var s = e.expressionStart()
      vars = s.remove(e).collectText()
      func.prev.remove()
    }
    
    var rbracket = lbracket.matchingBracket
    
    var start_fn = rbracket.next
    var end_fn = start_fn.find(function() {
      if(this.lbracket) return this.matchingBracket.next
      if(this.rbracket) return true
    })
    
    var body = start_fn.remove(end_fn.prev)
        body = body.collectText()
    body = body.replace(/\n/g, "\n  ")
    if(!body.match(/\n$/))
      body += "\n"
    body += indent
    
    body = body.replace(/\s*\n( *)$/, function(a, b) { 
      return "\n" + b;
    })
    
    var text = "function(" + vars + ") {"  + body + "}"
    if(lbracket.next != rbracket)
      text = ", " + text
    
    rbracket.before(text)
    if(!rbracket.next.newline)
      rbracket.after("\n")
    //token.bang = false
    token.text = token.text.slice(0,token.text.length-1)
    return token.next
  })
}


// end module: plugins/bang
});