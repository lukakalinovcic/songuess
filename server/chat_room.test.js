/*jslint indent: 2, plusplus: true*/
"use strict";

var ChatRoom = require('./chat_room').ChatRoom;

function buildChatRoom(maxPoints, artistPoints) {
  let cr = new ChatRoom({
      name : 'room1',
      desc : '',
      streamFromMiddle: false,
      maxPoints: maxPoints,
      artistPoints: artistPoints? true: false
  });

// add mocks!
//    getNumberOfClients: jest.fn().mockName('getNumberOfClients').mockReturnValue(10),

  return cr;
}

test('dummy', () => {});

// TODO finish the test
//test('a client joins, song starts, correct answer given', () => {
//  var cr = buildChatRoom(/*maxPoints=*/ 1);
//
//  let chatRoom = buildChatRoom({maxPoints: 1});
//  let pa = new PointsAssigner(ITEM, chatRoom);
//  let when = 1;
//
//  expect(pa.gotAnswer({what: 'wrong', when: when++}, CLIENT_1)).toBe(false);
//
//  expect(chatRoom.grantScore).not.toBeCalled();
//  expect(chatRoom.guessingDone).not.toBeCalled();
//});
//
