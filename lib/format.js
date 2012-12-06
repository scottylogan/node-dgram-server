var util = require('util'),
    Buffer = require('buffer').Buffer;

function format () {
    this.fields = [],
    this.hasBodyField = false;
};

module.exports = exports = format;

format.prototype.one = function (name) {
    return this.octets(1, name);
};

format.prototype.two = function (name) {
    return this.octets(2, name);
};

format.prototype.four = function (name) {
    return this.octets(4, name);
};
    
format.prototype.body = function (name) {
    return this.octets(false, name);
};
    
format.prototype.octets = function (len, name) {
    var field = {};

    if (this.hasBodyField && len) {
        throw new Error("Cannot add fixed length fields after body field");
    }

    field.length = len;
    if (!len) {
        this.hasBodyField = true;
    }
    
    if (typeof name === 'string' && len) {
        switch (len) {

            case 1:
                field.parse = function (req, msg, offset) {
                    req[name] = msg.readUInt8(offset);
                }
                field.format = function (res, msg, offset) {
                    if (res[name]) {
                        msg.writeUInt8(res[name], offset);
                    }
                }
                break;

            case 2:
                field.parse = function (req, msg, offset) {
                    req[name] = msg.readUInt16BE(offset);
                }
                field.format = function (res, msg, offset) {
                    if (res[name]) {
                        msg.writeUInt16BE(res[name], offset);
                    }
                }
                break;

            case 4:
                field.parse = function (req, msg, offset) {
                    req[name] = msg.readUInt32BE(offset);
                }
                field.format = function (res, msg, offset) {
                    if (res[name]) {
                        msg.writeUInt32BE(res[name], offset);
                    }
                }
                break;

            default:
                field.parse = function (req, msg, offset) {
                    req[name] = msg.slice(offset, offset + len);
                }
                field.format = function (res, msg, offset) {
                    if (res[name]) {
                        var src = res[name];
                        if (! src instanceof Buffer) {
                            src = new Buffer(res[name], 'binary');
                        }
                        src.copy(msg, offset, 0, len);
                    }
                }
                break;
        }
    } else if (typeof name === 'object' && typeof name.parse === 'function' && typeof name.format === 'function') {
        field.parse = name.parse;
        field.format = name.format;
    } else {
        throw new Error('Invalid handler object');
    }
    
    if (typeof field.parse !== 'function') {
        throw new Error('No parse function');
    }
    if (typeof field.format !== 'function') {
        throw new Error('No format function');
    }
    
    this.fields.push(field);
    return this;
}

format.prototype.parse = function (msg) {
    var req = {},
        offset = 0;
    
    this.fields.forEach(function (field) {
        if (field.length) {
            field.parse(req, msg, offset);
            offset += field.length;
        } else {
            offset += field.parse(req, msg, offset);
        }
    });
    
    return req;
}

format.prototype.format = function(res) {
    var msg = new Buffer(res.maxLength),
        offset = 0;
    
    msg.fill(0);
    this.fields.forEach(function (field) {
        if (field.length) {
            field.format(res, msg, offset);
            offset += field.length;
        } else {
            offset += field.format(res, msg, offset);
        }
    });
    
    return msg.slice(0, offset);
}
