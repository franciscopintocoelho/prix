var child = require('child_process');
var i2c = require('i2c-bus');

var config = require('./config.json');
var AzureIOT = require('./azureiot')(config.azureIOT);

var bus = i2c.openSync(1);
var dist, address = 0x70;

var state = -1, playing = false, distance, interval;
var steps = config.steps;

//TODO: json orderby distance

function getSensorDistance() {
    bus.writeByte(address, 0, 81, function (err) {
        if(!err) {
            setTimeout(function () {
                bus.readWord(address, 2, function (err, data) {
                    if (!err) {
                        distance = Math.ceil(data / 255);
                        AzureIOT.setStatus(distance, state);
                        if (distance > 10) {
                            checkDistance(distance);
                        } else console.log('ignored: ', distance);
                    } else {
                        AzureIOT.setStatus(0, state);
                        AzureIOT.sendError(err);
                    }
                    getSensorDistance();
                });
            }, 50);
        } else AzureIOT.sendError(err);
    });
};

bus.writeByte(address, 0, mode, function() {
    setTimeout(function() {
        bus.readByte(address, 0, function(err, data) {
            console.log(err);
            console.log(data);
            bus.readWord(address, 2, function(err, data) {
                if(!err) console.log(data / 255);
                loop();
            });
        });
    }, 50);
});

function startVideoState() {
    state = 0;
    child.exec('omxplayer --loop --no-osd --no-keys --layer 0 videos/' + config.background, function (err, stdout, stderr) {
        if (err) {
            AzureIOT.sendError(err);
            state = -1;
        }
    });
}

function checkDistance(distance) {
    var video, i;

    if (state != -1 && !playing) {
        for(i = 0; i < steps.length; i++) {
            if(distance < steps[i].distance && state != (i+1)) {
                video = steps[i].video;
                state = (i+1);
                break;
            }
        }

        if (video) {
            playing = true;
            child.exec('omxplayer --no-osd --no-keys -o both --layer ' + state + ' videos/' + video, function (err, stdout, stderr) {
                if(err) AzureIOT.sendError(err);

                setTimeout(function() {
                    playing = false;   
                    state = 0;
                }, 5000);
            });
        }
    }
};

function start() {
    startVideoState();
    getSensorDistance();
}

start();