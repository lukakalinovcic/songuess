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
      const maxPoints = parseInt($("#max_points").val());
      const artistPoints = $("#artist_points").prop('checked');
      if (artistPoints && maxPoints == 1) {
        alert("Max points should be at least 2 when using artist points.");
        return false;
      }
      media.handleNewRoom({
        name : roomName,
        desc : $("#desc").val(),
        streamFromMiddle : false,  //$("#stream_from_middle").prop('checked')
        maxPoints : maxPoints,
        artistPoints : artistPoints
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
