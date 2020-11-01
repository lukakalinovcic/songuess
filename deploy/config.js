module.exports = function(exports) {

  exports.client.masterServer = "wss://songuess.live/ws/";
  exports.client.cookieStorage = "DummyStorage";

  exports.server.indexHtml = "index.min.html";
  exports.server.htdocsDir = null;
  exports.server.staticMaxAge = 3600;
  exports.server.port = 52066

  exports.socket.ignoreNetworkProblems = true;
  exports.socket.pingInterval = 15;

  exports.sync.maxClockDeviation = 50;
};
