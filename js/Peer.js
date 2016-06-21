var fs = require('fs');
var events = require('events');
var crypto = require('crypto');
var zlib = require('zlib');
var uniqid = require('uniqid');
var JSONStream = require('JSONStream');

function Peer(socket, algorithm, password, slug) {
    var self = this;
    events.EventEmitter.call(this);

    // peer's data
    this.id = uniqid();
    this.name = '';
    this.version = '';
    this.os = '';
    this.algorithm = algorithm;
    this.password = password;
    this.localAddress = socket.localAddress;
    this.localPort = socket.localPort;
    this.remoteAddress = socket.remoteAddress;
    this.remotePort = socket.remotePort;
    this.up = 0;
    this.down = 0;
    this.peers = [];
    this.slug = slug;

    // peer's streams
    var zip = zlib.createGzip();
    var encrypt = crypto.createCipher(algorithm, password);
    var decrypt = crypto.createDecipher(algorithm, password)
    var unzip = zlib.createGunzip();
    var jsonStreamParser = JSONStream.parse();
    this.socket = socket;
    this.readable = jsonStreamParser;
    this.writable = zip;
    this.zip = zip;
    this.unzip = unzip;
    this.encrypt = encrypt;
    this.decrypt = decrypt;
    this.jsonStreamParser = jsonStreamParser;

    // upload counter
    encrypt.on('data', function(data) {
        var l = data.length;
        self.up += l;
        self.emit('up', l);
    });
    // download counter
    socket.on('data', function(data) {
        var l = data.length;
        self.down += l;
        self.emit('down', l);
    });
    // data dispatch
    jsonStreamParser.on('data', function(data) {
        self.emit('data', data);
    });
    // dealing with errors
    socket.on('close', function() {
        self.emit('disconnect');
    });
    socket.on('error', function(err) {
        socket.destroy();
        self.emit('error', err);
    });

    // now that everything is configured, open the pipes !
    zip.pipe(encrypt).pipe(socket).pipe(decrypt).pipe(unzip).pipe(jsonStreamParser);
}

Peer.prototype.__proto__ = events.EventEmitter.prototype;


Peer.prototype.toString = function() {
    var res = '#'+this.id+' - ';
    if (!this.name)
        res += this.localAddress+':'+this.localPort+' | '+this.remoteAddress+':'+this.remotePort;
    else
        res += this.name;

    return res;
}

Peer.prototype.send = function(obj, callback) {
    var self = this;

    return self.writable.write(JSON.stringify(obj), function() {
        self.writable.flush(callback);
    });
}

module.exports = Peer;
