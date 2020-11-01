/*jslint indent: 2, plusplus: true*/
"use strict";

var
  PointsAssigner = require('./points_assigner'),
  TITLE = 'some title',
  ARTIST = 'some artist',
  ITEM = {title: TITLE, artist: ARTIST},
  CLIENT_1 = {id: () => "1"},
  CLIENT_2 = {id: () => "2"},
  CLIENT_3 = {id: () => "3"},
  CLIENT_4 = {id: () => "4"};

function buildChatRoom(desc) {
  return {
    grantScore: jest.fn().mockName('grantScore'),
    broadcast: jest.fn().mockName('broadcast'),
    guessingDone: jest.fn().mockName('guessingDone'),
    // For most tests a big number of clients is assumed.
    getNumberOfClients: jest.fn().mockName('getNumberOfClients').mockReturnValue(10),
    desc: desc
  };
}

test('maxPoints = 1, wrong answer', () => {
  let chatRoom = buildChatRoom({maxPoints: 1});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  expect(pa.gotAnswer({what: 'wrong', when: when++}, CLIENT_1)).toBe(false);

  expect(chatRoom.grantScore).not.toBeCalled();
  expect(chatRoom.guessingDone).not.toBeCalled();
});

test('maxPoints = 1, correct answer', () => {
  let chatRoom = buildChatRoom({maxPoints: 1});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  expect(pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1)).toBe(true);

  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).toBeCalledWith(CLIENT_1, 1, false, true);
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
  expect(chatRoom.grantScore).toBeCalledWith(CLIENT_1, 2, false, false);
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
  expect(chatRoom.grantScore).nthCalledWith(1, CLIENT_1, 2, false, false);

  pa.gotAnswer({what: 'wrong', when: when++}, CLIENT_1);
  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_2);
  expect(chatRoom.grantScore).toBeCalledTimes(2);
  expect(chatRoom.grantScore).nthCalledWith(2, CLIENT_2, 1, false, true);

  expect(chatRoom.guessingDone).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);
});

test('maxPoints = 2, dont award to same client twice', () => {
  let chatRoom = buildChatRoom({maxPoints: 2});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).toBeCalledWith(CLIENT_1, 2, false, false);
  // This client already got the title point.
  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  expect(chatRoom.grantScore).toBeCalledTimes(1);

  // Guessing is not done, still 1 more point to give out.
  expect(chatRoom.guessingDone).not.toBeCalled();
});

test('maxPoints = 3, 3 correct guesses get 3,2,1 points', () => {
  let chatRoom = buildChatRoom({maxPoints: 3});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).nthCalledWith(1, CLIENT_1, 3, false, false);

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_2);
  expect(chatRoom.grantScore).toBeCalledTimes(2);
  expect(chatRoom.grantScore).nthCalledWith(2, CLIENT_2, 2, false, false);
  expect(chatRoom.guessingDone).not.toBeCalled();

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_3);
  expect(chatRoom.grantScore).toBeCalledTimes(3);
  expect(chatRoom.grantScore).nthCalledWith(3, CLIENT_3, 1, false, true);

  expect(chatRoom.guessingDone).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);
});

test('maxPoints = 1, artist ignored if option not set', () => {
  let chatRoom = buildChatRoom({maxPoints: 1});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  expect(pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_1)).toBe(false);

  expect(chatRoom.grantScore).not.toBeCalled();
  expect(chatRoom.guessingDone).not.toBeCalled();
});

test('maxPoints = 1, artistPoints', () => {
  let chatRoom = buildChatRoom({maxPoints: 1, artistPoints: true});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  expect(pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_1)).toBe(true);

  expect(chatRoom.guessingDone).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);

  pa.giveAnyRemainingArtistPoints();
  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).nthCalledWith(1, CLIENT_1, 1, true);
});

test('maxPoints = 2, artistPoints, only titles guessed', () => {
  let chatRoom = buildChatRoom({maxPoints: 2, artistPoints: true});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).nthCalledWith(1, CLIENT_1, 2, false, false);
  expect(chatRoom.guessingDone).not.toBeCalled();

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_2);
  expect(chatRoom.grantScore).toBeCalledTimes(2);
  expect(chatRoom.grantScore).nthCalledWith(2, CLIENT_2, 1, false, true);

  expect(chatRoom.guessingDone).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);
});

