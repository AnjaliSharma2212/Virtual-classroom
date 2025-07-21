const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express(); // app is used to apply Middleware in future
const server = http.createServer(app);
// http cannot be skipped, as socket upgardtion protocol happens in http
app.use(cors());
const io = new Server(server, {
  cors: {
    origin: "http://127.0.0.1:5500",
    methods: ["GET", "POST"],
  },
});

/// io is main contious connection establishing fn/server
///  Creating the first connection event
// io is responsible to get client connected
/// .on is event is listener, which listens an event called as connection
let userDetails = {}; /// key will client id and value will be client Name

let chatHistoryArray = []; /// Array which stores the chatObj--> chatHistory
io.on("connection", (client) => {
  console.log("client connected", client.id);
  // we can create customised events for client

  client.on("registerUser", async (userName) => {
    userDetails[client.id] = userName;
    // console.log(userName, "client registered");
    // console.log(userDetails)
    // Display the previous chat history
    client.emit("chat_History", chatHistoryArray);
  });

  client.on("sendMessage", async (message) => {
    //console.log(message);
    // chat server will also send message to client in return
    /// sending message is event triggerer or emitter
    client.emit("response", "Thanks for chatting");
    // create an chat Obj and store in chat History Array

    let chatObj = {
      from: userDetails[client.id],
      message: message,
      timeStamp: new Date(),
    };
    //console.log(chatObj)
    /// Push this chatObj into Chat Array
    chatHistoryArray.push(chatObj);
    //console.log(chatHistoryArray);
    // send this chatHostory Array to FE, where FE will be displaying the chatMessages
    /// tigger event called chatHistory
    /// trigger to client
    //client.emit("chat_History", chatHistoryArray)
    // client.emit emits chat history to partciular clinet whose is chatting
    /// while others UI is not updated with chat History, unitl they chat
    /// But practically, all user's UI should get updated, whenever any of the user is chatting
    // to solve this, use io,emit not client.emit
    ///  io.emit emits chat history to all the clients present in the scoket
    // use io.emit to update chatHistory for everyoone, whenever anyone is also chatting
    io.emit("chat_History", chatHistoryArray);
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
