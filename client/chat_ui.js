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

  function entry (type, what) {
    $("<div>")
      .addClass("entry")
      .addClass(type)
      .html(what)
      .appendTo(body);
    $(body)
      .scrollTop(body.scrollHeight);
  }

  this.clear = function () {
    $(body).empty();
  };

  this.addNotice = function (what) {
    entry("sys",
      pretty.time(myClock.clock()) + " "
      + pretty.text(what));
  };

  this.youEntered = function (data) {
    var playlist = data.desc.playlist;
    pretty.relativeTime();
    this.addNotice("You entered " + data.desc.name
                 + " (" + data.desc.desc + ").");
    if (playlist.length) {
      this.addNotice("Playlist has " + playlist.length + " song"
                   + (playlist.length > 1 ? "s." : "."));
      if (data.started) {
        entry("sys", 
          pretty.time(myClock.clock())
          + " Current song is @ "
          + pretty.timeInterval(myClock.clock() - data.started) + "s.");
        pretty.relativeTime(data.started);
      }
    }
  };

  this.userJoined = function (id, reason) {
    entry("sys",
      pretty.time(myClock.clock()) + " " +
      pretty.nameClient(chat.getClient(id))
      + " joined the room.");
  };

  this.userLeft = function (id, reason) {
    entry("sys",
      pretty.time(myClock.clock()) + " " +
      pretty.nameClient(chat.getClient(id))
      + " left: " + reason);
  };

  this.calledNext = function (desc) {
    pretty.relativeTime();
    entry("sys wrong",
      pretty.time(desc.when, true) +
      " The song was " +
      pretty.song(desc.answer) + ". " +
      pretty.nameClient(chat.getClient(desc.who)) +
      " called for a next one :/");
  };

  this.correctAnswer = function (desc) {
    var client = chat.getClient(desc.who);
    entry("sys correct",
      pretty.time(myClock.clock(), 0, 1) + " Well done " +
      pretty.nameClient(client) +
      "! The song was " +
      pretty.song(desc.answer) + ".");
    this.updateList();
  };

  this.calledReset = function (desc) {
    entry("sys",
      pretty.time(desc.when, true) + " " +
      pretty.nameClient(chat.getClient(desc.who)) +
      " /reset-ed his score.");
    this.updateList();
  };

  this.songEnded = function (desc) {
    pretty.relativeTime();
    entry("sys wrong",
      pretty.time(desc.when) +
      " No one got this one - " +
      pretty.song(desc.answer));
  };

  this.announceSong = function (when) {
    pretty.relativeTime(when);
    entry("sys", pretty.time(myClock.clock()));
    entry("sys",
      pretty.time(myClock.clock(), true) + " Get ready!");
  };

  this.addMessage = function (msg) {
    entry("say",
      pretty.time(msg.when) + " " +
      (msg.from ?
        pretty.nameClient(chat.getClient(msg.from)) + ": "
        : "")
      + pretty.text(msg.what));
  };

  this.gotToken = function (token) {
    entry("sys",
      pretty.time(desc.when, true) +
      " You can use: " + pretty.text(token));
  };

  (function () {
    var it;
    body = $(".chat .left")[0];
    input = $(".chat input")[0];
    $(".chat form").submit(function () {
      if ($(input).val().length > 0) {
        chat.handleSend($(input).val());
        $(input).val("");
      }
      return false;
    });
    $("h1").hide();
    $(".layout.chat").show();
    $(".chat .col").click(function () {
      $(input).focus();
    });
    $(input).focus();
    $(window)
      .on('hashchange', function() {
        chat.triggerCommand("/join " + location.hash);
      })
      .on('resize', function() {
        $(body)
          .scrollTop(body.scrollHeight);
      });

    users_list = new UsersList(chat, $(".chat .right"));
    that.updateList = users_list.updateList;
  }());

}
