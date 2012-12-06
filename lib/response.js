var util = require('util'),
    Buffer = require('buffer').Buffer;

function response(server, client) {
    var self = this;
    
    this.server = server;
    this.client = client;
    this.maxLength = 1500;
    this.sent = false;
};


// callback(err, bytes)

response.prototype.end = function (callback) {
    try {
        var buffer = this.server.format.format(this);
        // check for a broadcast
        this.server.setBroadcast(this.client.address === '255.255.255.255');
        this.server.send(buffer, 0, buffer.length, this.client.port, this.client.address,
            function (err, bytes) {
                this.sent = true;
                if (callback) {
                    callback(err, bytes);
                }
            });
    } catch (e) {
        if (typeof callback === 'function') {
            callback(e, 0);
        } else {
            throw new Error(e);
        }
    }
};  

module.exports = exports = response;
