var child = require('child_process');
var omxplayer = require('omx-manager');
var i2c = require('i2c-bus');

var config = require('./config.json');
var AzureIOT = require('./azureiot')(config.azureIOT);

var bus = i2c.openSync(1);
var dist, address = 0x70;

var state = -1, playing = false, distance = 130, interval;
var manager, background, videos, video;
var steps = config.steps;

function getSensorDistance() {
    bus.writeByte(address, 0, 81, function (err) {
        if (!err) {
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
        } else {
            AzureIOT.sendError(err);
            getSensorDistance();
        }
    });
};

function getSimulatedSensorDistance() {
    var stdin = process.stdin;

    stdin.setRawMode(true);
    stdin.setEncoding('utf-8');
    stdin.resume();

    stdin.on('data', function (key) {
        switch (key) {
            case '\u0003':
                video.stop();
                process.exit();
                break;
            case '\u001B\u005B\u0041':
                distance+= 20;
                break;
            case '\u001B\u005B\u0042':
                distance-= 20;
                break;
        }
    });

    setInterval(function () {
        AzureIOT.setStatus(distance, state);
        if (distance > 10) {
            checkDistance(distance);
        } else console.log('ignored: ', distance);
    }, 10);
};

function startVideoState() {
    state = 0;
    videos = [];
    
    manager = new omxplayer();
    manager.setVideosDirectory('videos');
    
    for(var i = 0; i < config.steps.length; i++) {
        videos.push(manager.create(config.steps[i].video));
    }

    /*child.exec('omxplayer --loop --no-osd --no-keys --layer 0 videos/' + config.background, function (err, stdout, stderr) {
        if (err) {
            AzureIOT.sendError(err);
            state = -1;
        }
    });*/ 
}

function checkDistance(distance) {
    var len = steps.length;
    
    if (state != -1 && !playing) {
        for (var i = len - 1; i >= 0; i--) {
            if (distance <= steps[i].distance) {
                video = videos[i];
                state = i;
                break;
            }
        }

        if (video) {
            playing = true;
            /*child.exec('omxplayer --no-osd --no-keys -o both --layer ' + state + ' videos/' + video, function (err, stdout, stderr) {
                if (err) AzureIOT.sendError(err);

                state = 0;
                setTimeout(function () {
                    playing = false;
                }, 3000);
            });*/

            video.on('end', function() {
                console.log('end');
                playing = false;
            });

            video.play();
        }
    }
};

function start() {
    startVideoState();
    getSimulatedSensorDistance();
}

start();