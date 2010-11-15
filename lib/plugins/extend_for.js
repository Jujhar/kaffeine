var Token = require("../token");
module.exports = function(stream) {
  
  stream.each(function() {
    if(this.keyword && this.text == "for") { 
      var text = "",
          brace = this.next,
          skip = false,
          toks = [], var2, var1, loopWord,
          complex
          
      var closingBracket = brace.matchingBracket

      brace.next.find(function() {      
        if(this.next == closingBracket) return true
        if(this.semi) { skip = true; return true }
        if(this.word && (this.text == "in" || this.text == "of") ) loopWord = this
        if(this.round) complex = true
        toks.push(this)
      })
      
      var var1 = toks[0]
      if(toks[1].op == ",") var2 = toks[2]
      if(skip) return closingBracket.next
      
      if(complex) {
        loopWord.next.next.cacheExpression()
      }

      var expressionText = loopWord.next.next.collectText(closingBracket.prev)          
      var iter, val
      var closure = this.findClosure()
      
      function wrapSingleLineBlock() {
        if(!this.block) {
          var pair = Token.bracket.pair("{}")
          closingBracket.after(" ").after(pair.L)
          var nl = 2
          var indent = brace.indent()
          
          var next = pair.L.nextNW()
          if(next.block) {
            var tok = next.block.matchingBracket
            if(tok.next.whitespace)
              tok = tok.next
          }
          else if(next.bracelessBlock) {
            var tok = next.bracelessBlock.end
            if(tok.next.whitespace)
              tok = tok.next
          }
          else {
            var tok = closingBracket.find(function() {
              if(this.newline) nl--
              if(nl == 0) return true
            })
          }
          
          tok.after(pair.R)
          if(indent)
            pair.R.before(indent)
          pair.R.after("\n")
          pair.L.updateBlock()
        }
      }

      if(loopWord.text == "in") { 
        if(!var2) return // nothing to do !
        wrapSingleLineBlock.call(this)
        var2.prev.remove(var2) 
        iter = var1.text
        val = var2.text
        closure.vars[iter] = true
        closure.vars[val] = true
        
      } else {
        wrapSingleLineBlock.call(this)
        brace.next.remove(closingBracket.prev)
        iter = var2 ? var2.text : closure.getUnusedVar()
        
        val = var1.text
        closure.vars[iter] = true
        closure.vars[val] = true
        
        var string = iter + " = 0; " + iter + " < " + expressionText + ".length; " + iter + "++"
        brace.after(string)          
        
      }
      
      var text = "\n  " + this.indent() + val + " = " + (complex ? "_xpr" : expressionText) + "[" + iter + "];"
            
      this.block.after(text)
     
      return 
    }
  })
}




