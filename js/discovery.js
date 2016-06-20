localPort = 7878;
localAddress = '0.0.0.0';
broadcastAddress = '255.255.255.255';
dgram = require('dgram');
os = require('os');
net = require('net');

remotes = {};

function isMyIp(ip) {
    interfaces = os.networkInterfaces();

    for (var name in interfaces)
        for (i in interfaces[name])
            if (interfaces[name][i].address == ip)
                return true;
    return false;
}

function discovery() {
    var self = this;

    var discoveryServer = dgram.createSocket('udp4');
    discoveryServer.bind(localPort, function() {
        console.log('discoveryready');
        discoveryServer.setBroadcast(true);
        var message = new Buffer('Salut connecte toi à moi !');
        discoveryServer.send(message, 0, message.length, localPort, broadcastAddress, function(err) {
            if (err) return console.log('error', err);
            console.log('discoverysent');
        });
    });
    discoveryServer.on('message', function(msg, rinfo) {
        if (!isMyIp(rinfo.address)) {
            console.log('discovery', rinfo.address.toString(), msg.toString());
            connect({host: rinfo.address, port: rinfo.port});
        }
    });
    discoveryServer.on('error', function(err) {
        console.log('error', err);
    });
};





function createServer() {
    server = net.createServer(function(socket) {
        socket.on('error', function(err) {
            console.log('client planté', err);
            delete remotes[socket.remoteAddress];
        });
        onconnect(socket);
    });
    server.on('error', function(err) {
        console.log('error', err);
        process.exit();
    });
    server.listen(localPort, localAddress, function() {
        console.log('ready');
        discovery();
    });
};

function connect(opt) {
    var remoteAddress = null;

    var socket = net.connect({
        host: opt.host,
        port: opt.port
    });
    socket.on('connect', function() {
        remoteAddress = socket.remoteAddress;
        onconnect(socket);
    });
    var retrydone = 0;
    socket.on('error', function(err) {
        console.log(err);
        if (remoteAddress)
            delete remotes[remoteAddress];
    });
    socket.on('close', function() {
        if (remoteAddress)
            delete remotes[remoteAddress];
    });
};


function onconnect(socket) {
    console.log('connected '+socket.remoteAddress);

    for (var i in remotes) {
        if (remotes[i].remoteAddress == socket.remoteAddress) {
            socket.destroy();
            console.log('DESTROYED '+socket.remoteAddress);
            delete remotes[socket.remoteAddress];
        }
    }

    remotes[socket.remoteAddress] = socket;
    console.log(Object.keys(remotes).length+' connections');
}



createServer()
