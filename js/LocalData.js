var events = require('events');

function LocalData(paths){
	var self = this
	self.paths = paths;
	self.db = {}
}

LocalData.prototype.init = function(callback){
	var self = this

	var done = 0
	self.paths.forEach(function(path){
		var item = localStorage.getItem(path)

		if(item === null){
			localStorage.setItem(path, "[]")
			self.db[path] = []
		}
		else
			self.db[path] = JSON.parse(item)

		done++

		if(done == paths.length)
			callback()
	})
}

LocalData.prototype.clear = function(){
	var self = this

	self.paths.forEach(function(path){
		self.db[path] = []
		localStorage.setItem(path, "[]")
	})
}

LocalData.prototype.add = function(type, item){
	var self = this

	if(!self.db[type][item.slug])
		self.db[type][item.slug] = []

	self.db[type][item.slug].push( item )
	localStorage.setItem( type , JSON.stringify(self.db[ type ]) )
}

LocalData.prototype.set = function(type, item){
	var self = this

	self.db[type][item.slug] = item
	localStorage.setItem( type , JSON.stringify(self.db[ type ]) )
}

LocalData.prototype.get = function(type){
	var self = this

	return self.db[type]
}

LocalData.prototype.getBySlug = function(type, slug){
	var self = this

	if(!self.db[type][item.slug])
		return {}

	return self.db[type][item.slug]
}


// RENDERING

// Render local data
LocalData.prototype.renderAll = function(){
	for(var i in this.db.groups)
		this.renderGroup( this.db.groups[i] )

	for(var i in this.db.friends){
		console.log("FRIENDS", this.db.friends[i])
		this.renderFriend( this.db.friends[i] )
	}
}



//GROUPS
LocalData.prototype.renderGroup = function(group){
	if($("#group_"+group.id))
		$("#group_"+group.id).replaceWith( new EJS({url: './views/group.ejs'}).render(group) )
	else
		$("#groups").append( new EJS({url: 'views/group.ejs'}).render(group) )
}


//FRIENDS
LocalData.prototype.renderFriend = function(friend){
	if($("#friend_"+friend.id))
		$("#friend_"+friend.id).replaceWith( new EJS({url: './views/friend.ejs'}).render(friend) )
	else
		$("#friends").append( new EJS({url: 'views/friend.ejs'}).render(friend) )
}


// MESSAGES
LocalData.prototype.renderMessages = function(id){
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



module.exports = LocalData;