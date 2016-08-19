var express = require('express');
var child = require('child_process');
var app = express();


app.set('port', (process.env.PORT || 3000)); 

app.get('/update/', function(req, res) {
    child.exec('git pull', function(error, stdout, stderr) {
        if(!error) {
            console.log('<---------------git updated--------------->');
            child.exec('npm install', function(error, stdout, stderr) {
                if(!error) {
                    console.log('<---------------npm installed--------------->');
                    res.status(200).send('updated')
                    process.exit()
                } else console.log(stderr);
            });
        } else console.log(stderr);
    });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
