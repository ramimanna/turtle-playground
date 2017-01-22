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

sockets = {}

# Object that represents a socket connection
class Socket:
    def __init__(self, sid):
        self.sid = sid
        self.connected = True

    # Emits data to a socket's unique room
    def emit(self, event, data):
        socketio.emit(event, data, room=self.sid)

@socketio.on('connect')
def on_connect():
    sockets[request.sid] = Socket(request.sid)

class Player:
    def __init__(self, player_id, socket_id):
        self.id = player_id
        self.socket = sockets[socket_id]
        self.code = []
    def __repr__(self):
        return "Player "+self.id

class Game:
    def __init__(self, player1, player2):
        print "new game!", player1, player2
        self.player1 = player1
        self.player2 = player2

        self.turn = 1
        self.current_level = 1;
        with open(os.path.join(APP_STATIC, 'game/level'+str(self.current_level)+'/prompt1.py'), 'rb') as f:
          prompt = f.read()
          self.player1.socket.emit("role", {"role":"Player 1", "prompt":prompt, "level":self.current_level})
        with open(os.path.join(APP_STATIC, 'game/level'+str(self.current_level)+'/prompt2.py'),'rb') as f:
          prompt = f.read()
          self.player2.socket.emit("role", {"role":"Player 2", "prompt":prompt, "level":self.current_level})

    def get_player(self, player_id):
        if self.player1.id == player_id:
            return self.player1
        if self.player2.id == player_id:
            return self.player2

    def get_matched_player(self, player_id):
        if self.player1.id == player_id:
            return self.player2
        if self.player2.id == player_id:
            return self.player1

    def play_turn(self, player_id, player_code):
        player = self.get_player(player_id)
        partner = self.get_matched_player(player_id)

        if len(player.code) < self.turn:
            player.code.append(player_code)
        else:
            pass # Player is resubmitting code during same turn.

        if len(player.code) == self.turn and len(partner.code) == self.turn:
            self.player1.socket.emit("code", self.combine_player_codes())
            self.player2.socket.emit("code", self.combine_player_codes())

            self.turn += 1
            return self.combine_player_codes() # Todo inform client, and reset player.code and partner.code
        else:
            return "wait for partner"

    def combine_player_codes(self):
        with open(os.path.join(APP_STATIC, 'game/level'+str(self.current_level)+'/code.py'), 'rb') as f:
            full_code = f.read()

            inject = ""
            for c1, c2 in zip(self.player1.code, self.player2.code):
                inject += c1 + "\nplay_turn(p1)\n"+ c2 + "\nplay_turn(p2)\n"

            return full_code.replace("{{inject}}", inject)

@app.route('/turtle')
def index():
    return render_template('index.jade')

def start_game(player_id, sessid):
    print "attempt new game", player_id, sessid
    if player_id in games:
        game = games[player_id]
        resp = "welcome back"
    elif player_id in waiting:
        resp = "keep waiting"
    elif waiting:
        player1 = waiting.pop()
        g = Game(player1, Player(player_id, sessid))

        games[player1.id] = g
        games[player_id] = g
        resp = "matched!"
    else:
        waiting.append( Player(player_id, sessid) )
        resp="new player! Please wait to be matched"

    print "waiting", waiting
    print "games", games
    sockets[sessid].emit("id", sessid)

@socketio.on('start')
def on_start(client_id):
    start_game(client_id, request.sid)

@socketio.on('close')
def close(player_id):
    print "%s disconnected" % (request.sid)
    del sockets[request.sid]

    if player_id in games:
        g = games[player_id]
        del games[player_id]
        partner = g.get_matched_player(player_id)
        del games[partner.id]
        start_game(partner.id, partner.socket.sid)
    else:
        for i, p in enumerate(waiting):
            if p.id == player_id: #if player was in waiting, remove
                waiting.remove(p)
                print p, "removed from waiting"
                break


@app.route('/turtle/submit_code', methods=['post'])
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
    socketio.run(app, debug=True, port=5001)
