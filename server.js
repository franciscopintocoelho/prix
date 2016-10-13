var child = require('child_process');
var omxplayer = require('omx-manager');
var i2c = require('i2c-bus');

var config = require('./config.json');
var AzureIOT = require('./azureiot')(config.azureIOT);

var bus = i2c.openSync(1);
var dist, address = 0x70;

var state = -1, distance = 210, lock;
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
                if(background) background.stop();
                if(video) video.stop();
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
    }, 50);
};

function startVideoState() {
    var instance;

    videos = [];
    
    manager = new omxplayer();
    //manager.enableNativeLoop();
    manager.setVideosDirectory('videos');
    
    for(var i = 0; i < steps.length; i++) {
        createInstance(steps[i], i);
    }

    child.exec('omxplayer --loop --no-osd --no-keys --layer 0 videos/' + config.background, function (err, stdout, stderr) {
        if (err) {
            AzureIOT.sendError(err);
        }
    });
}

function createInstance(step, index) {
    var layer = index + 1, delay;
    var instance = manager.create(step.video, { '--no-keys': true, '--no-osd': true, '-o': 'both' ,'--layer': layer });

    instance.on('end', function() {
        if(state != index) return;

        delay = step.next ? 2000 : 10000;

        lockVideo(delay);
        state = step.next
        video = videos[state];
        video.play();
    });

    videos.push(instance);
}

function checkDistance(distance) {
    var len = steps.length, last;
    
    if (lock) return;

    switch(state) {
        case -1:
            if(distance <= steps[0].distance) {
               video = videos[0];
               playVideo();
               state = 0; 
            }
            break;
        case 0:
            if(distance <= steps[1].distance) {
               video = videos[1];
               playVideo();
               state = 1; 
            }
            break;
        case 1:
            if(distance <= steps[2].distance) {
                video = videos[2];
                playVideo();
                state = 2;
            }
            break;
        case 3:
            if(distance <= steps[4].distance) {
                video = videos[4];
                playVideo();
                state = 4;
            }
            break;
    }
};

function playVideo() {
    lockVideo(2000);
    video.play();
}

function lockVideo(delay) {
    lock = true;
    setTimeout(function() {
        lock = false;
    }, delay);
}

function start() {
    startVideoState();
    getSensorDistance();
    //getSimulatedSensorDistance();
}

start();