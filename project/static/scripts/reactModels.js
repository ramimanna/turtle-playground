var CodeForm = React.createClass({
  render: function(){
    return(
      <form> 
        <textarea id="yourcode" cols="40" rows="10">

        </textarea><br /> 
      <button type="button" onclick="runit()">Run</button> 
      </form> 
    );
  }
});

if(!window.react){
  window.react = {};
}

window.react.CodeForm = CodeForm;