/*jslint indent: 2, plusplus: true*/
"use strict";

// The socket connected to a Chrome extension.
// Each chat room would have its own instance.
exports.HostSocket = function (socket, chatRoom, roomReadyHandler, songEndedHandler) {

  var doneHandler = null;
  var fetchedItem = null;

  // The server keeps the current song in memory, so it can send it all
  // to new clients joining the room.
  var audioData = [];

  function sendCommand(type) {
    console.log('sending command:', type);
    socket.send(JSON.stringify({type: type}));
  }

  function appendToAudioData(data) {
    // Concatenating type arrays (like Uint8Array) or ArrayBuffers is ugly,
    // so audioData is a normal Array object.
    audioData = audioData.concat(Array.from(new Uint8Array(data)));
    console.log('audioData length:', audioData.length);
  }

  function clearAudioData() {
    audioData = [];
    console.log('clearing audio data');
  }

  this.playNext = function (done) {
    if (doneHandler !== null) {
      done('still executing previous playNext');
      return;
    }

    doneHandler = function(item) {
      if (item) {
        done(null, item);
      } else {
        done('couldn\'t get the item');
      }

      doneHandler = null;
    };

    sendCommand('moveToNextSong');    
  };

  this.closeSocket = function() {
    clearAudioData();
    socket.close();
  };

  // Returns a Buffer, so it can be given to WebSocket directly.
  this.currentAudioData = function() {
    return Buffer.from(audioData);
  };

  (function () {
    socket.onmessage = function (event) {
      // Got audio data.
      if (event.data instanceof Buffer) {
        console.log('got audio with size:', event.data.length);
        chatRoom.broadcastRaw(event.data);
        appendToAudioData(event.data);
      } else {
        console.log('message ', event.data);

        var message = JSON.parse(event.data);
        var messageType = message.type;

        if (messageType == 'startedStreaming') {
          roomReadyHandler();
        } else if (messageType == 'moveToNextSong') {
          if (message.status == 'OK') {
            fetchedItem = message.data;

            // recorder.stop() has been called on the client at this point
            // now's the time to clear the host chunks in the client app
            chatRoom.broadcast('clear_host_chunks');

            // Clear the server audio data.
            clearAudioData();

            // Tell the extension to start playing.
            // The extension will start sending chunks, which again go through
            // this server. So it's not possible for a chunk to arrive before
            // the clients executed the clear_host_chunks command above.
            sendCommand('startPlaying');
          } else {
            if (doneHandler !== null) {
              doneHandler();
            }
          }
        } else if (messageType == 'startPlaying') {
          if (doneHandler !== null) {
            if (message.status == 'OK') {
              // The item was sent either here or previously with a
              // moveToNextSong message.
              doneHandler(message.data || fetchedItem);
            } else {
              doneHandler(null);
            }
          }
        } else if (messageType == 'songHasEnded') {
          songEndedHandler(); 
        }
      }
    };

    socket.onclose = function() {
      console.log('host socket closed itself');
      clearAudioData();
      chatRoom.detachHostSocket();
    };
  }());
};
