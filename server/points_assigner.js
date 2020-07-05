/*jslint indent: 2, plusplus: true*/
"use strict";

var
  AnswerChecker = require('./answer_checker.js');

module.exports = function (chatRoom) {

  var
    that = this,
    answerChecker = new AnswerChecker();

  this.gotAnswer = function (answerData, client, currentItem) {
    if (answerChecker.checkAnswer(currentItem, answerData.what)) {
      // Award 1 point.
      chatRoom.grantScore(client, 1);
      chatRoom.broadcast('correct_title', {
        who: client.id(),
        when : answerData.when,
        numPoints: 1
      });

      const playOn = (answerData.what.indexOf('#playon') != -1);
      chatRoom.guessingDone(playOn);
    }
  };
};
