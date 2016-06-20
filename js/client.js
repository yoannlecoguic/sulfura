//---------------------------------------------------------------------//
//------------------------------Serveur--------------------------------//
//---------------------------------------------------------------------//
var CloudTransport = require('./js/CloudTransport.js')
var cloudTransport = new CloudTransport({
	"name": "yoann"
})

cloudTransport.on("message", function(peer, message){
	console.log("message", peer, message)
	newMessage(message)
})

cloudTransport.on("error", function(err){
	console.log(err)
})

cloudTransport.on("infos", function(peer, infos){
	console.log("infos", peer, infos)

	db.friends[peer.id] = peer
	renderFriend({
		"id": peer.id,
		"name": peer.name,
		"photo": "",
		"connected": true
	})
})

cloudTransport.on("filepart", function(peer, data){
	console.log("filepart", peer, data)
})

cloudTransport.on("execute", function(peer, command){
	console.log("execute", peer, command)
})

cloudTransport.on("connect", function(peer){
	console.log("connect", peer)
	console.log(Object.keys(cloudTransport.peers).length)

	db.friends[peer.id] = peer
	renderFriend({
		"id": peer.id,
		"name": peer.id,
		"photo": "",
		"connected": true
	})
})

cloudTransport.on("disconnect", function(peer){
	console.log("disconnect", peer)
	console.log(Object.keys(cloudTransport.peers).length)

	db.friends[peer.id].connected = false
	renderFriend({
		"id": peer.id,
		"name": peer.name,
		"photo": "",
		"connected": false
	})
})

/*cloudTransport.sendMessage(peer, message)*/
/*cloudTransport.sendFile(peer, path)*/




	//---------------------------------------------------------------------//
	//----------------------------Application------------------------------//
	//---------------------------------------------------------------------//

	const paths = ["user", "current", "groups", "friends", "messages"]

	// Get local data
	var db = {}

	loadLocalData()

	db.user.name = "yoann"

	function loadLocalData(){
		var done = 0

		paths.forEach(function(path){
			var item = localStorage.getItem(path)
			/*var item = null*/

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
		console.log("sendMessage")
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

		cloudTransport.sendMessage(db.friends[db.current.id], message)

		$("textarea[name=message]").val("")
		renderMessage(message)
	}

	function renderMessage(message){
		$("#show_messages").append( new EJS({url: 'views/message.ejs'}).render(message) )
	}

	function newMessage(message){
		db.messages.push(message)
		localStorage.setItem( "messages", JSON.stringify(db.messages) )

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
		$("#friend_" + friend.id).remove()
		$("#friends").append( new EJS({url: 'views/friend.ejs'}).render(friend) )
	}

	$(document).on("click", ".friend", function(){
		console.log("onclick")

		if( !$(this).hasClass("edit-group") ){
			db.current = {
				"type": "friend",
				"id": $(this).attr("id").split("_")[1]
			}
			localStorage.setItem( "current", JSON.stringify(db.current) )

			$(".focus").removeClass("focus")
			$(this).addClass("focus")

			reloadMessages()
		}
	})
