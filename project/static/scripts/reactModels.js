var CodeForm = React.createClass({
  getInitialState: function(){
    return {editor: undefined, id: 1};
  },
  handleSubmit: function(e) {
    e.preventDefault();
    console.log("handleSubmit happening");
    var code = this.state.editor.getValue().trim();
    var id = this.state.id;
    if (!code || !id) {
      return;
    }
    this.props.onCodeSubmit({code: code, id: id});
    this.setState(this.getInitialState());
  },

  componentDidMount: function(){
    var editor = CodeMirror.fromTextArea(
      document.getElementById('yourcode'),
      {
        mode: 'python',
        autofocus: true
      }
    );
    this.setState({editor:editor});
  },
  render: function(){
    return(
      <form onSubmit={this.handleSubmit}> 
        <h1>Message {this.props.message}</h1>        
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

    var prog = document.getElementById("yourcode").value;
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
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },  

  render: function(){
    return(
      <CodeForm message = {this.state.data} onCodeSubmit={this.handleCodeSubmit} />
    );
  }
});


if(!window.react){
  window.react = {};
}

window.react.CodeForm = CodeForm;
window.react.PlayerBox = PlayerBox;