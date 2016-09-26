var child = require('child_process');

var config = require('./config.json');
var AzureIOT = require('./azureiot')(config.azureIOT);

var state = -1, playing = false, distance, interval;
var dist, steps = config.steps;

function getSensorDistance() {
    setTimeout(function() {
        distance = 100 + Math.ceil(150*Math.random());
        AzureIOT.setStatus(distance, state);
        checkDistance(distance);
        getSensorDistance();
    }, 50);
};

function startVideoState() {
    state = 0;
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
            setTimeout(function() {
                setTimeout(function() {
                    playing = false;   
                    state = 0;
                }, 1000);
            }, 5000)    ;
        }
    }
};

function start() {
    startVideoState();
    getSensorDistance();
}

start();