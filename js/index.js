// Load local data
const paths = ["user", "current", "groups", "friends", "messages"]
var LocalData = require('./js/LocalData.js')
var localData = new LocalData(paths)

// Render local data
localData.init(function(){
	console.log("ready localdata")
	localData.clear()
	localData.renderAll()

	var CloudTransport = require('./js/CloudTransport.js')
	var cloudTransport = new CloudTransport( localData.get("user") )
	var peers = {}

	cloudTransport.on("ready", function(user){
		console.log("ready cloud")
		localData.add("user", user)

		cloudTransport.discovery();
	})

	cloudTransport.on("connect", function(peer){
		console.log("connect", peer)
	})

	cloudTransport.on("infos", function(peer){
		console.log("infos", peer)
		peers[peer.slug] = peer
		peers[peer.slug].connected = true;

		// localData.set("friends", peer)
		localData.renderAll()
	})

	cloudTransport.on("disconnect", function(peer){
		console.log("disconnect", peer)
		peers[peer.slug].connected = false;

		localData.renderAll()
	})
})

