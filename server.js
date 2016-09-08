var iothub = require('azure-iothub');
var i2c = require('i2c-bus');

var deviceId = 'prix-1';
var connectionString = 'HostName=prix.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=P0+Yi9IHdqN/35go3aroNPD1HFMn9ggwUSzit0w6QA0=';

var registry = iothub.Registry.fromConnectionString(connectionString);

var clientFromConnectionString = require('azure-iot-device-amqp').clientFromConnectionString;
var Message = require('azure-iot-device').Message;

var device = new iothub.Device(null);
var client;

var bus = i2c.openSync(1);
var dist, address = 0x70;

device.deviceId = deviceId;
registry.create(device, function (err, deviceInfo, res) {
    if (err) {
        registry.get(device.deviceId, getDeviceInfo);
    }
    if (deviceInfo) {
        connectDevice(err, deviceInfo, res)
    }
});

function printResultFor(op) {
    return function printResult(err, res) {
        if (err) console.log(op + ' error: ' + err.toString());
        if (res) console.log(op + ' status: ' + res.constructor.name);
    };
}

function getSensorDistance() {
    bus.writeByte(address, 0, 81, function () {
        setTimeout(function () {
            bus.readWord(address, 2, function (err, data) {
                if (!err) sendData(data);
                getSensorDistance();
            });
        }, 50);
    });
};

function sendData(data) {
    var data = JSON.stringify({ deviceId: deviceId, distance: (data / 255) });
    var message = new Message(data);
    console.log("Sending message: " + message.getData());
    client.sendEvent(message, printResultFor('send'));
}

function getDeviceInfo(err, deviceInfo, res) {
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
                // Create a message and send it to the IoT Hub every second
                getSensorDistance();
            }
        };

        client.open(connectCallback);
    }
};
