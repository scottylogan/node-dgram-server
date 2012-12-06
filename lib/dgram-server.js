var Buffer = require('buffer').Buffer,
    dgram = require('dgram'),
    format = exports.format = require('./format'),
    bitslicer = exports.bitslicer = require('./bitslicer'),
    response = exports.response = require('./response'),
    util = require('util');

var server = exports.server = function (fmt) {
    var self = this;
    
    this.format = fmt;
    
    dgram.Socket.call(this, 'udp4');

    this.on('message', function(msg, client) {
        var req = fmt.parse(msg);
        req.client = client;
        var res = new response(self, client);
        this.emit('request', req, res);
    });
}

util.inherits(exports.server, dgram.Socket);


exports.inet_aton = function(address) {
    var parts = address.toString().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (parts) {
        var buffer = new Buffer(4);
        buffer.writeUInt32BE(parts[1] * 16777216 + parts[2] * 65536 + parts[3] * 256 + parts[4] * 1, 0);
        return buffer;
    }
    return false;
}  


// convert IP address held in 4 byte buffer to string
exports.inet_ntoa = function(buf) {
  return buf.readUInt8(0) + '.' + buf.readUInt8(1) + '.' + buf.readUInt8(2) + '.' + buf.readUInt8(3);
}
