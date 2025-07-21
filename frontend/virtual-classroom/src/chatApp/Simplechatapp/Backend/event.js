const EventEmitter = require("events")

const event = new EventEmitter();


/// .on ---> listening to the event 
/// .emit ---> Trigerring/calling the event 

/// Listening to the event 
event.on("first_event", ()=>{
    console.log("This is first event")
})


/// call/trigger the event 

event.emit("first_event")


/// sockets are part of HTTP Protocol

/// whenever we use sockets, 
/// Typical HTTP coonection upgrades into socket
/// Where established connection remains alive

// GET /chat HTTP/1.1
// Host: example.com
// Upgrade: websocket
// Connection: Upgrade

// Disadvantages
/// Cannot create Custom Events
/// Client Reconnection
/// Roomcreation etc