var iothub = require('azure-iothub');
var child = require('child_process');

var AzureIOT = function (config) {

  var deviceId = config.deviceId;
  var interval = config.interval;
  var hostname = config.hostname;
  var connectionString = config.connectionString;

  var registry = iothub.Registry.fromConnectionString(connectionString);

  var clientFromConnectionString = require('azure-iot-device-' + config.protocol).clientFromConnectionString;
  var Message = require('azure-iot-device').Message;

  var device = new iothub.Device(null);
  var data, message, status;
  var client, connected;

  device.deviceId = deviceId;
  registry.create(device, function (err, deviceInfo, res) {
    if (err) {
      registry.get(device.deviceId, connectDevice);
    } else if (deviceInfo) {
      connectDevice(err, deviceInfo, res);
    }
  });

  function connectDevice(err, deviceInfo, res) {
    if (!err && deviceInfo) {
      var deviceString = 'HostName=' + hostname + ';DeviceId=' + deviceInfo.deviceId + ';SharedAccessKey=' + deviceInfo.authentication.SymmetricKey.primaryKey;

      console.log('Device id: ' + deviceInfo.deviceId);
      console.log('Device key: ' + deviceInfo.authentication.SymmetricKey.primaryKey);

      client = clientFromConnectionString(deviceString);

      var connectCallback = function (err) {
        if (err) {
          console.log('Could not connect: ' + err);
        } else {
          connected = true;
          console.log('Client connected');

          // Create a message and send it to the IoT Hub every second
          setInterval(function () {
            if (status.distance) {
              data = JSON.stringify(status);
              message = new Message(data);

              console.log("Sending message: " + message.getData());
              client.sendEvent(message, printResultFor('send'));
            }
          }, interval);

          client.on('message', function (msg) {
            console.log('message: ' + msg.data.data);
            client.complete(msg, printResultFor('completed'));
            child.exec(msg.data.data, function (error, stdout, stderr) {
              if (error) console.log(stderr);
              else console.log(stdout);
            });
          });
        }
      };

      client.open(connectCallback);
    }
  };

  function setStatus(distance, state) {
    status = { deviceId: deviceId, distance: distance, state: state };
  }

  function sendError(error) {
    var obj = { deviceId: deviceId, error: error };
    var errData = JSON.stringify(obj);
    var errMessage = new Message(errData);

    if (connected) client.sendEvent(errMessage, printResultFor('send'));
  }

  function printResultFor(op) {
    return function printResult(err, res) {
      if (err) console.log(op + ' error: ' + err.toString());
      if (res) console.log(op + ' status: ' + res.constructor.name);
    };
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