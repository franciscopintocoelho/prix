var iothub = require('azure-iothub');
var child = require('child_process');
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

var state = -1, distance;

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
                startVideoState();
                getSensorDistance();
            }
        };

        client.open(connectCallback);
    }
};

function getSensorDistance() {
    bus.writeByte(address, 0, 81, function () {
        setTimeout(function () {
            bus.readWord(address, 2, function (err, data) {
                if (!err) {
                    distance = data / 255;
                    checkDistance(distance);
                    //sendData(distance);
                }
                getSensorDistance();
            });
        }, 50);
    });
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

function startVideoState() {
    state = 0;
    child.exec('omxplayer --loop --no-osd reveal.mp4', function(err, stdout, stderr) {
        if(err) state = -1;
    });
}

function checkDistance(distance) {
    if(!state && distance < 100) {
        state = 1;

        child.exec('omxplayer --no-osd closer.mp4', function(err, stdout, stderr) {
            if(!err) state = 0;
        });
    }
};