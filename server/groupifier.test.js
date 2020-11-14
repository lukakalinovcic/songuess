/*jslint indent: 2, plusplus: true*/
"use strict";

var Groupify = require('./groupifier.js').Groupify;

function newClient(id, group, score) {
  return {
    id: () => id,
    local: (type) => (type === 'score')? score: group
  };
}

function buildClients(clientsArr) {
  let clients = {};
  for (let client of clientsArr) {
    clients[client.id()] = client;
  }
  return clients;
}

test('everyone already in a group', () => {
  let c1 = newClient(1, 1, 2);
  let c2 = newClient(2, 2, 3);
  let c3 = newClient(3, 2, 0);
  let clients = buildClients([c1, c2, c3]);

  expect(Groupify(clients, 2)).toEqual([]);
});

test('2 clients 2 groups', () => {
  let c1 = newClient(1, 0, 2);
  let c2 = newClient(2, 0, 3);
  let clients = buildClients([c1, c2]);

  expect(Groupify(clients, 2)).toEqual([
    {client: c1, group: 1},
    {client: c2, group: 2}
  ]);
});

test('50 clients 10 groups', () => {
  const numClients = 50;
  const numGroups = 10;

  let c = new Array();
  for (let id = 1; id <= numClients; ++id) {
    c.push(newClient(id, 0, 10));
  }
  let clients = buildClients(c);

  let result = Groupify(clients, numGroups);
  let groupSize = Array(numGroups).fill(0);
  for (let assignment of result) {
    groupSize[assignment.group - 1] += 1;
  }
  expect(Math.max(...groupSize)).toEqual(Math.min(...groupSize));
});


test('1 client dominating', () => {
  let c1 = newClient(101, 2, 100);
  let c2 = newClient(201, 0, 9);
  let c3 = newClient(301, 0, 8);
  let c4 = newClient(401, 0, 7);
  let c5 = newClient(501, 0, 6);
  let clients = buildClients([c1, c2, c3, c4, c5]);

  expect(Groupify(clients, 2)).toEqual([
    {client: c2, group: 1},
    {client: c3, group: 1},
    {client: c4, group: 1},
    {client: c5, group: 1}
  ]);
});
