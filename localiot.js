var io = require('socket.io-client');

var AzureIOT = function (config) {

  var deviceId = config.deviceId;
  var interval = config.interval;

  var status = { distance: -1, state: -1 };;

  socket = io('http://192.168.1.100:8080');
  // Create a message and send it to the IoT Hub every second
  socket.on('connect', function () {
    setInterval(function () {
      if (status && status.distance) {
        socket.emit('message', status);
      }
    }, interval);
  });


  function setStatus(distance, state) {
    status = { deviceId: deviceId, distance: distance, state: state };
  }

  function sendError(error) {
    var obj = { deviceId: deviceId, error: error };
    socket.emit('message', obj);
  }

  return {
    setStatus: function (distance, state) {
      setStatus(distance, state);
    },

    sendError: function (error) {
      sendError(error);
    }
  };
};

module.exports = AzureIOT;