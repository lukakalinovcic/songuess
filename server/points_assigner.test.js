/*jslint indent: 2, plusplus: true*/
"use strict";

var
  PointsAssigner = require('./points_assigner'),
  TITLE = 'some title',
  ARTIST = 'some artist',
  ITEM = {title: TITLE, artist: ARTIST},
  CLIENT_1 = {id: () => "1"},
  CLIENT_2 = {id: () => "2"};

function buildChatRoom(desc) {
  return {
    grantScore: jest.fn().mockName('grantScore'),
    broadcast: jest.fn().mockName('broadcast'),
    guessingDone: jest.fn().mockName('guessingDone'),
    desc: desc
  };
}

test('maxPoints = 1, wrong answer', () => {
  let chatRoom = buildChatRoom({maxPoints: 1});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: 'wrong', when: when++}, CLIENT_1);

  expect(chatRoom.grantScore).not.toBeCalled();
  expect(chatRoom.guessingDone).not.toBeCalled();
});

test('maxPoints = 1, correct answer', () => {
  let chatRoom = buildChatRoom({maxPoints: 1});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);

  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).toBeCalledWith(CLIENT_1, 1);
  expect(chatRoom.guessingDone).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);
});

test('maxPoints = 2, guessing not done, title point granted', () => {
  let chatRoom = buildChatRoom({maxPoints: 2});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  pa.gotAnswer({what: 'wrong', when: when++}, CLIENT_2);

  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).toBeCalledWith(CLIENT_1, 2);
  expect(chatRoom.guessingDone).not.toBeCalled();
});

test('maxPoints = 2, various answers but finally two correct ones', () => {
  let chatRoom = buildChatRoom({maxPoints: 2});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: 'wrong', when: when++}, CLIENT_1);
  pa.gotAnswer({what: 'wrong', when: when++}, CLIENT_2);
  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).nthCalledWith(1, CLIENT_1, 2);

  pa.gotAnswer({what: 'wrong', when: when++}, CLIENT_1);
  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_2);
  expect(chatRoom.grantScore).toBeCalledTimes(2);
  expect(chatRoom.grantScore).nthCalledWith(2, CLIENT_2, 1);

  expect(chatRoom.guessingDone).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);
});

test('maxPoints = 2, dont award to same client twice', () => {
  let chatRoom = buildChatRoom({maxPoints: 2});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).toBeCalledWith(CLIENT_1, 2);
  // This client already got the title point.
  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  expect(chatRoom.grantScore).toBeCalledTimes(1);

  // Guessing is not done, still 1 more point to give out.
  expect(chatRoom.guessingDone).not.toBeCalled();
});

test('maxPoints = 3, 3 correct guesses get 3,2,1 points', () => {
  const CLIENT_3 = {id: () => "3"};
  let chatRoom = buildChatRoom({maxPoints: 3});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).nthCalledWith(1, CLIENT_1, 3);

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_2);
  expect(chatRoom.grantScore).toBeCalledTimes(2);
  expect(chatRoom.grantScore).nthCalledWith(2, CLIENT_2, 2);
  expect(chatRoom.guessingDone).not.toBeCalled();

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_3);
  expect(chatRoom.grantScore).toBeCalledTimes(3);
  expect(chatRoom.grantScore).nthCalledWith(3, CLIENT_3, 1);

  expect(chatRoom.guessingDone).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);
});

test('maxPoints = 2, artistPoints, only titles guessed', () => {
  let chatRoom = buildChatRoom({maxPoints: 2, artistPoints: true});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).nthCalledWith(1, CLIENT_1, 2);
  expect(chatRoom.guessingDone).not.toBeCalled();

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_2);
  expect(chatRoom.grantScore).toBeCalledTimes(2);
  expect(chatRoom.grantScore).nthCalledWith(2, CLIENT_2, 1);

  expect(chatRoom.guessingDone).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);
});

