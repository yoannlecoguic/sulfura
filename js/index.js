// Load local data
const paths = ["user", "current", "groups", "friends", "messages"]
var LocalData = require('./js/LocalData.js')
var localData = new LocalData(paths)

// Render local data
localData.init(function(){
	console.log("ready localdata")
	// localData.clear()
	localData.renderAll()

	var CloudTransport = require('./js/CloudTransport.js')
	var cloudTransport = new CloudTransport( localData.get("user") )

	cloudTransport.on("ready", function(user){
		console.log("ready cloud")
		localData.add("user", user)

		cloudTransport.discovery();
	})

	cloudTransport.on("connect", function(peer){
		console.log("connect", peer)
		console.log(Object.keys(cloudTransport.peers).length)
	})

	cloudTransport.on("disconnect", function(peer){
		console.log("disconnect", peer)
		console.log(Object.keys(cloudTransport.peers).length)
	})
})

