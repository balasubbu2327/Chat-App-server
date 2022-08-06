const express = require("express");
const mongoose = require("mongoose");
const Rooms = require("./dbRooms");
const cors = require("cors");
const Messages = require("./dbMessages");
const Pusher = require("pusher");

const app = express();

const pusher = new Pusher({
  appId: "1456352",
  key: "ac12088e1a431ba2c5cb",
  secret: "0f7288fdd0b8379418d6",
  cluster: "ap2",
  useTLS: true,
});

app.use(express.json());
app.use(cors());

const dbUrl =
  "mongodb+srv://cloneWhatsapp:27121997@streamapp.u983a.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(dbUrl);

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB connected Successfully!!");

  const roomCollection = db.collection("rooms");
  const changeStream = roomCollection.watch();

  changeStream.on("change", (change) => {
    console.log(change);
    if (change.operationType === "insert") {
      const roomDetails = change.fullDocument;
      pusher.trigger("room", "inserted", roomDetails);
    } else {
      console.log("Not a expected event to trigger");
    }
  });

  const msgCollection = db.collection("messages");
  const changeStream1 = msgCollection.watch();

  changeStream1.on("change", (change) => {
    console.log(change);
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", messageDetails);
    } else {
      console.log("Not a expected event to trigger");
    }
  });
});

app.get("/", (req, res) => {
  return res.status(200).send("Backend is working!!");
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(201).send(data);
    }
  });
});

app.get("/messages/:id", (req, res) => {
  Messages.find({ roomId: req.params.id }, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(200).send(data);
    }
  });
});

app.get("/chats/:id", (req, res) => {
  Messages.find({ _id: req.params.id }, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(200).send(data);
    }
  });
});
app.delete("/chats/:id", async (req, res) => {
  try {
    await Messages.findByIdAndDelete(req.params.id);
    res.status(200).json("Chat has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

app.post("/group/create", (req, res) => {
  const name = req.body.groupName;
  Rooms.create({ name }, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(201).send(data);
    }
  });
});

app.get("/all/rooms", (req, res) => {
  Rooms.find({}, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(200).send(data);
    }
  });
});

app.get("/room/:id", (req, res) => {
  Rooms.find({ _id: req.params.id }, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(200).send(data[0]);
    }
  });
});

app.delete("/room/:id", (req, res) => {
  Rooms.findByIdAndDelete({ _id: req.params.id }, (err, data) => {
    if (err) {
      return res.status(500).json(err);
    } else {
      return res.status(200).json("Room has been deleted...");
    }
  });
});

// app.delete("/room/:id", async (req, res) => {
//   try {
//     await Rooms.findByIdAndDelete(req.params.id);
//     res.status(200).json("Room has been deleted...");
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });

app.listen(process.env.PORT || 5000, () => {
  console.log("Backend server is running!");
});
