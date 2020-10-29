// media_ui
function MediaUI(media) {

  var that = this;

  function initialize() {
    $(".media form").submit(function () {
      let roomName = $("#name").val();
      if (roomName.length < 1) {
        alert("Room name can't be empty");
        return false;
      }
      if (roomName[0] !== '#') {
        roomName = '#' + roomName;
      }
      media.handleNewRoom({
        name : roomName,
        desc : $("#desc").val(),
        streamFromMiddle : false
      }, function (err) {
        alert(err);
      });
      return false;
    });
    $(document).keydown(function (e) {
      if (e.keyCode == 27) {
        that.hideDialog();
      }
    });
    $(window).on('hashchange', function() {
      that.hideDialog();
    });
  }

  this.showDialog = function (name) {
    if (name === '#newRoom') {
      name = "";
    }
    $(".layout.chat").hide();
    $(".layout.media").show();
    $("#desc").val("");
    $("#name").val(name).focus();
  }

  this.hideDialog = function () {
    $(".layout.media").hide();
    // this is not in our district, but we will
    // do it :)
    $(".layout.chat").show();
    $(".layout.chat input").focus();
  }

  initialize();
}
