var child = require('child_process');
var omxplayer = require('omx-manager');
var i2c = require('i2c-bus');

var config = require('./config.json');
var AzureIOT = require('./azureiot')(config.azureIOT);

var bus = i2c.openSync(1);
var dist, address = 0x70;

var state = -1, distance = 210, interval;
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

    state = 0;
    videos = [];
    
    manager = new omxplayer();
    //manager.enableNativeLoop();
    manager.setVideosDirectory('videos');
    
    for(var i = 0; i < steps.length; i++) {
        createInstance(steps[i], i);
    }

    //background = manager.create(config.background, { '--loop': true, '--no-keys': true, '--no-osd': true, '--layer': 0 });
    //background.play();

    /*child.exec('omxplayer --loop --no-osd --no-keys --layer 0 videos/' + config.background, function (err, stdout, stderr) {
        if (err) {
            AzureIOT.sendError(err);
            state = -1;
        }
    });*/
}

function createInstance(step, index) {
    var layer = index + 1;
    var instance = manager.create(step.video, { '--no-keys': true, '--no-osd': true, '--layer': layer });

    instance.on('end', function() {
        if(state != layer) return;
        
        state = step.next;
        if(state != 0) {
            video = videos[state-1];
            video.play();
        }
    });

    videos.push(instance);
}

function checkDistance(distance) {
    var len = steps.length, last;
    
    if (state === -1) return;

    switch(state) {
        case 0:
            if(distance <= steps[0].distance) {
               video = videos[0];
               state = 1; 
            }
            break;
        case 1:
            if(distance <= steps[1].distance) {
                video = videos[1];
                state = 2;
            }
            break;
        case 3:   
            if(distance <= steps[3].distance) {
                video = videos[3];
                state = 4;
            }
            break;
    }

    if (video) video.play();
};

function start() {
    startVideoState();
    getSimulatedSensorDistance();
}

start();