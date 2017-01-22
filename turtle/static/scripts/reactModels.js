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
    canvasID : React.PropTypes.string,
    code : React.PropTypes.string
  },
  getDefaultProps: function () {
    return { canvasID: "canvas" };
  },
  outf: function(text) {
    this.refs.pre.innerHTML += text;
  },
  builtinRead: function(x) {
    if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
      throw "File not found: '" + x + "'";
    return Sk.builtinFiles["files"][x];
  },
  run: function(prog){
    if (!prog){
      return;
    }
    console.log("RUN IT!", prog);

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
  componentDidMount: function(){
    if (this.props.code)
      this.run(this.props.code);
  },
  componentDidUpdate: function(prevProps, prevState) {
    if (this.props.code && (this.props.code !== prevProps.code))
      this.run(this.props.code);
  },
  render: function(){
    return(
      <div>
        <pre ref="pre"> </pre>
        <div id={this.props.canvasID}></div>
      </div>
    );
  }
});

var PlayerBox = React.createClass({
  getInitialState: function(){
    return({role: undefined, message: "", out_code: ""});
  },
  setRole: function(role){
    this.setState({role:role});
  },
  write: function(code) {
    this.refs.editor.setValue(code);
  },
  run: function(code){
    this.setState({out_code:code});
  },
  handleCodeSubmit: function(e){
    e.preventDefault();
    var code = this.refs.editor.getValue();
    if (!code || !this.props.playerID) {
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
        <PythonOutput code={this.state.out_code}/>
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