test('maxPoints = 2, one correct title one artist', () => {
  let chatRoom = buildChatRoom({maxPoints: 2, artistPoints: true});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).nthCalledWith(1, CLIENT_1, 2, false, false);
  expect(chatRoom.guessingDone).not.toBeCalled();

  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_2);
  expect(chatRoom.guessingDone).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);

  pa.giveAnyRemainingArtistPoints();
  expect(chatRoom.grantScore).toBeCalledTimes(2);
  expect(chatRoom.grantScore).nthCalledWith(2, CLIENT_2, 1, true);
});

test('maxPoints = 3, artist points only', () => {
  let chatRoom = buildChatRoom({maxPoints: 3, artistPoints: true});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_1);
  expect(chatRoom.grantScore).not.toBeCalled();

  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_2);
  expect(chatRoom.grantScore).not.toBeCalled();

  pa.giveAnyRemainingArtistPoints();
  expect(chatRoom.grantScore).toBeCalledTimes(2);
  expect(chatRoom.grantScore).nthCalledWith(1, CLIENT_1, 3, true);
  expect(chatRoom.grantScore).nthCalledWith(2, CLIENT_2, 2, true);
  expect(chatRoom.guessingDone).not.toBeCalled();
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
  expect(chatRoom.grantScore).nthCalledWith(1, CLIENT_2, 3, false, false);

  // CLIENT_2 already got 3 title points, CLIENT_1 gets 2 artist points.
  pa.giveAnyRemainingArtistPoints();
  expect(chatRoom.grantScore).toBeCalledTimes(2);
  expect(chatRoom.grantScore).nthCalledWith(2, CLIENT_1, 2, true);
  expect(chatRoom.guessingDone).not.toBeCalled();
});

test('maxPoints = 2, artist point ignored if you already have a title point', () => {
  let chatRoom = buildChatRoom({maxPoints: 2, artistPoints: true});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).nthCalledWith(1, CLIENT_1, 2, false, false);

  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_1);

  pa.giveAnyRemainingArtistPoints();
  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).not.toBeCalled();
});

test('maxPoints = 4, artist point becomes a title point', () => {
  let chatRoom = buildChatRoom({maxPoints: 4, artistPoints: true});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_1);
  expect(chatRoom.grantScore).not.toBeCalled();

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_2);
  expect(chatRoom.grantScore).toBeCalledTimes(1);
  expect(chatRoom.grantScore).nthCalledWith(1, CLIENT_2, 4, false, false);

  // CLIENT_1 gets a title after they got the artist.
  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  expect(chatRoom.grantScore).toBeCalledTimes(2);
  expect(chatRoom.grantScore).nthCalledWith(2, CLIENT_1, 3, false, false);

  // No more artist points awarded, the one we had already transitioned to a
  // title point.
  pa.giveAnyRemainingArtistPoints();
  expect(chatRoom.grantScore).toBeCalledTimes(2);
  expect(chatRoom.guessingDone).not.toBeCalled();
});

test('maxPoints = 5, big case', () => {
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
  expect(chatRoom.grantScore).nthCalledWith(1, CLIENT_2, 5, false, false);

  // CLIENT_4 gets the title.
  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_4);
  expect(chatRoom.grantScore).toBeCalledTimes(2);
  expect(chatRoom.grantScore).nthCalledWith(2, CLIENT_4, 4, false, false);

  expect(chatRoom.guessingDone).not.toBeCalled();

  // Remaining artist points awarded at this point.
  pa.giveAnyRemainingArtistPoints();
  expect(chatRoom.grantScore).toBeCalledTimes(4);
  expect(chatRoom.grantScore).nthCalledWith(3, CLIENT_1, 3, true);
  expect(chatRoom.grantScore).nthCalledWith(4, CLIENT_3, 2, true);
  expect(chatRoom.guessingDone).not.toBeCalled();
});

test('playon is respected', () => {
  let chatRoom = buildChatRoom({maxPoints: 1});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: TITLE + " #playon", when: when++}, CLIENT_1);

  expect(chatRoom.guessingDone).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/true);
});

