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

  // Assumes the client with given ID exists!
  function removeClient(arr, client) {
    let j = 0;
    for (let i = 0; i < arr.length; ++i) {
      arr[j] = arr[i];
      if (arr[i].id() != client.id()) {
        ++j;
      }
    }
    arr.pop();
  }

  this.gotAnswer = function (answerData, client) {
    const gotTitle = answerChecker.checkAnswer(currentItem.title, answerData.what);
    const gotArtist = artistPoints && answerChecker.checkAnswer(currentItem.artist, answerData.what);

    if (gotTitle || gotArtist) {
      playOn = playOn || (answerData.what.indexOf('#playon') != -1);
      chatRoom.broadcast(gotTitle? 'correct_title': 'correct_artist', {
        who: client.id(),
        when : answerData.when
      });
    }

    if (gotTitle) {
      if (!clientPresent(titleWinners, client)) {
        // This is the case when a user first gets an artist right, but then also
        // gets the title. In this case we remove from artistWinners and append
        // to titleWinners.
        if (clientPresent(artistWinners, client)) {
          removeClient(artistWinners, client);
        }
        titleWinners.push(client);
        // Title points can't change later and can be awarded immediately.
        chatRoom.grantScore(client, maxPoints - titleWinners.length + 1);
      }
    } else if (gotArtist) {
      if (!clientPresent(titleWinners, client) && !clientPresent(artistWinners, client)) {
        // Artist points could later become title points so they are not
        // awarded right away.
        artistWinners.push(client);
      }
    }

    // TODO: The current number of clients is also important here, for example
    // if maxPoints = 4 but there are already 2 clients and they all gave their
    // title answers already.
    // If everyone got title points, we can close the round.
    if (titleWinners.length == maxPoints ||
        // If just one title point is left unawarded, and someone has an artist
        // point, the situation also can't change anymore.
        (artistWinners.length == 1 && titleWinners.length == maxPoints - 1)) {
      // Not that if there are 2 artist winners, the one which would've gotten
      // 1 point can still give a title answer and by doing that get 2 points
      // instead of 1, so we can't finish the round.
      that.finishTheRound();
    }
  };

  // This is called if the song has ended, or if next was called before all the
  // points were given out.
  this.finishTheRound = function () {
    // Title points have already been awarded.
    let points = maxPoints - titleWinners.length;
    for (const client of artistWinners) {
      chatRoom.grantScore(client, points--);
    }
    chatRoom.guessingDone(playOn);
  };
};
