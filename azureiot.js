var iothub = require('azure-iothub');

var AzureIOT = function (deviceId) {

  var deviceId = deviceId;
  var connected = false;
  var connectionString = 'HostName=prix.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=P0+Yi9IHdqN/35go3aroNPD1HFMn9ggwUSzit0w6QA0=';

  var registry = iothub.Registry.fromConnectionString(connectionString);

  var clientFromConnectionString = require('azure-iot-device-amqp').clientFromConnectionString;
  var Message = require('azure-iot-device').Message;

  var device = new iothub.Device(null);
  var batch = 10, messages = [];
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
      var deviceString = 'HostName=PRIX.azure-devices.net;DeviceId=' + deviceInfo.deviceId + ';SharedAccessKey=' + deviceInfo.authentication.SymmetricKey.primaryKey;

      console.log('Device id: ' + deviceInfo.deviceId);
      console.log('Device key: ' + deviceInfo.authentication.SymmetricKey.primaryKey);

      client = clientFromConnectionString(deviceString);

      var connectCallback = function (err) {
        if (err) {
          console.log('Could not connect: ' + err);
        } else {
          console.log('Client connected');
          connected = true;
        }
      };

      client.open(connectCallback);
    }
  };

  function sendMessage(distance, state) {
    if(!connected) return;

    var data = JSON.stringify({ deviceId: deviceId, distance: distance, state: state });
    var message = new Message(data);

    messages.push(message);

    if(messages.length >= batch) {
      console.log('sending ' + messages.length + ' events in a batch');
      client.sendEventBatch(messages, printResultFor('send'));
      messages = [];
    } else {
      //console.log("Sending batch: " + message.getData());
    }
  }

  function printResultFor(op) {
    return function printResult(err, res) {
      if (err) console.log(op + ' error: ' + err.toString());
      if (res) console.log(op + ' status: ' + res.constructor.name);
    };
  }


  return {
    sendMessage: function (distance, state) {
      sendMessage(distance, state);
    }
  };
};

module.exports = AzureIOT;