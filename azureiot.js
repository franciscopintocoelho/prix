var iothub = require('azure-iothub');

var AzureIOT = function (app) {

  var deviceId = 'prix-1';
  var connectionString = 'HostName=prix.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=P0+Yi9IHdqN/35go3aroNPD1HFMn9ggwUSzit0w6QA0=';

  var registry = iothub.Registry.fromConnectionString(connectionString);

  var clientFromConnectionString = require('azure-iot-device-amqp').clientFromConnectionString;
  var Message = require('azure-iot-device').Message;

  var device = new iothub.Device(null);
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
    if (deviceInfo) {
      var deviceString = 'HostName=PRIX.azure-devices.net;DeviceId=' + deviceInfo.deviceId + ';SharedAccessKey=' + deviceInfo.authentication.SymmetricKey.primaryKey;

      console.log('Device id: ' + deviceInfo.deviceId);
      console.log('Device key: ' + deviceInfo.authentication.SymmetricKey.primaryKey);

      client = clientFromConnectionString(deviceString);

      var connectCallback = function (err) {
        if (err) {
          console.log('Could not connect: ' + err);
        } else {
          console.log('Client connected');
        }
      };

      client.open(connectCallback);
    }
  };

  function sendData(data) {
    var data = JSON.stringify({ deviceId: deviceId, distance: (data / 255), state: state });
    var message = new Message(data);
    console.log("Sending message: " + message.getData());
    client.sendEvent(message, printResultFor('send'));
  }

  function printResultFor(op) {
    return function printResult(err, res) {
      if (err) console.log(op + ' error: ' + err.toString());
      if (res) console.log(op + ' status: ' + res.constructor.name);
    };
  }


  return {
    sendMessage: function () {

    }
  };
};

module.exports = AzureIOT;