// instantied only when DOM is ready.
// user is current logged in user.
function ChatUI(chat, user) {

  var
    body,
    users_list,
    input,
    user,
    announceTimer,
    that = this;

  function entry (type, html, when) {
    var t0 = chat.getRoomState().songStart, what;
    when = when || myClock.clock();
    state = chat.getRoomState().state;
    if (type.indexOf("cmd") !== -1) {
      what = pretty.delimit(">");
    } else if (type.indexOf("err") !== -1) {
      what = pretty.delimit("!");
    } else if (state === "dead") {
      what = pretty.delimit("|");
    } else if (t0 && type.indexOf("relative") !== -1) {
      what = pretty.playTime(when - t0);
    } else if (state === "suspense") {
      what = pretty.delimit();
    } else {
      what = pretty.delimit("|");
    }
    what = what + " " + html;
    $("<div>")
      .addClass("entry")
      .addClass(type)
      .html(what)
      .appendTo(body);
    $(body)
      .scrollTop(body.scrollHeight);
  }

  function notify (title, options) {
    if ((document.hidden || document.webkitHidden || document.msHidden) &&
        Notification && Notification.permission &&
        Notification.permission === 'granted') {
      var notif = new Notification(title, options);
      notif.onshow = function(){
        setTimeout(function(){notif.close();}, 5000);
      }
    }
  }

  this.clear = function () {
    $(body).empty();
  };

  this.youEntered = function (data) {
    entry("sys", "You entered " + data.desc.name
                 + " (" + data.desc.desc + ").");
    if (data.desc.name === "#root") {
      entry("sys", "Type /help for help.");
    }
  };

  this.userJoined = function (id, reason) {
    entry("sys",
      pretty.clientFullName(chat.getClient(id))
      + " joined the room.");
  };

  this.userLeft = function (id, reason) {
    entry("sys",
      pretty.client(chat.getClient(id))
      + " left: " + reason);
  };

  this.calledIDontKnow = function (desc) {
    if (!desc.implicitIdk) {
      entry("sys", pretty.client(chat.getClient(desc.who)) + " calls /idk.");
    }
    if (desc.hasOwnProperty('answer')) {
      if (desc.state === "playon") {
        entry("sys wrong", " Moving on.");
      } else {
        entry("sys wrong",
              " The song was " + pretty.song(desc.answer) + ".");
      }
    }
  };

  this.showHint = function (hint) {
    entry("sys", "Hint: " + pretty.song(hint));
  };

  this.honored = function (desc) {
    entry("sys correct",
      pretty.client(chat.getClient(desc.from)) +
      " honored this point to " +
      pretty.client(chat.getClient(desc.to)) +
         "!");
    that.updateList();
  };

  this.displayInfo = function (song) {
    entry("sys", " hmmm, You ask last song what was?");
    entry("sys", " artist: " + pretty.bold(song.artist));
    entry("sys", " album : " + pretty.bold(song.album));
    entry("sys", " title : " + pretty.bold(song.title));
    // Display all alternate titles.
    var alt_index = 2, key;
    for (;;) {
      key = "title" + (alt_index++);
      if (song.hasOwnProperty(key)) {
        entry("sys", " " + key + ": " + pretty.bold(song[key]));
      } else {
        break;
      }
    }
    // Note who fixed the title.
    if (song.fixed_by_id) {
      // This will not work as song.fixed_by_id is pid (not id)
      if (chat.hasClient(song.fixed_by_id)) {
        entry("sys", " (entered by: " +
            pretty.client(chat.getClient(song.fixed_by_id))
            + ")");
      } else {
        entry("sys", " (entered by: " + song.fixed_by_email + ")");
      }
    }
  };

  this.displayRoomDescription = function (desc) {
    entry("sys", desc? desc: "No room description.");
  };

  this.correctArtist = function (who, when) {
    entry("sys relative", pretty.client(chat.getClient(who)) + " got the artist!", when);
  }

  this.correctTitle = function (who, numPoints, when, roll) {
    let client = pretty.client(chat.getClient(who));
    let msg = roll ?
      "<a href=\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\" target=\"_blank\">" +
      client + "</a>" : client;
    msg += " got the title";
    if (numPoints) {
      let optionalS = numPoints == 1? "" : "s";
      msg += " (" + numPoints + " point" + optionalS + ")";
    }
    entry("sys relative", msg + "!", when);
    this.updateList();
  }

  this.guessingDone = function (data) {
    entry("sys correct",
      "Guessing done! The song was " + pretty.song(data.answer) + "." +
      (data.state == "playon" ? " #playon - can't stop." : ""));
    this.updateList();
  };

  this.grantArtistScore = function (who, numPoints) {
    let optionalS = numPoints == 1? "" : "s";
    entry("sys",
      pretty.client(chat.getClient(who)) + " gets " + numPoints +
      " artist point" + optionalS + ".");
    this.updateList();
  };

  this.calledReset = function (desc) {
    entry("sys", " " +
      pretty.client(chat.getClient(desc.who)) +
      " /reset his score.");
    this.updateList();
  };

  this.songEnded = function (desc) {
    if (desc.state === "playon") {
      entry("sys wrong", " Song ended.");
    } else {
      entry("sys wrong", " No one got this one - " +
        pretty.song(desc.answer));
    }
  };

  this.announceSong = function () {
    entry("sys", "");
    entry("sys relative", " Get ready!");
  };

  this.addMessage = function (msg) {
    var cl = [], state = chat.getRoomState().state;
    if (state === "playing" || state === "playon" || state === "after") {
      cl.push("relative");
    }
    cl.push(msg.from === null || msg.me ? "sys" : "say");
    entry(cl.join(" "),
      (msg.from ?
        pretty.client(chat.getClient(msg.from)) +
          (msg.me ? " " : ": ")
        : "")
      + pretty.text(msg.what), msg.when);

    notify(
      (msg.from ? chat.getClient(msg.from).name : "") +
        (msg.me ? " " : ": ") + msg.what,
      {'icon': msg.from ? chat.getClient(msg.from).picture : null}
    );
  };

  this.displayWho = function (data) {
    var name, display;
    entry("sys", "You asked hmhmhm, who is where?");
    for (name in data) {
      if (data.hasOwnProperty(name)) {
        for (display in data[name]) {
          if (data[name].hasOwnProperty(display)) {
            entry("sys",
                  display + " is in " + name +
                  " with score " + data[name][display] + ".");
          }
        }
      }
    }
  };

  this.gotToken = function (token) {
    entry("sys", " You can use: " + pretty.text(token));
  };

  this.addNotice = function (what, cls) {
    entry("sys " + cls, what);
  };

  function prepareInputElement() {
    var lastInput = '';
    $(".chat form").submit(function () {
      if ($(input).val().length > 0) {
        chat.handleSend($(input).val());
        lastInput = $(input).val();
        $(input).val("");
      }
      return false;
    });
    $(input).on('keydown', function (evt) {
      if (evt.keyCode === 38) {
        var that = this;
        this.value = lastInput;
        setTimeout(function() {
          that.setSelectionRange(lastInput.length, lastInput.length);
        }, 0);
      }
      if (evt.keyCode === 40) {
        this.value = '';
      }
    });
  }

  (function () {
    var it;
    body = $(".chat .left")[0];
    input = $(".chat input")[0];
    prepareInputElement();
    $(".landing").hide();
    $(".layout.chat").show();
    $(input).focus();
    $(window)
      .on('hashchange', function() {
        chat.triggerCommand("/join " + location.hash);
      })
      .on('resize', function() {
        $(body)
          .scrollTop(body.scrollHeight);
      });

    users_list = new GroupedUsersList(chat, $(".chat .right"));
    that.updateList = users_list.updateList;
  }());

}
