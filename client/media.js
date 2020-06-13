function Media(wsock, onFatal) {

  var that = this,
    ui = new MediaUI(this),
    onFinish;

  this.newRoomDialog = function (name, pOnFinish) {
    onFinish = pOnFinish;
    ui.showDialog(name);
  };

  this.handleNewRoom = function (room, err) {
    wsock.sendType("create_room", {
      room : room
    });
    wsock.onMessage("create_room", function (data) {
      if (data.success === true) {
        ui.hideDialog();
        onFinish(room.name);
      } else {
        err("Couldn't create the room: " + data.msg);
      }
    });
  };
}
