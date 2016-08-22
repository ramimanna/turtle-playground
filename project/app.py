from flask import Flask, render_template
app = Flask(__name__)

app.jinja_env.add_extension('pyjade.ext.jinja.PyJadeExtension')
app.debug = True


@app.route('/')
def index():
    return render_template('index.jade')


@app.route('/hello')
def hello():
    return render_template('hello.jade')


if __name__ == '__main__':
    app.run(debug=True)
