/*jslint indent: 2, plusplus: true*/
"use strict";

var
  PointsAssigner = require('./points_assigner'),
  TITLE = 'some title',
  ARTIST = 'some artist',
  ITEM = {title: TITLE, artist: ARTIST},
  CLIENT_1 = {id: () => "1"},
  CLIENT_2 = {id: () => "2"},
  CLIENT_3 = {id: () => "3"};

function buildChatRoom(desc) {
  return {
    grantScore: jest.fn().mockName('grantScore'),
    broadcast: jest.fn().mockName('broadcast'),
    guessingDone: jest.fn().mockName('guessingDone'),
    desc: desc
  };
}

test('maxPoints = 1, wrong answer', () => {
  var chatRoom = buildChatRoom({maxPoints: 1});
  var pa = new PointsAssigner(ITEM, chatRoom);

  pa.gotAnswer({what: 'wrong', when: 1}, CLIENT_1);

  expect(chatRoom.grantScore).not.toBeCalled();
  expect(chatRoom.guessingDone).not.toBeCalled();
});

test('maxPoints = 1, correct answer', () => {
  var chatRoom = buildChatRoom({maxPoints: 1});
  var pa = new PointsAssigner(ITEM, chatRoom);

  pa.gotAnswer({what: TITLE, when: 1}, CLIENT_1);

  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).toBeCalledWith(CLIENT_1, 1);
  expect(chatRoom.guessingDone).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);
});

test('maxPoints = 2, one correct one wrong answer', () => {
  var chatRoom = buildChatRoom({maxPoints: 2});
  var pa = new PointsAssigner(ITEM, chatRoom);

  pa.gotAnswer({what: TITLE, when: 1}, CLIENT_1);
  expect(chatRoom.grantScore).toBeCalledTimes(1);
  // First correct answer gets two points.
  expect(chatRoom.grantScore).toBeCalledWith(CLIENT_1, 2);

  pa.gotAnswer({what: 'wrong', when: 2}, CLIENT_2);
  expect(chatRoom.guessingDone).not.toBeCalled();
});

test('maxPoints = 2, various answers but finally two correct ones', () => {
  var chatRoom = buildChatRoom({maxPoints: 2});
  var pa = new PointsAssigner(ITEM, chatRoom);

  pa.gotAnswer({what: 'wrong', when: 1}, CLIENT_1);
  pa.gotAnswer({what: 'wrong', when: 2}, CLIENT_2);
  pa.gotAnswer({what: TITLE, when: 3}, CLIENT_1);
  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).toBeCalledWith(CLIENT_1, 2);
  expect(chatRoom.guessingDone).not.toBeCalled();

  pa.gotAnswer({what: 'wrong', when: 4}, CLIENT_1);
  pa.gotAnswer({what: TITLE, when: 5}, CLIENT_2);
  expect(chatRoom.grantScore).toBeCalledTimes(2);
  expect(chatRoom.grantScore).toBeCalledWith(CLIENT_2, 1);

  expect(chatRoom.guessingDone).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);
});

test('maxPoints = 2, dont award to same client twice', () => {
  var chatRoom = buildChatRoom({maxPoints: 2});
  var pa = new PointsAssigner(ITEM, chatRoom);

  pa.gotAnswer({what: TITLE, when: 1}, CLIENT_1);
  pa.gotAnswer({what: TITLE, when: 2}, CLIENT_1);

  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).toBeCalledWith(CLIENT_1, 2);
  expect(chatRoom.guessingDone).not.toBeCalled();
});

test('maxPoints = 3, 3 correct guesses get 3,2,1 points', () => {
  var chatRoom = buildChatRoom({maxPoints: 3});
  var pa = new PointsAssigner(ITEM, chatRoom);

  pa.gotAnswer({what: TITLE, when: 1}, CLIENT_1);
  expect(chatRoom.guessingDone).not.toBeCalled();
  pa.gotAnswer({what: TITLE, when: 2}, CLIENT_2);
  expect(chatRoom.guessingDone).not.toBeCalled();
  pa.gotAnswer({what: TITLE, when: 3}, CLIENT_3);

  expect(chatRoom.grantScore).toBeCalledTimes(3);
  expect(chatRoom.grantScore).toBeCalledWith(CLIENT_1, 3);
  expect(chatRoom.grantScore).toBeCalledWith(CLIENT_2, 2);
  expect(chatRoom.grantScore).toBeCalledWith(CLIENT_3, 1);

  expect(chatRoom.guessingDone).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);
});
