function Chat(wsock, user, media, onFatal) {

  var
    that = this,
    commandCallbacks = {},
    ui = new ChatUI(this, user),
    clients = {},
    ids = [],
    playlist,
    player = new Player(myClock.clock, null),
    announceTimer;

  // checks whether the sending message is maybe
  // a command to chat itself
  function checkCommand(text) {
    var params, cmd;
    if (text.substr(0, 1) !== "/") {
      return false;
    }
    params = text.substr(1).split(" ");
    cmd = params.shift();
    if (!commandCallbacks.hasOwnProperty(cmd)) {
      ui.addNotice("command '" + cmd + "' unavailable.");
      return true;
    }
    try {
      commandCallbacks[cmd].apply(that, params);
    } catch (e) {
      ui.addNotice("error: " + e);
    }
    return true;
  }

  this.handleSend = function (text) {
    if (!checkCommand(text)) {
      wsock.sendType("say", {
        from : user.id,
        to   : null,
        when : myClock.clock(),
        what : text
      });
    }
  };

  function updateClientIds() {
    ids = [];
    for (var id in clients) {
      if (clients.hasOwnProperty(id)) {
        ids.push(id);
      }
    }
  }

  function updatePlaylist() {
  }

  this.getNumberOfClients = function () {
// used for user list animation testing
//    return 5; //that.bla === undefined? 5: 6;
    return ids.length;
  };

  this.id2Pid = function (id) {
    return id.split(".")[0];
  };

  // by sequential number or by id.
  this.getClient = function (id) {
// used for user list animation testing
/*
    if (id >= that.getNumberOfClients()) return undefined;
    var clientNames = [ "tomislav grbin", "anton grbin", "irma telarovic", "mirko telarovic", "gita telarovic", "novi korisnik"];
    var score = (id*13)%17;
    if (that.bla !== undefined && id === 1) score = 6;
    return {
      display: clientNames[id],
      id: id,
      score: score
    };
*/

    if (id >= 0 && id < ids.length) {
      return clients[ids[id]];
    }
    if (!clients.hasOwnProperty(id)) {
      console.log(
        "tried to get client not in a room."
      );
      return {};
    }
    return clients[id];
  };

  function onCommand(cmd, callback) {
    commandCallbacks[cmd] = callback;
  }

  function roomNameOk(name) {
    return name
      && name.indexOf(" ") === -1
      && name[0] === "#";
  }

  this.triggerCommand = function (text) {
    checkCommand(text);
  }

  // copies score value from client to every other client that shares pid with
  // him.
  // in future we will copy more details (eg. group);
  function copySharedToPidPeers(src_client) {
    var src_pid = that.id2Pid(src_client.id), id;
    for (id in clients) {
      if (clients.hasOwnProperty(id)) {
        if (that.id2Pid(id) === src_pid) {
          clients[id].score = src_client.score;
        }
      }
    }
  }

  onCommand("mute", function () {
    ui.addNotice(player.toggleMute() ?
                 "sound turned off." : "sound turned on.");
  });

  onCommand("volume", function (value) {
    var vol;
    try {
      vol = player.setVolume(value);
    } catch (err) {
      return ui.addNotice("error: " + err);
    }
    ui.addNotice("volume is set to " + vol + "." +
                (player.getMuted() ? " but /mute is on." : ""));
  });

  onCommand("help", function () {
    ui.addNotice("available commands are ");
    ui.addNotice("   /clear, /join #ROOM, /mute, /volume [0-10]");
  });

  onCommand("hello", function () {
    ui.addNotice("hello to you too.");
  });

  onCommand("next", function () {
// used for user list animation testing
//    that.bla = true;
//    ui.updateList();

    wsock.sendType("next", {when: myClock.clock()});
  });

  onCommand("token", function () {
    wsock.sendType("token", {when: myClock.clock()});
  });

  onCommand("reset", function () {
    wsock.sendType("reset_score", {when: myClock.clock()});
  });

  onCommand("clear", function () {
    ui.clear();
  });

  onCommand("join", function (room) {
    if (!roomNameOk(room)) {
      return ui.addNotice("room name not valid.");
    }
    wsock.onError(1, function (err) {
      media.newRoomDialog(room, function (room) {
        wsock.sendType("new_room", room);
      });
    });
    wsock.sendType("new_room", room);
  });

  wsock.onMessage("say", ui.addMessage);

  wsock.onMessage("chunk", function (chunk) {
    player.addChunk(chunk);
  });

  wsock.onMessage("room_state", function (data) {
    location.hash = data.desc.name;
    clearTimeout(announceTimer);
    document.title = "songuess " + data.desc.name;
    ui.clear();
    ui.youEntered(data);
    playlist = data.desc.playlist;
    clients = data.users;
    updatePlaylist();
    updateClientIds();
    ui.updateList();
  });

  // after 3sec's disable player (fade out music)
  // and disable relative timing.
  wsock.onMessage("correct_answer", function (data) {
    var client = that.getClient(data.who);
    ++ client.score;
    copySharedToPidPeers(client);
    setTimeout(pretty.relativeTime, 3000);
    setTimeout(player.pause, 3000);
    ui.correctAnswer(data);
  });

  wsock.onMessage("called_reset", function (data) {
    var client = that.getClient(data.who);
    client.score = 0;
    copySharedToPidPeers(client);
    ui.calledReset(data);
  });

  // 3 sec before song start display 'get ready!'
  // 0.1 sec before song call player.play() to enable
  // sound.
  wsock.onMessage("next_song_announce", function (when) {
    var interval;
    clearTimeout(announceTimer);
    interval = (when - myClock.clock()) - 2990;
    announceTimer = setTimeout(function () {
      ui.announceSong(when);
    }, (interval < 0 ? 0 : interval) );
    interval = (when - myClock.clock()) - 100;
    setTimeout(player.play, interval < 0 ? 0 : interval);
  });

  wsock.onMessage("called_next", function (data) {
    setTimeout(pretty.relativeTime, 3000);
    setTimeout(player.pause, 3000);
    ui.calledNext(data);
  });

  wsock.onMessage("song_ended", ui.songEnded);
  wsock.onMessage("token", ui.gotToken);

  wsock.onMessage("new_client", function (user) {
    clients[user.id] = user;
    updateClientIds();
    ui.userJoined(user.id);
    ui.updateList();
  });

  wsock.onMessage("old_client", function (pair) {
    ui.userLeft(pair[0], pair[1]);
    delete clients[pair[0]];
    updateClientIds();
    ui.updateList();
  });

  wsock.onClose(function (e) {
    if (e.reason) {
      onFatal("server closed connection: " + e.reason);
    } else {
      onFatal("server closed connection with no reason.");
    }
  });

  (function () {
    var init_room = location.hash;
    if (init_room.length <= 1) {
      init_room = "#root";
    }
    if (!roomNameOk(init_room)) {
      return onFatal("initial room name '" + init_room
                     + "' is not valid.");
    }
    wsock.sendType("initial_room", init_room);
    // if init room doesn't exists.
    wsock.onError(1, function () {
      media.newRoomDialog(init_room, function (room) {
        wsock.sendType("initial_room", room);
      });
    });
  }());

}
