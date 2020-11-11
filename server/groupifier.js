/*jslint indent: 2, plusplus: true*/
"use strict";

exports.Groupify = function (clients, numGroups) {
  // clients is an object, keys are client IDs, values are chat_client.js objects.
  // relevant parts of the chat_client.js object:
  //   - client.id() -> id, also used as a key in the given map-object
  //   - client.local('group') -> integer containing the current group (0 if no group)
  //   - client.local('score') -> current score
  //
  // numGroups is the requested number of groups.
  //
  // the function should move all the clients that are currently not in any
  // group to a new or existing group, so that after all the moves:
  //   - exactly numGroups groups exist
  //   - sum of scores between the groups is as close as possible
  //     (up to you how exactly to define this)
  //
  // return value should be an array of assignment objects
  // each assignment object should be of type {
  //   client: the client object,
  //   group: an integer, new group assignment for this client
  // }
  //

  return [];
};

