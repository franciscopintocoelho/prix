var express = require('express');
var child = require('child_process');
var app = express();

var iothub = require('azure-iothub');

var deviceId = 'myFirstNodeDevice';
var connectionString = 'HostName=PRIX.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=QYtJqH9+59PQ5IdOszsCzR30kVJk1302zl5gEzz3pA0=';

var registry = iothub.Registry.fromConnectionString(connectionString);

var clientFromConnectionString = require('azure-iot-device-amqp').clientFromConnectionString;
var Message = require('azure-iot-device').Message;

var device = new iothub.Device(null);
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

function getDeviceInfo(err, deviceInfo, res) {
    if (deviceInfo) {
        var deviceString = 'HostName=PRIX.azure-devices.net;DeviceId=' + deviceInfo.deviceId + ';SharedAccessKey=' + deviceInfo.authentication.SymmetricKey.primaryKey;
        
        console.log('Device id: ' + deviceInfo.deviceId);
        console.log('Device key: ' + deviceInfo.authentication.SymmetricKey.primaryKey);

        var client = clientFromConnectionString(deviceString);

        var connectCallback = function (err) {
            if (err) {
                console.log('Could not connect: ' + err);
            } else {
                console.log('Client connected');
                // Create a message and send it to the IoT Hub every second
                setInterval(function(){
                    var windSpeed = 10 + (Math.random() * 4);
                    var data = JSON.stringify({ deviceId: deviceId, windSpeed: windSpeed });
                    var message = new Message(data);
                    console.log("Sending message: " + message.getData());
                    client.sendEvent(message, printResultFor('send'));
                }, 1000);
            }
        };

        client.open(connectCallback);
    }
};

app.set('port', (process.env.PORT || 8080));

app.get('/update/', function(req, res) {
    child.exec('git pull', function(error, stdout, stderr) {
        if(!error) {
            console.log(stdout);
            child.exec('npm install', function(error, stdout, stderr) {
                if(!error) {
                    res.status(200).send('updated');
                    console.log(stdout);
                    child.exec('sudo reboot', function(error, stdout, stderr) {
                        if(!error) {
                            console.log(stdout);
                            process.exit()
                        } else console.log(stderr);
                    });
                    process.exit()
                } else console.log(stderr);
            });
        } else console.log(stderr);
    });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
