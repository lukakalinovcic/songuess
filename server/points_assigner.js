/*jslint indent: 2, plusplus: true*/
"use strict";

var AnswerChecker = require('./answer_checker.js');

module.exports = function (currentItem, chatRoom) {
  var
    that = this,
    answerChecker = new AnswerChecker(),
    maxPoints = (chatRoom.desc && chatRoom.desc.maxPoints) || 1,
    artistPoints = (chatRoom.desc && chatRoom.desc.artistPoints) || false,
    playOn = false,
    // These arrays contain client objects.
    // They are ordered, clients that come earlier should get more points.
    titleWinners = [],
    artistWinners = [];

  function clientPresent(arr, client) {
    for (const c of arr) {
      if (c.id() == client.id()) {
        return true;
      }
    }
    return false;
  }

  // If the ID is not in there the arr will be left unchanged.
  // Assumes all the IDs are unique.
  function removeClient(arr, client) {
    let i = 0, j = 0;
    for (i = 0; i < arr.length; ++i) {
      arr[j] = arr[i];
      if (arr[i].id() != client.id()) {
        ++j;
      }
    }
    // If element was found.
    if (j == i - 1) {
      arr.pop();
    }
  }

  function isRoundFinished() {
    const maxClientsToGetPoints = Math.min(maxPoints, chatRoom.getNumberOfClients());
    // If everyone got title points, we can close the round.
    if (titleWinners.length == maxClientsToGetPoints ||
        // If everyone in the room got a title point besides one person, and
        // that person already has an artist point, we can also end the round.
        // That remaining person can't get more than 1 point, and no one else
        // can take that point away from them by guessing the title.
        (titleWinners.length == chatRoom.getNumberOfClients() - 1 &&
         artistWinners.length == 1)) {
      // Note that if there are 2 artist winners, the one which would've gotten
      // 1 point can still give a title answer and get 2 points instead of 1,
      // so we can't finish the round.
      return true;
    }
    return false;
  }

  // Returns whether this answer should be shown to everyone or not.
  this.gotAnswer = function (answerData, client) {
    const gotTitle = answerChecker.checkAnswer(currentItem.title, answerData.what);
    const gotArtist = artistPoints && answerChecker.checkAnswer(currentItem.artist, answerData.what);

    let broadcastData = {who: client.id(), when: answerData.when};

    if (gotTitle || gotArtist) {
      playOn = playOn || (answerData.what.indexOf('#playon') != -1);
    }

    if (gotTitle) {
      if (!clientPresent(titleWinners, client)) {
        // This is the case when a user first gets an artist right, but then also
        // gets the title. In this case we remove from artistWinners and append
        // to titleWinners.
        removeClient(artistWinners, client);
        titleWinners.push(client);
        // Title points can't change later and can be awarded immediately.
        broadcastData.numPoints = maxPoints - titleWinners.length + 1;
        chatRoom.grantScore(
          client,
          broadcastData.numPoints,
          /*artistScore=*/ false,
          isRoundFinished());
      }
      chatRoom.broadcast('correct_title', broadcastData);
    } else if (gotArtist) {
      if (!clientPresent(titleWinners, client) &&
          !clientPresent(artistWinners, client)) {
        // Artist points could later become title points so they are not
        // awarded right away.
        artistWinners.push(client);
      }
      chatRoom.broadcast('correct_artist', broadcastData);
    }

    if (isRoundFinished()) {
      chatRoom.guessingDone(playOn);
    }

    return gotTitle || gotArtist;
  };

  // This should be called externally for example if the song has ended, or if
  // next was called before/ all the points were given out.
  this.giveArtistPoints = function () {
    // Title points have already been awarded.
    let points = maxPoints - titleWinners.length;
    for (const client of artistWinners) {
      if (points > 0) {
        chatRoom.grantScore(client, points--, /*artistScore=*/ true);
      }
    }
    // Just in case this is called twice.
    artistWinners = [];
  };

  this.clientLeft = function(client) {
    removeClient(titleWinners, client);
    removeClient(artistWinners, client);
    if (isRoundFinished()) {
      chatRoom.guessingDone(playOn);
    }
  };

  this.getTitleWinnersSize = function() {
    return titleWinners.length;
  };
};
