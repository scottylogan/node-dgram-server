var util = require('util'),
    Buffer = require('buffer').Buffer;

function bitslicer (bits) {
    var self = this;

    this.slices = [];

    if (bits === 8 || bits === 16 || bits === 32) {
        this.width = bits;
        this.used = 0;
    } else {
        throw new Error('bitslicer only works on 8, 16 or 32 bit fields');
    }
    
    this.parse = function(req, msg, offset) {
        var len;
        if (self.width === 8) {
            value = msg.readUInt8(offset);
            len = 1;
        } else if (self.width === 16) {
            value = msg.readUInt16BE(offset);
            len = 2;
        } else if (self.width === 32) {
            value = msg.readUInt32BE(offset);
            len = 4;
        } else {
            throw new Error('No width defined');
        }
        self.slices.forEach(function (slice) {
            req[slice.name] = (value >>> slice.shift) & slice.mask;
        });
        return len;
    }

    this.format = function(res, msg, offset) {
        var len, value = 0;
        self.slices.forEach(function (slice) {
            value |= (res[slice.name] << slice.shift);
        });
        if (self.width === 8) {
            msg.writeUInt8(value & 0xFF, offset);
            len = 1;
        } else if (self.width === 16) {
            msg.writeUInt16BE(value & 0xFFFF, offset);
            len = 2;
        } else if (self.width === 32) {
            // large values will appear to be negative
            // so have to use signed write
            msg.writeInt32BE(value & 0xFFFFFFFF, offset);
            len = 4;
        } else {
            throw new Error('No width defined');
        }
        return len;
    }
}

module.exports = exports = bitslicer;


bitslicer.prototype.bit = function (name) {
    this.bits(1, name);
    return this;
}

bitslicer.prototype.bits = function (len, name) {
    var slice = { "length": len, "name": name };
    
    if (this.used + len > this.width) {
        throw new Error('Bit slices exceed field length');
    }
    this.used += len;
    slice.shift = this.width - this.used;
    slice.mask = ~(0xFFFFFFFF << len);
    this.slices.push(slice);
    return this;
}
