const mongoose = require("mongoose");
const Redis = require("ioredis");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cron = require("node-cron");
/// connection to DBs, Schema & Models
mongoose.connect("mongodb://127.0.0.1:27017/simplechatapp");
const redis = new Redis();
/// chat Schema
let chatSchema = new mongoose.Schema({
  from: String,
  message: String,
  timeStamp: Date,
});
let ChatModel = mongoose.model("Chat", chatSchema);
///

const app = express(); // app is used to apply Middleware in future
const server = http.createServer(app);
app.use(cors());
const io = new Server(server, {
  cors: {
    origin: "http://127.0.0.1:5500",
    methods: ["GET", "POST"],
  },
});

let userDetails = {}; /// key will client id and value will be client Name

io.on("connection", (client) => {
  console.log("client connected", client.id);
  client.on("registerUser", async (userName) => {
    userDetails[client.id] = userName;
    // get data from AllChatsToUi and emit chat_History event
    let chatHistoryJSON = await redis.lrange("AllChatsToUI", 0, -1);
    // chats are stringified and pushed, so all chats to be parsed and send to UI
    let chatHistoryArray = chatHistoryJSON.map(JSON.parse);
    //console.log(chatHistoryArray)
    io.emit("chat_History", chatHistoryArray);
  });

  client.on("sendMessage", async (message) => {
    client.emit("response", "Thanks for chatting");
    let chatObj = {
      from: userDetails[client.id],
      message: message,
      timeStamp: new Date(),
    };

    // chatHistory will be pushed to Redis
    // use to Arrays , one is for UI--> Allchats, another is for cron&DB--> for newchats
    await redis.rpush("AllChatsToUI", JSON.stringify(chatObj));
    await redis.rpush("NewChatsToDB", JSON.stringify(chatObj));

    // get data from AllChatsToUi and emit chat_History event
    let chatHistoryJSON = await redis.lrange("AllChatsToUI", 0, -1);
    // chats are stringified and pushed, so all chats to be parsed and send to UI
    let chatHistoryArray = chatHistoryJSON.map(JSON.parse);
    //console.log(chatHistoryArray)
    io.emit("chat_History", chatHistoryArray);
  });
});
/// Run a Cron which gets chats from NewChatsToDB array from redis , push to Db
cron.schedule("*/30 * * * * *", async () => {
  console.log("Cron Started");
  let chatHistoryJSON = await redis.lrange("NewChatsToDB", 0, -1);
  if (chatHistoryJSON.length == 0) {
    console.log("No New Chats To Push Into DB");
  } else {
    let chatHistoryArray = chatHistoryJSON.map(JSON.parse);
    await ChatModel.insertMany(chatHistoryArray);
    // once it is inserted in DB, clear in the Redis, so that fresh chats enters in to the NewChatsToDB array
    await redis.del("NewChatsToDB");
    // also AllChatsToUI and fill with recent 15 chats form DB
    await redis.del("AllChatsToUI");

    let recentOlderChats = await ChatModel.find().sort({timeStamp:-1}).limit(15)
    // reverse the array to ensure continuity with newerchats in UI
    recentOlderChats =  recentOlderChats.reverse()
    console.log(recentOlderChats)
    // feed this reversed chat to Redis that too for AllChatsToUI
    /// run a loop and push to Redis as we don't have insert many to Redis
    for(chat of recentOlderChats){
          await redis.rpush("AllChatsToUI", JSON.stringify(chat));
    }
    console.log("Chats Pushed Into DB & Also Cleared From Redis")
  }
});
server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
