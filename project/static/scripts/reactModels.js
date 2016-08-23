var CodeForm = React.createClass({
  getInitialState: function(){
    return {editor: undefined, id: undefined};
  },
  handleSubmit: function(e) {
    e.preventDefault();
    console.log("handleSubmit happening");
    var code = this.state.editor.getValue().trim();
    var id = this.props.playerID;
    if (!code || !id) {
      return;
    }
    this.props.onCodeSubmit({code: code, id: id});
    this.setState(this.getInitialState());
  },
  setValue: function(value){
    this.state.editor.getDoc().setValue(value);
  },
  componentDidMount: function(){
    var editor = CodeMirror.fromTextArea(
      document.getElementById('yourcode'),
      {
        lineNumbers:true,
        mode: 'python',
        autofocus: true
      }
    );
    this.setState({editor:editor});
  },
  render: function(){
    return(
      <form onSubmit={this.handleSubmit}> 
        <textarea id="yourcode" cols="40" rows="10">
        </textarea><br />
      <button type="submit">Run</button> 
      </form> 
    );
  }
});

var PlayerBox = React.createClass({
  getInitialState: function(){
    return({data:''});
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

  handleCodeSubmit: function(turnData){
    console.log("turnData");
    console.log(turnData);
    $.ajax({
      url: this.props.url,
      // dataType: 'json',
      type: 'POST',
      data: turnData,
      success: function(data) {
        console.log(data);
        var message = data['result'];
        this.setState({message: message});
      }.bind(this),
      error: function(xhr, status, err) {
        console.log(xhr);
        if(xhr.responseText === 'wait'){
          console.log("n we made it");
          this.setState({message:"No game yet, wait to be matched"})
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
        <CodeForm ref="codeForm" role={this.state.role} playerID={this.props.playerID} onCodeSubmit={this.handleCodeSubmit} />
      </div>
    );
  }
});


if(!window.react){
  window.react = {};
}

window.react.CodeForm = CodeForm;
window.react.PlayerBox = PlayerBox;