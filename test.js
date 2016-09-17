var i2c = require('i2c-bus');
var bus = i2c.openSync(1);


var dist, mode = 81, address = 0x70;

var loop = function() {
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
};

loop();
