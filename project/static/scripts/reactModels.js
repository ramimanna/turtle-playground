var CodeForm = React.createClass({
  outf: function(text) {
    // output functions are configurable.  This one just appends some text
    // to a pre element.
    var mypre = document.getElementById(this.props.canvasID);
    mypre.innerHTML = mypre.innerHTML + text;
  },
  builtinRead: function(x) {
    if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
    throw "File not found: '" + x + "'";
    return Sk.builtinFiles["files"][x];
  },

  runit: function(){
    // Here's everything you need to run a python program in skulpt
    // grab the code from your textarea
    // get a reference to your pre element for output
    // configure the output function
    // call Sk.importMainWithBody()

    console.log("RUN IT!");

    var prog = document.getElementById(this.props.codeID).value; 
    var mypre = document.getElementById(this.props.outputID); 
    mypre.innerHTML = ''; 
    Sk.pre = this.props.outputID;
    Sk.configure({output:this.outf, read:this.builtinRead}); 
    (Sk.TurtleGraphics || (Sk.TurtleGraphics = {})).target = this.props.canvasID;
    var myPromise = Sk.misceval.asyncToPromise(function() {
       return Sk.importMainWithBody("<stdin>", false, prog, true);
    });
    myPromise.then(function(mod) {
       console.log('success');
    },
       function(err) {
       console.log(err.toString());
    }); 
  },
  handleSubmit: function(e){
    e.preventDefault();
    this.runit();
  },
  render: function(){
    return(
      <form onSubmit={this.handleSubmit}> 
        <textarea id={this.props.codeID} cols="40" rows="10">

        </textarea><br /> 
      <button type="submit">Run</button> 
      </form> 
    );
  }
});





if(!window.react){
  window.react = {};
}

window.react.CodeForm = CodeForm;