// Render local data
function render(){
	for(var i in db.groups)
		renderGroup(db.groups[i])

	for(var i in db.friends)
		renderFriend(db.friends[i])
}




//GROUPS
function renderGroup(group){
	$("#groups").append( new EJS({url: 'views/group.ejs'}).render(group) )
}

function updateGroup(group){
	$("#group_"+group.id).replaceWith( new EJS({url: 'views/group.ejs'}).render(group) )
}





//FRIENDS
function renderFriend(friend){
	$("#friends").append( new EJS({url: 'views/friend.ejs'}).render(friend) )
}

function updateFriend(friend){
	$("#group_"+friend.id).replaceWith( new EJS({url: 'views/friend.ejs'}).render(friend) )
}




// MESSAGES
function renderMessages(id){
	$("#show_messages").html("<img class='loading' src='./views/loader.gif'>")
	var done = 0

	if(db.current){
		console.log(db.messages[ id ])

		for(var i in db.messages[ id ]){
			renderMessage(db.messages[ id ][i])
			console.log(db.messages[ id ][i])

			done++

			if(done == db.messages[ id ].length)
				$(".loading").hide()
		}
	}
}