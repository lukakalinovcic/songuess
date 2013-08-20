/*jslint indent: 2, plusplus: true*/
"use strict";

var
  ws = require('ws'),
  Syncer = require('./syncer.js').Syncer,
  config = require('./config.js').server,
  verifyToken = require('./auth.js').verifyToken,
  Chat = require('./chat.js').Chat,
  MediaGateway = require('./media.js').MediaGateway,
  SockWrapper = require('./sockwrap.js').SockWrapper;

var httpServer = require('http').createServer();
var server = new ws.Server({server: httpServer});
var media = new MediaGateway();
var chat = new Chat(media);

function onVerified(sock, user) {
  var syncer = new Syncer(sock, function () {
    var wsock = new SockWrapper(sock);
    chat.connect(wsock, user);
    media.serve(wsock);
  });
}

server.on('connection', function (sock) {
  sock.onmessage = function (message) {
    verifyToken(message, function (user, err) {
      // it looks like reason should not be too long.
      if (err) {
        sock.close(1000, err.toString().substr(0, 100));
      } else {
        sock.send(JSON.stringify(user), function () {
          onVerified(sock, user);
        });
      }
    });
  };
});

httpServer.listen(config.port);
