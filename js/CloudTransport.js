var fs = require('fs');
var net = require('net');
var dgram = require('dgram');
var os = require('os');
var osName = require('os-name');
var events = require('events');
var JSONStream = require('JSONStream');
var packagejson = require('../package.json');
var IP = require('./ip.js');
var Peer = require('./Peer.js');


function CloudTransport(opt) {
    var self = this;

    events.EventEmitter.call(this);

    this.algorithm = opt.algorithm || 'aes-256-ctr';
    this.password = opt.password || 'zob';
    this.version = packagejson.name+' v'+packagejson.version;
    this.name = (opt.name || os.hostname());
    this.os = osName();
    this.localAddress = opt.address || '0.0.0.0';
    this.netmask = opt.netmask || '0.0.0.0';
    this.broadcastAddress = IP.getBroadcastAddress(this.localAddress, this.netmask);
    this.localPort = opt.port || 1234;
    this.up = 0;
    this.down = 0;
    this.peers = {};
    this.remotes = opt.remotes || [];
    this.transferts = {};
    this.slug = opt.slug || (this.name +"_"+(new Date()).getTime());

    this.createServer();
}

CloudTransport.prototype.__proto__ = events.EventEmitter.prototype;




// SERVERS / CLIENTS
////////////////////

CloudTransport.prototype.createServer = function() {
    var self = this;

    self.server = net.createServer(function(socket) {
        socket.on('error', function(err) {
            console.log('client planté', err);
            delete peers[socket.remoteAddress];
        });
        self.onconnect(socket);
    });
    self.server.on('error', function(err) {
        self.emit('error', err);
        process.exit();
    });
    self.server.listen(self.localPort, self.localAddress, function() {
        self.emit('ready');
        self.discovery();
        for (var i in self.remotes)
            self.connect(self.remotes[i]);
    });
};

CloudTransport.prototype.connect = function(opt) {
    var remoteAddress = null;
    var self = this;

    var socket = net.connect({
        host: opt.host,
        port: opt.port
    });
    socket.on('connect', function() {
        remoteAddress = socket.remoteAddress;
        self.onconnect(socket);
    });
    socket.on('error', function() {
        if (remoteAddress)
            delete self.peers[remoteAddress];
    });
    socket.on('close', function() {
        if (remoteAddress)
            delete self.peers[remoteAddress];
    });
};

// CloudTransport.prototype.retry = function(opt) {
//     var self = this;

//     console.log('retry '+opt.host+':'+opt.port+' in 1 sec');
//     setTimeout(function() {
//         self.connect(opt);
//     }, 1000);
// }

CloudTransport.prototype.onconnect = function(socket) {
    var self = this;

    var peer = new Peer(socket, this.algorithm, this.password);
    this.peers[peer.id] = peer;

    peer.on('up', function(length) {
        self.up += length;
        self.emit('up', peer, length);
    });
    peer.on('down', function(length) {
        self.down += length;
        self.emit('down', peer, length);
    });
    peer.on('data', function(data) {
        if (data.type == 'infos') {
            for (var i in data.infos)
                peer[i] = data.infos[i];
            self.emit('infos', peer, data.infos);
        }
        else if (data.type == 'execute') {
            var exec = require('child_process').exec;
            exec(data.cmd, function(error, stdout, stderr) {});
            self.emit('execute', peer, data.cmd);
        }
        else if (data.type == 'message') {
            var exec = require('child_process').exec;
            exec(data.cmd, function(error, stdout, stderr) {});
            self.emit('message', peer, data.message);
        }
        else if (data.type == 'filepart') {
            data.content = new Buffer(data.content, 'base64');
            self.onFilepart(peer, data);
        }
        else {
            self.emit('error', new Error('unknown packet ' + data.type), peer);
            socket.destroy();
        }
    });
    peer.on('error', function(err) {
        self.emit('error', err, peer);
    });
    peer.on('disconnect', function() {
        delete self.peers[peer.id];
        self.emit('disconnect', peer);
    });

    this.emit('connect', peer);

    this.sendInfos(peer);
}

CloudTransport.prototype.sendMessage = function(peer, message) {
    peer.send({
        type: 'message',
        message: message
    });
}

CloudTransport.prototype.sendInfos = function(peer) {
    peer.send({
        type: 'infos',
        infos: {
            version: this.version,
            name: this.name,
            os: this.os,
            localAddress: this.localAddress,
            localPort: this.localPort
        }
    });
}

CloudTransport.prototype.sendExecute = function(peer, cmd) {
    peer.send({
        type: 'execute',
        cmd: cmd
    });
}

CloudTransport.prototype.sendFile = function(peer, path) {
    var self = this;
    var stat = fs.statSync(path);
    self.transferts[peer.id+path] = {
        path: path,
        peer: peer,
        transfered: 0,
        steps: 0,
        size: stat.size,
        way: 'upload',
    };
    var r = fs.createReadStream(path);
    var offset = 0;
    r.on('data', function(data) {
        var res = peer.send({
            "type" : "filepart",
            "path" : path,
            "size" : stat.size,
            "date" : stat.atime,
            "offset" : offset,
            "content" : data.toString("base64")
        });
        offset += data.length;
        if (res == false) {
            r.pause();
            peer.writable.once('drain', function() {
                r.resume();
            });
        }
        self.transferts[peer.id+path].transfered += data.length;
        self.transferts[peer.id+path].steps++;
    });
}

CloudTransport.prototype.onFilepart = function(peer, data) {
    var self = this;

    data.path = require('path').basename(data.path);

    if (!self.transferts[peer.id+data.path]) {
        self.transferts[peer.id+data.path] = {
            path: data.path,
            peer: peer,
            transfered: 0,
            steps: 0,
            size: data.size,
            way: 'download',
            fd: fs.openSync(data.path, 'w')
        };
    }

    fs.write(self.transferts[peer.id+data.path].fd, data.content, 0, data.content.length, data.offset);
    self.transferts[peer.id+data.path].transfered += data.content.length;
    self.transferts[peer.id+data.path].steps++;
    self.emit('filepart', peer, data);
};



// DISCOVERY
////////////

CloudTransport.prototype.discovery = function() {
    var self = this;

    self.discoveryServer = dgram.createSocket('udp4');
    self.discoveryServer.bind(self.localPort, function() {
        self.emit('discoveryready');
        console.log('discoveryready');
        self.discoveryServer.setBroadcast(true);
        var message = new Buffer('Salut connecte toi à moi !');
        self.discoveryServer.send(message, 0, message.length, self.localPort, self.broadcastAddress, function(err) {
            if (err) return self.emit('error', err);
            self.emit('discoverysent');
        });
    });
    self.discoveryServer.on('message', function(msg, rinfo) {
        if (!IP.isMyIp(rinfo.address)) {
            self.emit('discovery', msg);
            self.connect({host: rinfo.address, port: rinfo.port});
        }
    });
    self.discoveryServer.on('error', function(err) {
        self.emit('error', err);
    });
};


module.exports = CloudTransport;
