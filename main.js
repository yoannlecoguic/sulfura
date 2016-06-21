const electron = require("electron")
const {app} = electron
const {BrowserWindow} = electron

let win

function createWindow(){
	win = new BrowserWindow({width: 1200, height: 1000})
	win.maximize()
	win.loadURL("file://"+__dirname+"/index.html")
	win.webContents.openDevTools()

	win.on("closed", function(){
		win = null
	})
}

app.on("ready", createWindow)

app.on("window-all-closed", function(){
	if(process.platform !== "darwin")
		app.quit()
})

app.on("activate", function(){
	if(win === null)
		createWindow();
})