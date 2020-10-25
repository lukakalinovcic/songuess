/*jslint indent: 2, plusplus: true*/
"use strict";

var
  AnswerChecker = require('./answer_checker.js');

module.exports = function (chatRoom) {

  var
    that = this,
    answerChecker = new AnswerChecker(),
    maxPoints = null,
    artistPoints = null,
    currentItem = null,
    titleWinners = null,
    artistWinners = null,
    remainingPoints = null;

  this.init = function (item) {
    console.log('assigner init:', item);
    if (chatRoom.desc) {
      maxPoints = chatRoom.desc.maxPoints;
      artistPoints = chatRoom.desc.artistPoints;
    }
    currentItem = item;
    remainingPoints = maxPoints;
    titleWinners = new Set();
    artistWinners = new Set();
  };

  this.gotAnswer = function (answerData, client) {
    if (answerChecker.checkAnswer(currentItem.title, answerData.what)) {
      chatRoom.grantScore(client, remainingPoints);
      chatRoom.broadcast('correct_title', {
        who: client.id(),
        when : answerData.when,
        numPoints: remainingPoints
      });
      remainingPoints--;

      if (remainingPoints === 0) {  // or no more possible clients to answer
        const playOn = (answerData.what.indexOf('#playon') != -1);
        chatRoom.guessingDone(playOn);
      }
    } else if (answerChecker.checkAnswer(currentItem.artist, answerData.what)) {
      console.log('correct artist!');
      chatRoom.broadcast('correct_artist', {
        who: client.id(),
        when : answerData.when
      });
      artistWinners.add(client.id());
    }
  };
};
