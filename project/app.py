import json
import os
from flask import Flask, render_template, request, Response
from flask_socketio import SocketIO, emit

APP_ROOT = os.path.dirname(os.path.abspath(__file__))
APP_STATIC = os.path.join(APP_ROOT, 'static')

app = Flask(__name__)
app.jinja_env.add_extension('pyjade.ext.jinja.PyJadeExtension')
app.debug = True
socketio = SocketIO(app)

waiting = [] # player_ids
games = {} # player_id : Game containing player


class Player:
    def __init__(self, player_id):
        self.id = player_id
        self.code = None

class Game:
    def __init__(self, player1, player2):
        self.player1 = player1
        self.player2 = player2
    
    def play_turn(self, player_id, player_code):
        if player_id == self.player1.id:
            player = self.player1
            partner = self.player2
        elif player_id == self.player2.id:
            player = self.player2
            partner = self.player1

        if player.code is None:
            player.code = player_code
        else:
            pass # Player is resubmitting code during same turn.

        if player.code and partner.code:
            socketio.emit(self.player1.id, self.combine_player_codes())
            socketio.emit(self.player2.id, self.combine_player_codes())

            return self.combine_player_codes() # Todo inform client, and reset player.code and partner.code
        else:
            return "wait for partner"

    def combine_player_codes(self):
        with open(os.path.join(APP_STATIC, 'game.py'), 'rb') as f:
            return f.read().replace(
                '{{PLAYER_1_TURN}}', self.player1.code).replace(
                '{{PLAYER_2_TURN}}', self.player2.code)
            
@app.route('/')
def index():
    return render_template('index.jade')

@app.route('/hello')
def hello():
    return render_template('hello.jade')

@socketio.on('start')
def start_game(player_id):
    print(player_id)
    if player_id in games:
        game = games[player_id]
        resp = "welcome back"
    elif player_id in waiting:
        resp = "keep waiting"
    elif waiting:
        player1_id = waiting.pop()
        g = Game(Player(player1_id), Player(player_id))

        games[player1_id] = g
        games[player_id] = g
        resp = "matched!"
    else:
        waiting.append(player_id)
        resp="new player! Please wait to be matched"

    #return Response(json.dumps(resp), status=200, mimetype='application/json')   

@app.route('/submit_code', methods=['post'])
def submit_code():
    player_id = request.form['id']
    player_code = request.form['code']
    print "SUBMIT CODE and ID: ", player_id,player_code
    if player_id not in games:
        return Response("wait", status=404, mimetype='application/json')

    else:
        g = games[player_id]
        resp = g.play_turn(player_id, player_code)
        return Response(json.dumps({'result':resp}), status=200, mimetype='application/json')

if __name__ == '__main__':
    socketio.run(app, debug=True)
