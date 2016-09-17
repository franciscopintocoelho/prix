var iothub = require('azure-iothub');
var child = require('child_process');

var AzureIOT = function (deviceId, frequency) {

  var deviceId = deviceId;
  var frequency = frequency;
  var connectionString = 'HostName=prix.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=P0+Yi9IHdqN/35go3aroNPD1HFMn9ggwUSzit0w6QA0=';

  var registry = iothub.Registry.fromConnectionString(connectionString);

  var clientFromConnectionString = require('azure-iot-device-amqp').clientFromConnectionString;
  var Message = require('azure-iot-device').Message;

  var device = new iothub.Device(null);
  var data, message, status;
  var client;

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
      var deviceString = 'HostName=prix.azure-devices.net;DeviceId=' + deviceInfo.deviceId + ';SharedAccessKey=' + deviceInfo.authentication.SymmetricKey.primaryKey;

      console.log('Device id: ' + deviceInfo.deviceId);
      console.log('Device key: ' + deviceInfo.authentication.SymmetricKey.primaryKey);

      client = clientFromConnectionString(deviceString);

      var connectCallback = function (err) {
        if (err) {
          console.log('Could not connect: ' + err);
        } else {
          console.log('Client connected');

          // Create a message and send it to the IoT Hub every second
          setInterval(function () {
            data = JSON.stringify(status);
            message = new Message(data);

            console.log("Sending message: " + message.getData());
            client.sendEvent(message, printResultFor('send'));

          }, frequency);

          client.on('message', function (msg) {
            console.log(msg.data.command);
            /*child.exec(msg.data.command, function (error, stdout, stderr) {
              if(error) console.log(stderr);
              else console.log(stdout);
            });*/
          });
        }
      };

      client.open(connectCallback);
    }
  };

  function setStatus(distance, state) {
    status = { deviceId: deviceId, distance: distance, state: state };
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
    }
  };
};

module.exports = AzureIOT;