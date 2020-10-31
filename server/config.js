/*jslint indent: 2, plusplus: true*/
'use strict';

var currentEnv = process.env.NODE_ENV || 'developement';

exports.server = {
  // where to listen.
  port  : 8080,

  // this file will be served when server
  // is hit with GET / .. or null
  indexHtml : '../client/index.html',

  // if htdocsDir is set, master will serve files from that dir to http
  // clients. content-types are set only for html, js and css
  htdocsDir : '../client/',

  // if set, this field will be sent with static files as 'Cache-Control:
  // max-age='
  // or null not to send that header.
  staticMaxAge : null,

  // when set to true static file will be re-read for every request.
  // this option should not be used on production. this option will turn
  // off previous option (caching).
  readFileOnRequest : true
};

exports.socket = {
  // ping will be sent  every pingInterval seconds to client
  // to keep the connection alive across non patient firewalls.
  pingInterval : 60,

  // this will turn of clock skew checks and sleepyPeriod checks
  ignoreNetworkProblems : false,

  // if socket notices sleepyPeriod seconds without user activity, that user
  // will get disconnected.
  sleepyPeriod : 30 * 60
};

exports.sync = {
  // number of sync request sent to client
  numberOfSamples   : 10,

  // from every request clock offset is caluclated. after all samples are sent,
  // if offset standard deviation is larger than this value, process is
  // restarted.
  maxClockDeviation : 10,

  // if client has ping larger than this value, it can't play.
  maxPing           : 1000
};

exports.auth = {
  clientID    :  '975171789069.apps.googleusercontent.com',
  verifyURL   :  'https://www.googleapis.com/oauth2/v1/tokeninfo',
  profileURL  :  'https://www.googleapis.com/oauth2/v1/userinfo',
  scope       :  [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'openid'
  ]
};

// this JSON will be returned by static server on /config.js.
exports.client = {
  // nodejs master server
  masterServer : "ws://localhost:8080/",

  // can be DummyStorage, or FileStorage
  cookieStorage : "FileStorage",

  // for each chunk client gets primary and secondary URL.
  // client should download primary URL and only
  // if this timeout passes, secondary URL is queried.
  primaryChunkDownloadTimeout : 1500,

  // copied values from server config to client config
  authClientID : exports.auth.clientID,
  authScope : exports.auth.scope
};

// try and figure out how to use override.
if (require('fs').existsSync('./config.override.js')) {
  require('./config.override.js')(exports);
}
