var child = require('child_process');
var i2c = require('i2c-bus');

var AzureIOT = require('./azureiot')('prix-1', 1000);

var bus = i2c.openSync(1);
var dist, address = 0x70;

var state = -1, distance;

function getSensorDistance() {
    bus.writeByte(address, 0, 81, function () {
        setTimeout(function () {
            bus.readWord(address, 2, function (err, data) {
                if (!err) {
                    distance = Math.ceil(data / 255);
                    checkDistance(distance);
                    AzureIOT.setStatus(distance, state);
                }
                getSensorDistance();
            });
        }, 50);
    });
};

function startVideoState() {
    state = 0;
    child.exec('omxplayer --loop --no-osd --no-keys --layer 0 reveal.mp4', function(err, stdout, stderr) {
        if(err) state = -1;
    });
}

function checkDistance(distance) {
    if(!state && distance < 100) {
        state = 1;

        child.exec('omxplayer --no-osd --no-keys --layer 1 closer.mp4', function(err, stdout, stderr) {
            if(!err) state = 0;
        });
    }
};

function start() {
    startVideoState();
    getSensorDistance();
}

start();