/*jslint indent: 2, plusplus: true*/
"use strict";

exports.Groupify = function (clients, numGroups) {
  function getScore(client) {
    return client.local('score') * 2 + 1;
  }

  let scores = new Array(numGroups).fill(0);
  let unassigned = new Array();
  for (const client of Object.values(clients)) {
    const group = client.local('group');
    if (group == 0) {
      unassigned.push(client);
    } else {
      scores[group - 1] += getScore(client);
    }
  }

  const n = unassigned.length;
  let minLoss = 1e10;
  let bestAssignment = null;
  let currAssignment = new Array();

  let seenScores = new Set();
  let totalIters = 0;
  let itersAtDepth = new Array(n).fill(0);

  let rec = function(i) {
    // Check if we've seen the same set of scores in a different assignment.
    const key = scores.toString();
    if (seenScores.has(key)) {
      return;
    } else {
      seenScores.add(key);
    }

    if (i == n) {
      // Everybody assigned, check if this is the best assignment.
      const loss = Math.max(...scores) - Math.min(...scores);
      if (loss < minLoss) {
        minLoss = loss;
        bestAssignment = [...currAssignment];
      }
    } else {
      // Take a greedy step if the computation seems to be expensive.
      totalIters += 1;
      itersAtDepth[i] += 1;
      const doGreedy = (totalIters >= 1000000) || (itersAtDepth[i] > 10000);

      const lo = doGreedy ? scores.indexOf(Math.min(...scores)) : 0;
      const hi = doGreedy ? lo + 1 : numGroups;
      for (let group = lo; group < hi; ++group) {
        currAssignment.push(group);
        scores[group] += getScore(unassigned[i]);
        rec(i + 1);
        scores[group] -= getScore(unassigned[i]);
        currAssignment.pop(group);
      }
    }
  };
  rec(0);

  let result = new Array();
  for (let i = 0; i < n; ++i) {
    result.push({
      client: unassigned[i],
      group: bestAssignment[i] + 1
    });
  } 
  return result;
};

