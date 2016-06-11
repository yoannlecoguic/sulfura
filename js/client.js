$(function(){

	//---------------------------------------------------------------------//
	//-------------------------------Reseau--------------------------------//
	//---------------------------------------------------------------------//

	
	//Client side
	function sendMessage(target, message){
		// if( target.type == "group" ){

		// }
		// else if( target.type == "friend" ){
		// 	console.log("message")
		// 	var friend = $.grep(db.friends, function(friend){ return friend.id == target.id; });

		// 	if (friends.length != 0) {
		// 		friend[0].ips.forEach(function(ip){
		// 			send(ip, message)
		// 		})
		// 	} 
		// }

		db.user.ips.forEach(function(ip){
			send(ip, message)
		})
	}

	function send(ip, object){
		var socket = new net.Socket();
		console.log("Try to connect "+port+" "+ip);

		socket.connect(port, ip, function() {

			socket.write(JSON.stringify(object))
		});

		socket.on('data', function(data) {
			console.log(data)
			// if(!data.err)
			// 	socket.destroy();
		});

		socket.on('error', function(err) {
			console.log(err);
		});

		socket.on('close', function() {
			console.log('Connection closed');
		});
	}

	// function mapNetwork(){
	// 	console.log(db.user.ips)

	// 	db.user.ips.forEach(function(ip){
	// 		var base = ip.split(".");

	// 		for(var i = 0; i <= 255; i++){
	// 			console.log(base[0]+"."+base[1]+"."+base[2]+"."+i)
	// 			send(base[0]+"."+base[1]+"."+base[2]+"."+i, {"type": "mapNetwork"})
	// 		}
	// 	})
	// }


	//---------------------------------------------------------------------//
	//----------------------------Application------------------------------//
	//---------------------------------------------------------------------//

	const os = require("os")
	const async = require("async")
	const publicIp = require('public-ip')
	const net = require("net")
	const paths = ["user", "current", "groups", "friends", "messages"]

	// Get local data
	var db = {}
	var port = 7878
	var localhost = "127.0.0.1"
	var sockets = []

	//Server side
	var server = net.createServer(function(socket) {
		sockets.push(socket)

		console.log("connexion serveur")

		socket.on("data", function(data){
			console.log(JSON.parse(data));
		})
	});

	loadLocalData()
	// mapNetwork()

	function loadLocalData(){
		var done = 0

		paths.forEach(function(path){
			var item = localStorage.getItem(path)
			// var item = null

			if(item === null){
				localStorage.setItem(path, "[]")
				db[path] = []
			}
			else
				db[path] = JSON.parse(item)

			done++

			if(done == paths.length)
				loadingEnd()
		})
	}

	function loadingEnd(){
		// Render local data
		db.groups.forEach(renderGroup)
		db.friends.forEach(renderFriend)

		// Take first group if not focus
		if(db.groups.length != 0 && db.current == "")
			db.current = db.groups[0]

		// Take first friend if not focus and no group
		if(db.friends.length != 0 && db.current == "")
			db.current = db.friends[0]

		// Reload messages with the current
		if(db.current != ""){
			$("#"+db.current.type+"_"+db.current.id).addClass("focus")
			reloadMessages()
		}

		// Get ips
		var interfaces = os.networkInterfaces()
		var addresses = []
		for (var k in interfaces) {
			 for (var k2 in interfaces[k]) {
				var address = interfaces[k][k2]
				if (address.family === 'IPv4' && !address.internal)
					addresses.push(address.address)
			 }
		}

		publicIp.v4().then(function(ip){
			addresses.push(ip)
		})
		
		db.user = {
			"name": "Yoann",
			"ips": addresses
		}

		server.listen(port, localhost);
	}

	function reloadMessages(){
		$("#show_messages").html("<img class='loading' src='./views/loader.gif'>")
		var done = 0

		console.log(db.current)
		if(db.current != ""){
			db.messages.forEach(function(message){
				if(message.type == db.current.type && message.conversation == db.current.id)
					renderMessage(message)

				done++
	
				if(done == db.messages.length)
					$(".loading").hide()
			})		
		}
	}

	// Messages
	function saveMessage(){
		var message = {
			"id": (new Date()).getTime(),
			"from": db.user.name,
			"conversation": db.current.id,
			"type": db.current.type,
			"text": $("textarea[name=message]").val(),
			"status": "me",
			"date": new Date()
		}
		db.messages.push(message)
		localStorage.setItem( "messages", JSON.stringify(db.messages) )

		$("textarea[name=message]").val("")
		renderMessage(message)
		sendMessage(db.current, message)
	}

	function renderMessage(message){
		$("#show_messages").append( new EJS({url: 'views/message.ejs'}).render(message) )
	}

	function newMessage(message){
		db.messages.push(message)
		if(db.current.type == message.type && db.current.id == message.conversation)
			reloadMessages()
		else{
			//Show notif
		}
	}

	$("#message_submit").on("click", saveMessage)




	// Groups
	var current_group = null

	function saveGroup(){
		$("#groups_add").show()
		$("#groups_valid").hide()

		current_group.name = $(".group input[name=group_name]").val()
		current_group.status = null

		db.groups.push(current_group)
		localStorage.setItem( "groups", JSON.stringify(db.groups) )

		updateGroup(current_group)
	}

	function renderGroup(group){
		$("#groups").append( new EJS({url: 'views/group.ejs'}).render(group) )
	}

	function updateGroup(group){
		$("#group_"+group.id).replaceWith( new EJS({url: 'views/group.ejs'}).render(group) )
	}

	$("#groups_valid").on("click", saveGroup)

	$("#groups_add").on("click", function(){
		$("#groups_add").hide()
		$("#groups_valid").show()

		current_group = {
			"id": (new Date()).getTime(),
			"name": null,
			"status": "edit",
			"owner": db.user.name
		}
		renderGroup(current_group)
	})

	$(document).on("click", ".group", function(){
		if( !$(this).hasClass("edit-group") ){
			db.current = {
				"type": "group",
				"id": $(this).attr("id").split("_")[1]
			}
			localStorage.setItem( "current", JSON.stringify(db.current) )

			$(".focus").removeClass("focus")
			$(this).addClass("focus")

			reloadMessages()
		}
	})




	//Friends
	function renderFriend(friend){
		$("#friends").append( new EJS({url: 'views/friend.ejs'}).render(friend) )
	}
})