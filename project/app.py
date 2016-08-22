from flask import Flask, render_template, request, Response
import json

app = Flask(__name__)
app.jinja_env.add_extension('pyjade.ext.jinja.PyJadeExtension')
app.debug = True

waiting = []
games = {}
class Game:
    def __init__(self, player1, player2):
        pass

@app.route('/')
def index():
    return render_template('index.jade')

@app.route('/hello')
def hello():
    return render_template('hello.jade')

@app.route('/submit_code', methods=['post'])
def player1():
    code = request.form['code']
    player_id = request.form['id']

    if player_id in games:
        game = games[player_id]
        resp = "welcome back"
    elif player_id in waiting:
        resp = "keep waiting"
    elif waiting:
        other_player_id = waiting.pop()
        g = Game(player_id, other_player_id)
        games[other_player_id] = g
        games[player_id] = g
        resp = "matched!"
    else:
        waiting.append(player_id)
        resp="new player! Please wait to be matched"

    return Response(json.dumps(resp), status=200, mimetype='application/json')

if __name__ == '__main__':
    app.run(debug=True)
