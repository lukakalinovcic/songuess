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