test('maxPoints = 2, one correct title one artist', () => {
  let chatRoom = buildChatRoom({maxPoints: 2, artistPoints: true});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).nthCalledWith(1, CLIENT_1, 2);
  expect(chatRoom.guessingDone).not.toBeCalled();

  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_2);
  expect(chatRoom.grantScore).toBeCalledTimes(2);
  expect(chatRoom.grantScore).nthCalledWith(2, CLIENT_2, 1);

  expect(chatRoom.guessingDone).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);
});

test('maxPoints = 3, artist points only', () => {
  let chatRoom = buildChatRoom({maxPoints: 3, artistPoints: true});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_1);
  expect(chatRoom.grantScore).not.toBeCalled();

  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_2);
  expect(chatRoom.grantScore).not.toBeCalled();

  pa.finishTheRound();

  expect(chatRoom.grantScore).toBeCalledTimes(2);
  expect(chatRoom.grantScore).nthCalledWith(1, CLIENT_1, 3);
  expect(chatRoom.grantScore).nthCalledWith(2, CLIENT_2, 2);
  expect(chatRoom.guessingDone).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);
});

test('maxPoints = 3, artist points and a title point', () => {
  let chatRoom = buildChatRoom({maxPoints: 3, artistPoints: true});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_1);
  expect(chatRoom.grantScore).not.toBeCalled();

  // Title points awarded immediately.
  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_2);
  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).nthCalledWith(1, CLIENT_2, 3);
  expect(chatRoom.guessingDone).not.toBeCalled();

  pa.finishTheRound();

  // CLIENT_2 already got 3 title points, CLIENT_1 gets 2 artist points.
  expect(chatRoom.grantScore).toBeCalledTimes(2);
  expect(chatRoom.grantScore).nthCalledWith(2, CLIENT_1, 2);
  expect(chatRoom.guessingDone).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);
});

test('maxPoints = 2, artist point ignored if you already have a title point', () => {
  let chatRoom = buildChatRoom({maxPoints: 2, artistPoints: true});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).nthCalledWith(1, CLIENT_1, 2);

  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_1);

  pa.finishTheRound();

  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);
});

test('maxPoints = 4, artist point becomes a title point', () => {
  let chatRoom = buildChatRoom({maxPoints: 4, artistPoints: true});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_1);
  expect(chatRoom.grantScore).not.toBeCalled();

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_2);
  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).nthCalledWith(1, CLIENT_2, 4);

  // CLIENT_1 gets a title after they got the artist.
  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  expect(chatRoom.grantScore).toBeCalledTimes(2);
  expect(chatRoom.grantScore).nthCalledWith(2, CLIENT_1, 3);

  pa.finishTheRound();

  // No more artist points awarded, the one we had already transitioned to a
  // title point.
  expect(chatRoom.grantScore).toBeCalledTimes(2);
  expect(chatRoom.guessingDone).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);
});

test('maxPoints = 5, big case', () => {
  const CLIENT_3 = {id: () => "3"};
  const CLIENT_4 = {id: () => "4"};
  const CLIENT_5 = {id: () => "5"};

  let chatRoom = buildChatRoom({maxPoints: 5, artistPoints: true});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  // Three correct artists right away.
  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_1);
  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_2);
  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_3);
  expect(chatRoom.grantScore).not.toBeCalled();

  // CLIENT_2 gets the title as well, getting 5 points.
  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_2);
  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).nthCalledWith(1, CLIENT_2, 5);

  // CLIENT_4 gets the title.
  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_4);
  expect(chatRoom.grantScore).toBeCalledTimes(2);
  expect(chatRoom.grantScore).nthCalledWith(2, CLIENT_4, 4);

  expect(chatRoom.guessingDone).not.toBeCalled();
  pa.finishTheRound();

  // Remaining artist points awarded at this point.
  expect(chatRoom.grantScore).toBeCalledTimes(4);
  expect(chatRoom.grantScore).nthCalledWith(3, CLIENT_1, 3);
  expect(chatRoom.grantScore).nthCalledWith(4, CLIENT_3, 2);
  expect(chatRoom.guessingDone).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);
});