test('finish early when number of clients is small', () => {
  let chatRoom = buildChatRoom({maxPoints: 4});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  chatRoom.getNumberOfClients.mockReturnValue(2);

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_2);

  // Because there are only 2 clients, the game should finish even though there
  // are more points to assign.
  expect(chatRoom.guessingDone).toBeCalledTimes(1);
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);
});

test('client leaves, game finishes', () => {
  let chatRoom = buildChatRoom({maxPoints: 3});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  chatRoom.getNumberOfClients.mockReturnValue(3);

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_2);
  // 3 players, 3 max points, so still one more point to give out.
  expect(chatRoom.guessingDone).not.toBeCalled();

  chatRoom.getNumberOfClients.mockReturnValue(2);
  pa.clientLeft(CLIENT_3);
  // Now however, the round should be finished, all the players already have
  // some points.
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);
});

test('client with a title point leaves', () => {
  let chatRoom = buildChatRoom({maxPoints: 3});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  chatRoom.getNumberOfClients.mockReturnValue(3);

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_2);
  // 3 players, 3 max points, so still one more point to give out.
  expect(chatRoom.guessingDone).not.toBeCalled();

  chatRoom.getNumberOfClients.mockReturnValue(2);
  // This client had a title point and now left.
  pa.clientLeft(CLIENT_1);
  // Round NOT finished, one point is remaining to be given out.
  expect(chatRoom.guessingDone).not.toBeCalled();

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_3);
  // Now we're done.
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);
});

test('client with an artist point leaves', () => {
  let chatRoom = buildChatRoom({maxPoints: 3, artistPoints: true});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  chatRoom.getNumberOfClients.mockReturnValue(3);

  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_1);
  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_2);
  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_3);
  // At this point, CLIENT_2 got his 3 points, and other two players have
  // correct artists and no points awarded yet.
  expect(chatRoom.guessingDone).not.toBeCalled();

  // The CLIENT_1 leaves.
  chatRoom.getNumberOfClients.mockReturnValue(2);
  pa.clientLeft(CLIENT_1);
  // The round should finish, because the remaining CLIENT_3 can't get anything
  // else but 2 points, even if they provide a correct title.
  expect(chatRoom.guessingDone).toBeCalledWith(/*playon=*/false);
});

test('broadcast works correctly, artistPoints: false', () => {
  let chatRoom = buildChatRoom({maxPoints: 2});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_2);

  expect(chatRoom.broadcast).toBeCalledTimes(1);
  expect(chatRoom.broadcast).nthCalledWith(1, 'correct_title', {
    who: "1",
    when: 1,
    numPoints: 2
  });
});

test('broadcast works correctly, artistPoints: true', () => {
  let chatRoom = buildChatRoom({maxPoints: 2, artistPoints: true});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: TITLE, when: when++}, CLIENT_1);
  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_2);

  expect(chatRoom.broadcast).toBeCalledTimes(2);
  expect(chatRoom.broadcast).nthCalledWith(1, 'correct_title', {
    who: "1",
    when: 1,
    numPoints: 2
  });
  expect(chatRoom.broadcast).nthCalledWith(2, 'correct_artist', {
    who: "2",
    when: 2
  });
});

test('more artist points than maxPoints', () => {
  let chatRoom = buildChatRoom({maxPoints: 2, artistPoints: true});
  let pa = new PointsAssigner(ITEM, chatRoom);
  let when = 1;

  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_1);
  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_2);
  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_3);
  pa.gotAnswer({what: ARTIST, when: when++}, CLIENT_4);
  expect(chatRoom.grantScore).not.toBeCalled();
 
  // Only 2 people can get points (maxPoints=2).
  pa.giveAnyRemainingArtistPoints();
  expect(chatRoom.grantScore).toBeCalledTimes(2);
  expect(chatRoom.grantScore).nthCalledWith(1, CLIENT_1, 2, true);
  expect(chatRoom.grantScore).nthCalledWith(2, CLIENT_2, 1, true);
  expect(chatRoom.guessingDone).not.toBeCalled();
});

