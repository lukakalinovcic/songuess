/*jslint indent: 2, plusplus: true*/
"use strict";

var
  clock = require('./clock.js'),
  Syncer = require('./syncer.js').Syncer,
  PointsAssigner = require('./points_assigner.js'),
  mediaAuthenticator = new (require('./auth.js').MediaAuthenticator)(),
  HostSocket = require('./host_socket.js').HostSocket,
  Groupify = require('./groupifier.js').Groupify;

exports.ChatRoom = function (desc, chat) {

  var
    that = this,
    clients = {},
    localPersonData = {},
    numberOfClients = 0,
    // A dummy pointsAssigner, just to make sure it's never null.
    pointsAssigner = new PointsAssigner({}, that),
    currentItem = null,
    hostSocket = null,
    playonTimeTimeout = null,
    // "dead", "playing", "playon", "after", "suspense"
    // if state is playing, when did the song start?
    // if state is suspense, when will the next song start?
    // if state is playing or playon, how many and who voted next?
    roomState = {
      state : "dead",
      songStart : null,
      lastScore : new Map(),
      whoIdkVotes : new Set(),
      hintShowed : false
    };

  function packRoomState() {
    var id, sol = {
      desc : {
        name : desc.name,
        desc : desc.desc,
        streamFromMiddle: desc.streamFromMiddle,
        maxPoints: desc.maxPoints,
        artistPoints: desc.artistPoints,
        playonTime: desc.playonTime
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

  function cancelPlayonTimeTimer() {
    if (playonTimeTimeout) {
      clearTimeout(playonTimeTimeout);
      playonTimeTimeout = null;
    }
  }

  function startPlayonTimeTimer(callback) {
    playonTimeTimeout = setTimeout(callback, desc.playonTime * 1000);
  }

  function playNext() {
    if (hostSocket == null) {
      return;
    }

    pointsAssigner.giveArtistPoints();

    cancelPlayonTimeTimer();

    roomState.state = "after";
    roomState.songStart = null;
    
    hostSocket.playNext(function(err, nextSongItem) {
      let startTime = clock.clock() + 8000;

      currentItem = nextSongItem;
      pointsAssigner = new PointsAssigner(currentItem, that);

      setTimeout(function() {
        roomState.state = "suspense";
        roomState.songStart = startTime;
        that.broadcast('next_song_announce', roomState);
      }, Math.max(0, startTime - clock.clock() - 6000));

      setTimeout(function() {
        roomState.state = "playing";
        roomState.hintShowed = false;
        roomState.whoIdkVotes = new Set();
        roomState.lastScore = new Map();

        if (desc.playonTime > 0) {
          startPlayonTimeTimer(function() {
            playonTimeTimeout = null;
            if (roomState.state == "playon") {
              info('Moving on after ' + desc.playonTime + ' seconds.');
              playNext();
            }
          });
        }
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
        !pointsAssigner.gotAnswer(data, client)) {
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
    let hint = word.replace(/[a-zčćšđž]/g, '.');
    for (let i = 0; i < word.length; ++i) {
      // If this was a vowel, bring it back from the original string.
      if (/[aeiouäëöüy]/.test(word[i])) {
        hint = hint.substring(0, i) + word[i] + hint.substring(i + 1);
      }
    }
    return hint;
  }

  function calcHint(text) {
    if (!text) return '';
    let words = text.split(' ');
    return words.map(w => calcWordHint(w)).join(' ');
  }

  // Returns whether the majority was reached.
  // implicitIdk happens for example if you leave, or if you guess the title.
  function checkForIdkVoteMajority(data, client, implicitIdk) {
    let stillGuessing = numberOfClients;
    if (roomState.state !== "playon") {
      stillGuessing -= pointsAssigner.getTitleWinnersSize();
    }
    if (roomState.whoIdkVotes.size >= 1 + Math.floor(stillGuessing / 2)) {
      let idk_data = {
        who: client.id(),
        when: data.when,
        state: roomState.state,
        implicitIdk: implicitIdk
      };
      // If state is playon, it means all the points have been given out.
      // It doesn't make sense to show the hint in this case.
      if (roomState.hintShowed === false && roomState.state !== "playon") {
        idk_data.hint = {
          title: calcHint(currentItem.title),
          artist: desc.artistPoints ?
            calcHint(currentItem.artist) : currentItem.artist
        };
        that.broadcast('called_i_dont_know', idk_data);
        roomState.hintShowed = true;
        roomState.whoIdkVotes = new Set();
      } else {
        idk_data.answer = currentItem;
        that.broadcast('called_i_dont_know', idk_data);
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
    // Ignore if the person already voted or already got title points.
    if (roomState.whoIdkVotes.has(client.id()) ||
        (roomState.state !== "playon" && pointsAssigner.isTitleWinner(client)))
    {
      return;
    }
    // Mark the vote.
    roomState.whoIdkVotes.add(client.id());
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

  function onHonor(data, client) {
    if (!clients.hasOwnProperty(data.to)) {
      return info("Target acc is not in da klub.", client);
    }
    let target = clients[data.to];
    if (roomState.state !== "after") {
      return info("Honoring only allowed after guessing is done.", client);
    }
    if (target === client) {
      return info("Can't honor yourself.", client);
    }
    if (!roomState.lastScore.has(client.id())) {
      return info("You don't have any points to give in this round.", client);
    }
    let numPoints = roomState.lastScore.get(client.id());
    client.local('score', client.local('score') - numPoints);
    target.local('score', target.local('score') + numPoints);
    that.broadcast('honored', {from: client.id(), to: target.id()});
    // Prevent from honoring twice.
    roomState.lastScore.delete(client.id());
  }

  function songEndedHandler() {
    that.broadcast('song_ended', {
      answer : currentItem,
      when : clock.clock(),
      state : roomState.state
    });
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

  function onGroupify(data) {
    for (let assignment in Groupify(clients, data.numGroups)) {
      onChangeGroup({group: assignment.group}, assignment.client);
    }
  }

  this.desc = desc;

  this.broadcast = function (type, msg, except) {
    for (let id in clients) {
      if (clients.hasOwnProperty(id)) {
        if (!(except && except.id() === id)) {
          clients[id].send(type, msg);
        }
      }
    }
  };

  this.broadcastRaw = function (data) {
    for (let id in clients) {
      clients[id].sendRaw(data);
    }
  };

  // this is triggered from ChatClient::local
  // function will copy local data to all other clients
  // with same pid and to room's localPersonData
  this.localDataChanged = function (client) {
    let pid = client.pid();
    localPersonData[pid] = client.desc('local');
    for (let id in clients) {
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
    client.onMessage('groupify', onGroupify);

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

    pointsAssigner.clientArrived(client);
  };

  // Pop a client from a list of clients and notify other clients.
  this.leave = function (client, reason) {
    numberOfClients--;

    roomState.whoIdkVotes.delete(client.id());
    pointsAssigner.clientLeft(client);

    // Re-evaluate if we now have the majority for triggering an /idk event.
    checkForIdkVoteMajority({when: clock.clock()}, client, /*implicitIdk=*/true);

    client.local('num', client.local('num') - 1);
    delete clients[client.id()];
    if (numberOfClients == 0) {
      roomState.state = "dead";
      roomState.songStart = null;
      if (hostSocket !== null) {
        hostSocket.closeSocket();
        this.detachHostSocket();
      }
    }
    this.broadcast('old_client', [client.id(), reason]);
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
    const next_state = (playOn || playonTimeTimeout)? "playon": "after";
    roomState.state = next_state;

    // This was an explicit playon because someone typed #playon.
    // The song should not be skipped by the running playon timer in this case.
    if (playOn) {
      cancelPlayonTimeTimer();
    }

    that.broadcast('guessing_done', {
      answer: currentItem,
      state: next_state
    });

    if (next_state === "playon") {
      // We reset the existing /idk votes, we're in a different situation now.
      // The song has been guessed, no more points, we just listen for some
      // more.
      roomState.whoIdkVotes = new Set();
    } else {
      playNext();
    }
  }

  // Called by the pointsAssigner.
  this.grantScore = function(client, numPoints, artistScore, isRoundFinished) {
    client.local('score', client.local('score') + numPoints);
    roomState.lastScore.set(client.id(), numPoints);
    if (artistScore) {
      that.broadcast('grant_artist_score', {
        who: client.id(),
        numPoints: numPoints
      });
    // Guessing the title might trigger /idk, because the pool of people that
    // are still guessing was decreased.
    } else if (!isRoundFinished) {
      checkForIdkVoteMajority({when: clock.clock()}, client, /*implicitIdk=*/true);
    }
  }
};
