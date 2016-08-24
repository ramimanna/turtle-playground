var PythonEditor = React.createClass({
  componentDidMount: function(){
    this.editor = CodeMirror.fromTextArea(
      this.refs.textarea,
      {
        lineNumbers:true,
        mode: 'python',
        autofocus: true        
      }
    );
  },
  setValue: function(val){
    this.editor.getDoc().setValue(val);
    this.editor.execCommand("goDocEnd");
  },
  getValue: function(){
    return this.editor.getValue().trim();
  },
  render: function(){
    return (
      <textarea cols="40" rows="10" ref='textarea'/>
    );
  }
});

var PythonOutput = React.createClass({
  propTypes: {
    canvasID : React.PropTypes.string
  },
  getDefaultProps: function () {
    return { canvasID: "canvas" };
  },
  outf: function(text) {
    // output functions are configurable.  This one just appends some text
    // to a pre element.
    this.refs.pre.innerHTML += text;
  },

  builtinRead: function(x) {
    if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
      throw "File not found: '" + x + "'";
    return Sk.builtinFiles["files"][x];
  },

  runit: function(paddedCode){
    // Here's everything you need to run a python program in skulpt
    // grab the code from your textarea
    // get a reference to your pre element for output
    // configure the output function
    // call Sk.importMainWithBody()

    console.log("RUN IT!");

    var prog = paddedCode;
    console.log("prog",prog);

    this.refs.pre.innerHTML = ''; 
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
  render: function(){
    return(
      <div>
        <pre ref="pre"> </pre>
        <canvas id={this.props.canvasID}></canvas>
      </div>
    );
  },
  componentDidMount: function(){
    this.runit(this.props.code);
  },
});

var PlayerBox = React.createClass({
  getInitialState: function(){
    return({role: undefined, message: ""});
  },
  setRole: function(role){
    this.setState({role:role});
  },
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

  runit: function(paddedCode){
    // Here's everything you need to run a python program in skulpt
    // grab the code from your textarea
    // get a reference to your pre element for output
    // configure the output function
    // call Sk.importMainWithBody()

    console.log("RUN IT!");

    // var prog = document.getElementById("yourcode").value;
    var prog = paddedCode;
    console.log("prog",prog);
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

  handleCodeSubmit: function(e){
    e.preventDefault();
    var code = this.refs.editor.getValue();
    if (!code || ! this.props.playerID) {
      return;
    }
    var turnData = {code:code, id: this.props.playerID};
    console.log("turnData");
    console.log(turnData);
    $.ajax({
      url: this.props.url,
      type: 'POST',
      data: turnData,
      success: function(data) {
        console.log(data);
        var message = data['result'];
        console.log(message);
        this.setState({message: message});
      }.bind(this),
      error: function(xhr, status, err) {
        console.log(xhr);
        if(xhr.responseText === 'wait'){
          this.setState({message:"No game yet, wait to be matched"});
        }
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },  

  render: function(){
    return(
      <div className='playerBox'>
        <h1>Message {this.state.message}</h1>
        <p>{this.state.role}</p>
        <form onSubmit={this.handleCodeSubmit}>
          <PythonEditor ref="editor" />
          <br/>
          <button type="submit">Run</button> 
        </form>
      </div>
    );
  }
});


if(!window.react){
  window.react = {};
}

window.react.PythonEditor = PythonEditor;
window.react.PythonOutput = PythonOutput;
window.react.PlayerBox = PlayerBox;