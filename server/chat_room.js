/*jslint indent: 2, plusplus: true*/
"use strict";

var
  clock = require('./clock.js'),
  Syncer = require('./syncer.js').Syncer,
  PointsAssigner = require('./points_assigner.js'),
  mediaAuthenticator = new (require('./auth.js').MediaAuthenticator)(),
  HostSocket = require('./host_socket.js').HostSocket;

exports.ChatRoom = function (desc, chat) {

  var
    that = this,
    clients = {},
    localPersonData = {},
    numberOfClients = 0,
    pointsAssigner = null,
    currentItem = null,
    hostSocket = null,

    // "dead", "playing", "playon", "after", "suspense"
    // if state is playing, when did the song start?
    // if state is suspense, when will the next song start?
    // if state is playing or playon, how many and who voted next?
    roomState = {
      state : "dead",
      songStart : null,
      lastSong : null,
      lastScore : null,
      idkVotes : null,
      whoIdkVotes : {},
      hintShowed : false
    };

  function packRoomState() {
    var id, sol = {
      desc : {
        name : desc.name,
        desc : desc.desc,
        streamFromMiddle: desc.streamFromMiddle,
        maxPoints: desc.maxPoints,
        artistPoints: desc.artistPoints
      },
      users : {},
      state : roomState
    };
    for (id in clients) {
      if (clients.hasOwnProperty(id)) {
        sol.users[id] = clients[id].publicInfo();
      }
    }
    return sol;
  }

  function playNext() {
    if (hostSocket == null) {
      return;
    }

    if (pointsAssigner) {
      pointsAssigner.giveAnyRemainingArtistPoints();
    }

    roomState.state = "after";
    roomState.songStart = null;
    
    hostSocket.playNext(function(err, nextSongItem) {
      var startTime = clock.clock() + 8000;

      currentItem = nextSongItem;
      pointsAssigner = new PointsAssigner(currentItem, that);

      setTimeout(function() {
        roomState.state = "suspense";
        roomState.songStart = startTime;
        that.broadcast('next_song_announce', roomState);
      }, Math.max(0, startTime - clock.clock() - 6000));

      setTimeout(function() {
        roomState.state = "playing";
        roomState.idkVotes = 0;
        roomState.whoIdkVotes = {};
        roomState.hintShowed = false;
      }, Math.max(0, startTime - clock.clock()));
    });
  }

  function info(text, to) {
    if (to) {
      to.send('say', {
        when : clock.clock(),
        to   : to.id(),
        from : null,
        what : text
      });
    } else {
      that.broadcast('say', {
        when : clock.clock(),
        to   : null,
        from : null,
        what : text
      });
    }
  }

  // if local record for this person (pid) is missing,
  // initialize to {}.
  // assign that record to a client.
  function initLocalData(client) {
    if (!localPersonData.hasOwnProperty(client.pid())) {
      localPersonData[client.pid()] = {
        score : 0,
        num : 0, // number of your accounts connected
        group : 0 // what is your group?
      };
    }
    client.desc('local', localPersonData[client.pid()]);
  }

  function onSay(data, client) {
    if (!clients.hasOwnProperty(data.from)) {
      console.log("internal: from not in this room");
      throw "internal: from not in this room";
    }
    if (data.from !== client.id()) {
      throw "from is not you";
    }
    if (data.to !== null && !clients.hasOwnProperty(data.to)) {
      throw "to specified, but not in this room";
    }

    if (roomState.state !== "playing" ||
      (pointsAssigner && !pointsAssigner.gotAnswer(data, client))) {
      that.broadcast('say', data);
    }
  }

  function onNewRoom(data, client) {
    if (!chat.roomNameExists(data)) {
      return client.error("No such room: " + data, 1);
    }
    chat.move(client, chat.whereIs(client), chat.getRoomByName(data));
  }

  // Hides all alphabetic characters except for vowels.
  function calcWordHint(word) {
    word = word.toLowerCase();
    // Start the hint by removing all the alphabetic characters.
    let hint = word.replace(/[a-z]/g, '.');
    for (let i = 0; i < word.length; ++i) {
      // If this was a vowel, bring it back from the original string.
      if (/[aeiouäëöüy]/.test(word[i])) {
        hint = hint.substring(0, i) + word[i] + hint.substring(i + 1);
      }
    }
    return hint;
  }

  function calcHint(currentItem) {
    // TODO: include artist hint?
    let words = currentItem.title.split(' ');
    return words.map(w => calcWordHint(w)).join(' ');
  }

  // Returns whether the majority was reached.
  // implicitIdk happens for example if you leave, or if you guess the title.
  function checkForIdkVoteMajority(data, client, implicitIdk) {
    if (roomState.idkVotes >= 1 + Math.floor(numberOfClients / 2)) {
      // If state is playon, it means all the points have been assigned.
      // It doesn't make sense to show the hint in this case.
      if (roomState.hintShowed === false && roomState.state !== "playon") {
        that.broadcast('called_i_dont_know', {
          who: client.id(),
          when : data.when,
          state : roomState.state,
          implicitIdk: implicitIdk,
          hint: calcHint(currentItem)
        });
        roomState.hintShowed = true;
        // Reset the voting. We want another majority in order to skip the song
        // after the hint was displayed.
        roomState.whoIdkVotes = {};
        roomState.idkVotes = 0;
      } else {
        that.broadcast('called_i_dont_know', {
          who: client.id(),
          when : data.when,
          state : roomState.state,
          implicitIdk: implicitIdk,
          answer: currentItem
        });
        roomState.lastScore = null;
        playNext();
      }
      return true;
    } else {
      return false;
    }
  }

  function onIDontKnow(data, client) {
    // Ignore this if nothing is playing currently.
    if (roomState.state !== "playing" && roomState.state !== "playon") {
      return;
    }
    // Ignore if the person already voted.
    if (roomState.whoIdkVotes.hasOwnProperty(client.id())) {
      return;
    }
    // Mark the vote.
    roomState.whoIdkVotes[client.id()] = 1;
    ++roomState.idkVotes;
    // Let the others know.
    if (!checkForIdkVoteMajority(data, client)) {
      that.broadcast('called_i_dont_know', {
        who: client.id(),
        when : data.when
      });
    }
  }

  function onToken(data, client) {
    client.send(
      'token',
      mediaAuthenticator.issueToken(client.desc('email'))
    );
  }

  function onResetScore(data, client) {
    client.local('score', 0);
    that.broadcast('called_reset', {
      who: client.id(),
      when: data.when
    });
  }

  // TODO: What happens with /honor when multiple points are present?
  function onHonor(data, client) {
    var target;
    if (!clients.hasOwnProperty(data.to)) {
      return info("Target acc is not in da klub.", client);
    }
    target = clients[data.to];
    if (roomState.state !== "after" && roomState.state !== "playon") {
      return info("Can't honor in this moment.", client);
    }
    if (target === client) {
      return info("You are honored.. gee, well done!", client);
    }
    if (client.id() !== roomState.lastScore) {
      return info("You didn't make the last score.", client);
    }
    client.local('score', client.local('score') - 1);
    target.local('score', target.local('score') + 1);
    roomState.lastScore = target.id();
    that.broadcast('honored', {from: client.id(), to: target.id()});
  }

  function songEndedHandler() {
    that.broadcast('song_ended', {
      answer : currentItem,
      when : clock.clock(),
      state : roomState.state
    });
    roomState.lastScore = null;
    playNext();
  }

  // used as a wrapper to Syncer class.
  function SyncSocketWrap(client) {
    var that = this;
    this.onmessage = null;
    this.send = function (msg, done) {
      client.send("sync", msg, done);
    }
    client.onMessage("sync", function (msg) {
      if (that.onmessage) {
        that.onmessage({data:msg});
      }
    });
  }

  function onStartSync(data, client) {
    Syncer(
      new SyncSocketWrap(client),
      function() {}
    );
  }

  function onChangeGroup(data, client) {
    if (client.local('group') === data.group) {
      return;
    }
    client.local('group', data.group);
    that.broadcast('change_group', {
      who: client.id(),
      group: data.group
    });
  }

  this.desc = desc;

  this.broadcast = function (type, msg, except) {
    var id;
    for (id in clients) {
      if (clients.hasOwnProperty(id)) {
        if (!(except && except.id() === id)) {
          clients[id].send(type, msg);
        }
      }
    }
  };

  this.broadcastRaw = function (data) {
    var id;
    for (id in clients) {
      clients[id].sendRaw(data);
    }
  };

  // this is triggered from ChatClient::local
  // function will copy local data to all other clients
  // with same pid and to room's localPersonData
  this.localDataChanged = function (client) {
    var pid = client.pid(), id;
    localPersonData[pid] = client.desc('local');
    for (id in clients) {
      if (clients.hasOwnProperty(id)) {
        if (clients[id].pid() === pid) {
          clients[id].desc('local', localPersonData[pid]);
        }
      }
    }
  };

  // add a client to a list of clients and
  // notify all clients about the adding.
  this.enter = function (client) {
    numberOfClients++;
    clients[client.id()] = client;
    client.setRoom(that);
    initLocalData(client);
    client.local('num', client.local('num') + 1);
    if (client.local('num') > 3) {
      return client.error("An account present too many times in a room.");
    }

    this.broadcast('new_client', client.publicInfo(), client);

    client.send('room_state', packRoomState());
    client.onMessage('say', onSay);
    client.onMessage('new_room', onNewRoom);
    client.onMessage('idk', onIDontKnow);
    client.onMessage('token', onToken);
    client.onMessage('reset_score', onResetScore);
    client.onMessage('honor', onHonor);
    client.onMessage('sync_start', onStartSync);
    client.onMessage('change_group', onChangeGroup);

    if (hostSocket === null) {
      console.log('enter: hostSocket is null');
    } else {
      if (hostSocket.currentAudioData().length > 0) {
        console.log('enter: sending currentAudioData to new client');
        client.sendRaw(hostSocket.currentAudioData());
      } else {
        console.log('enter: currentAudioData is empty');
      }
    }
  };

  // Pop a client from a list of clients and notify other clients.
  this.leave = function (client, reason) {
    numberOfClients--;

    // Pull this person's /idk vote back.
    if (roomState.whoIdkVotes.hasOwnProperty(client.id())) {
      delete roomState.whoIdkVotes[client.id()];
      --roomState.idkVotes;
    }
    // Re-evaluate if we now have the majority for triggering an /idk event.
    checkForIdkVoteMajority({when: clock.clock()}, client, /*implicitIdk=*/true);

    client.local('num', client.local('num') - 1);
    delete clients[client.id()];
    if (numberOfClients == 0) {
      roomState.state = "dead";
      roomState.songStart = null;
      roomState.lastSong = null;
      if (hostSocket !== null) {
        hostSocket.closeSocket();
        this.detachHostSocket();
      }
    }
    if (pointsAssigner) {
      pointsAssigner.clientLeft(client);
    }
    this.broadcast('old_client', [client.id(), reason]);
  };

  this.packWhoData = function () {
    var id, client, sol = {};
    for (id in clients) {
      if (clients.hasOwnProperty(id)) {
        client = clients[id];
        sol[ client.desc('display') ] = client.local('score');
      }
    }
    return sol;
  };

  this.attachHostSocket = function(socket) {
    hostSocket = new HostSocket(socket, that, playNext, songEndedHandler);
  };

  this.detachHostSocket = function() {
    hostSocket = null;
    // This will also make sure the music fades out gradually on the clients.
    this.broadcast('clear_host_chunks');
    info("The connection to host was broken.");
  };

  this.isEmpty = function() {
    return numberOfClients == 0;
  };

  this.getNumberOfClients = function() {
    return numberOfClients;
  };

  // Called by the pointsAssigner.
  this.guessingDone = function (playOn) {
    const next_state = playOn? "playon": "after";
    roomState.state = next_state;

    that.broadcast('guessing_done', {
      answer: currentItem,
      state: next_state
    });

    if (next_state !== "playon") {
      playNext();
    }
  }

  // Called by the pointsAssigner.
  this.grantScore = function(client, numPoints, artistScore, isRoundFinished) {
    client.local('score', client.local('score') + numPoints);
    roomState.lastScore = client.id();
    if (artistScore) {
      that.broadcast('grant_artist_score', {
        who: client.id(),
        numPoints: numPoints
      });
    // Guessing the title means the user should be counted against showing the
    // hint or skipping the song (as if they called /idk).
    } else if (!isRoundFinished &&
               !roomState.whoIdkVotes.hasOwnProperty(client.id())) {
      roomState.whoIdkVotes[client.id()] = 1;
      ++roomState.idkVotes;
      checkForIdkVoteMajority(
        {when: clock.clock()},
        client,
        /*implicitIdk=*/true);
    }
  }
};
