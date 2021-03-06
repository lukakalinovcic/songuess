function validChTarget(target) {
  if (target == "artist" || target == "album" || target == "title") {
    return true;
  }
  if (target.substr(0, 5) == "title") {
    var alt_index = target.substr(5);
    if (Number(alt_index).toString() != alt_index) {
      return false;
    }
    if (alt_index >= 2) {
      return true;
    }
  }
  return false;
}

function Chat(wsock, user, media, player, onFatal) {

  var
    that = this,
    commandCallbacks = {},
    ui = new ChatUI(this, user),
    ns = new NameResolver(),
    clients = {},
    ids = [],
    pids = [],
    announceTimer,
    roomDescription = null,
    roomState = {
      state : "dead",
      songStart : null,
      lastSong : null
    },
    commandAliases = {
      j: 'join',
      v: 'volume',
      m: 'mute',
      h: 'honor',
    };

  // checks whether the sending message is maybe
  // a command to chat itself
  function checkCommand(text) {
    var params, cmd;
    if (text.substr(0, 1) !== "/") {
      return false;
    }
    params = text.substr(1).split(" ");
    cmd = params.shift();
    ui.addNotice(text, "cmd");
    if (cmd in commandAliases) {
      cmd = commandAliases[cmd];
    }
    if (!commandCallbacks.hasOwnProperty(cmd)) {
      ui.addNotice("Command '" + cmd + "' unavailable.", "err");
      return true;
    }
    try {
      commandCallbacks[cmd].apply(that, params);
    } catch (e) {
      ui.addNotice("error: " + e, "err");
    }
    return true;
  }

  function updateClientIds() {
    var bio = {}, pid;
    ids = [];
    pids = [];
    ns.clear();
    for (var id in clients) {
      if (clients.hasOwnProperty(id)) {
        pid = that.id2Pid(id);
        if (!bio.hasOwnProperty(pid)) {
          pids.push(pid);
          bio[pid] = 1;
        }
        ids.push(id);
        ns.add(id, clients[id].display);
      }
    }
    ns.rebuildDisplay();
    for (var id in clients) {
      if (clients.hasOwnProperty(id)) {
        clients[id].nsdisp = ns.display(id);
      }
    }
  }

  function onCommand(cmd, callback) {
    commandCallbacks[cmd] = callback;
  }

  function roomNameOk(name) {
    return name
      && name.indexOf(" ") === -1
      && name.length > 0;
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
          clients[id].group = src_client.group;
        }
      }
    }
  }

  onCommand("group", function (target) {
    if (target === undefined) {
      return ui.addNotice("Use /group {0, 1, 2, ...}.");
    }
    target = Math.floor(Number(target));
    if (target < 0 || target > 10) {
      throw "Invalid target group.";
    }
    wsock.sendType("change_group", {when:myClock.clock(), group:target});
  });

  onCommand("groupify", function(target) {
    if (target === undefined) {
      return ui.addNotice("Use /groupify {0, 1, 2, ...}.");
    }
    target = Math.floor(Number(target));
    if (target < 0 || target > 10) {
      throw "Too many groups given.";
    }
    wsock.sendType("groupify", {numGroups: target});
  });

  onCommand("mute", function () {
    ui.addNotice(player.toggleMute() ?
                 "Sound turned off." : "Sound turned on.");
  });

  onCommand("vol", function (value) {
    var vol = player.setVolume(value);
    ui.addNotice("Volume is set to " + vol + "." +
                (player.getMuted() ? " but /mute is on." : ""));
  });

  onCommand("help", function () {
    ui.addNotice("Available commands are ");
    ui.addNotice("- /clear, /join #room, /mute, /vol [0-10]");
    ui.addNotice("- /sync, /reset, /group [0,1,2,...]");
    ui.addNotice("- /desc, /info, /idk");
    ui.addNotice("- /reset (will reset your score), /honor");
  });

  onCommand("hello", function () {
    ui.addNotice("hello to you too.");
  });

  onCommand("info", function () {
    if (roomState.lastSong) {
      ui.displayInfo(roomState.lastSong);
    }
  });

  onCommand("desc", function () {
    ui.displayRoomDescription(roomDescription);
  });

  // used as a wrapper to Syncer class.
  function SyncSocketWrap() {
    var that = this;
    this.onmessage = null;
    this.send = function (msg) {
      wsock.sendType("sync", msg);
    }
    wsock.onMessage("sync", function (msg) {
      if (that.onmessage) {
        that.onmessage({data:msg});
      }
    });
  }

  onCommand("sync", function () {
    wsock.sendType("sync_start", {});
    new Syncer(
      new SyncSocketWrap(wsock),
      function (n) {
        ui.addNotice("Clock changed: " + Math.round(n*100)/100 + " ms.");
        player.resync(n > 1000);
      }
    );
  });

  onCommand("idk", function () {
    if (roomState.state === "playing" || roomState.state === "playon") {
      wsock.sendType("idk", {when: myClock.clock()});
    }
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
      return ui.addNotice("Room name not valid.", "err");
    }
    if (room[0] !== '#') {
      room = '#' + room;
    }
    wsock.onError(1, function (err) {
      media.newRoomDialog(room, function (room) {
        wsock.sendType("new_room", room);
      });
    });
    wsock.sendType("new_room", room);
  });

  onCommand("honor", function () {
    var it = 0, arr = [];
    for (it = 0; it < arguments.length; arr.push(arguments[it++]));
    wsock.sendType("honor", {to: ns.whois(arr.join(" ").trim())});
  });

  onCommand("me", function () {
    var it = 0, arr = [];
    for (it = 0; it < arguments.length; arr.push(arguments[it++]));
    wsock.sendType("say", {
      from : user.id,
      to : null,
      when : myClock.clock(),
      what : arr.join(" ").trim(),
      me: true
    });
  });

  wsock.onRawData(function (data) {
    player.addHostChunk(data);
  });

  wsock.onMessage("clear_host_chunks", function (chunk) {
    player.clearHostChunks();
  });

  wsock.onMessage("room_state", function (data) {
    console.log('room_state:', data);

    location.hash = data.desc.name;
    roomDescription = data.desc.desc;
    roomState = data.state;
    clearTimeout(announceTimer);
    document.title = "songuess " + data.desc.name;
    ui.clear();

    if (roomState.songStart !== null) {
      player.setNextSongStart(roomState.songStart);
    }
    if (roomState.state !== "playing" && roomState.state !== "playon") {
      player.pause();
    } else {
      player.play();
    }

    ui.youEntered(data);
    clients = data.users;
    updateClientIds();
    ui.updateList();
  });

  wsock.onMessage("correct_title", function (data) {
    if (data.numPoints) {
      var client = that.getClient(data.who);
      client.score += data.numPoints;
      copySharedToPidPeers(client);
    }
    ui.correctTitle(data.who, data.numPoints, data.when, data.roll);
  });

  wsock.onMessage("correct_artist", function (data) {
    ui.correctArtist(data.who, data.when);
  });

  wsock.onMessage("grant_artist_score", function (data) {
    var client = that.getClient(data.who);
    client.score += data.numPoints;
    copySharedToPidPeers(client);
    ui.grantArtistScore(data.who, data.numPoints);
  });

  wsock.onMessage("guessing_done", function (data) {
    roomState.lastSong = data.answer;
    roomState.state = data.state;
    ui.guessingDone(data);
  });

  wsock.onMessage("honored", function (data) {
    var from = that.getClient(data.from),
      to = that.getClient(data.to);
    ++ to.score;
    -- from.score;
    copySharedToPidPeers(from);
    copySharedToPidPeers(to);
    ui.honored(data);
  });

  wsock.onMessage("called_reset", function (data) {
    var client = that.getClient(data.who);
    if (!client.id) {
      return;
    }
    client.score = 0;
    copySharedToPidPeers(client);
    ui.calledReset(data);
  });

  wsock.onMessage("change_group", function (data) {
    var who = that.getClient(data.who);
    if (!who.id) {
      return;
    }
    who.group = data.group;
    copySharedToPidPeers(who);
    ui.updateList();
  });

  // 3 sec before song start display 'get ready!'
  // 0.1 sec before song call player.play() to enable
  // sound.
  wsock.onMessage("next_song_announce", function (state) {
    var interval, when = state.songStart;
    roomState = state;
    player.pause();
    player.setNextSongStart(state.songStart);
    clearTimeout(announceTimer);
    announceTimer = setTimeout(function () {
      ui.announceSong();
      announceTimer = setTimeout(function () {
        player.play();
        roomState.state = "playing";
      }, myClock.timeTo(when - 10));
    }, myClock.timeTo(when - 3010));
  });

  wsock.onMessage("called_i_dont_know", function (data) {
    ui.calledIDontKnow(data);
    if (data.hasOwnProperty('hint')) {
      ui.showHint(data.hint);
    } else if (data.hasOwnProperty('answer')) {
      roomState.lastSong = data.answer;
      setTimeout(pretty.relativeTime, 3000);
      setTimeout(player.pause, 3000);
    }
  });

  wsock.onMessage("song_ended", ui.songEnded);
  wsock.onMessage("token", ui.gotToken);
  wsock.onMessage("say", ui.addMessage);
  wsock.onMessage("who", ui.displayWho);

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
      onFatal("Server closed the connection: " + e.reason);
    } else {
      onFatal("Server closed the connection.");
    }
  });

  this.triggerCommand = function (text) {
    checkCommand(text);
  }

  this.getNumberOfClients = function () {
    return ids.length;
  };

  this.getNumberOfPersons = function () {
    return pids.length;
  };

  this.id2Pid = function (id) {
    return id.split(".")[0];
  };

  this.getRoomState = function () {
    return roomState;
  };

  // by sequential number or by id.
  this.getClient = function (id) {
    if (id >= 0 && id < ids.length) {
      return clients[ids[id]];
    }
    if (!clients.hasOwnProperty(id)) {
      return {};
    }
    return clients[id];
  };

  this.hasClient = function (id) {
    return clients.hasOwnProperty(id);
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

  this.getPlayer = function () {
    return player;
  };

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
