var os = require('os');
var IP = exports;

IP.isMyIp = function(ip) {
    interfaces = os.networkInterfaces();

    for (var name in interfaces)
        for (i in interfaces[name])
            if (interfaces[name][i].address == ip)
                return true;
    return false;
}

IP.getBroadcastAddress = function(address, netmask) {
    return IP.intToIp(IP.ipToInt(address)|(~IP.ipToInt(netmask)));
}

IP.getNetworkAddress = function(address, netmask) {
    return IP.intToIp(IP.ipToInt(address)&(IP.ipToInt(netmask)));
}

IP.ipToInt = function(ip) {
    var parts = ip.split(".");
    var res = 0;

    res += parseInt(parts[0], 10) << 24;
    res += parseInt(parts[1], 10) << 16;
    res += parseInt(parts[2], 10) << 8;
    res += parseInt(parts[3], 10);

    return res;
}

IP.intToIp = function(int) {
    var part1 = (int & 255);
    var part2 = ((int >> 8) & 255);
    var part3 = ((int >> 16) & 255);
    var part4 = ((int >> 24) & 255);

    return part4 + "." + part3 + "." + part2 + "." + part1;
}