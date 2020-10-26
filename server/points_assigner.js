/*jslint indent: 2, plusplus: true*/
"use strict";

var AnswerChecker = require('./answer_checker.js');

module.exports = function (currentItem, chatRoom) {
  var
    that = this,
    answerChecker = new AnswerChecker(),
    maxPoints = (chatRoom.desc && chatRoom.desc.maxPoints) || 1,
    artistPoints = (chatRoom.desc && chatRoom.desc.artistPoints) || false,
    remainingPoints = maxPoints,
    titleWinners = new Set(),
    artistWinners = new Set();

  this.gotAnswer = function (answerData, client) {
    if (answerChecker.checkAnswer(currentItem.title, answerData.what) &&
        !titleWinners.has(client.id())) {
      chatRoom.grantScore(client, remainingPoints);
      chatRoom.broadcast('correct_title', {
        who: client.id(),
        when : answerData.when,
        numPoints: remainingPoints
      });

      remainingPoints--;
      titleWinners.add(client.id());

      if (remainingPoints === 0) {  // or no more possible clients to answer
        const playOn = (answerData.what.indexOf('#playon') != -1);
        chatRoom.guessingDone(playOn);
      }
    } else if (answerChecker.checkAnswer(currentItem.artist, answerData.what)) {
      chatRoom.broadcast('correct_artist', {
        who: client.id(),
        when : answerData.when
      });
      artistWinners.add(client.id());
    }
  };
};
