const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const http = require('http');
const socketIO = require('socket.io');
const config = require('./config');

const app = express();
const port = config.port;

// Use Firebase Realtime Database with ref = messages
const firebase = require('./firebase.js');
admin.initializeApp({
  credential: admin.credential.cert(firebase),
  databaseURL: config.databaseURL
});
const db = admin.database();
const messagesRef = db.ref('messages');

app.use(bodyParser.json());

// Use Socket.io for chats
const server = http.createServer(app);
const io = socketIO(server);

function findSocketByUser(username) {
  const sockets = io.sockets.sockets;
  for (const [key, value] of sockets.entries()) {
    if (value?.username && value.username.username === username) {
      return key
    }
  }
  return null;
}

// Handle socket connections
io.on('connection', (socket) => {
  console.log(`User ${socket.id} connected`);

  socket.on('set_username', (username) => {
    socket.username = username;

  });

  // Get message histories from db
  socket.on('histories', async (data) => {
    const { sender } = data;
    const senderSocket = findSocketByUser(sender);
    const messageHistories = [];

    function pushToArray(messages, histories) {
      if (messages) {
        for (const key of Object.keys(messages)) {
          histories.push({
            timestamp: messages[key].timestamp,
            datetime: new Date(messages[key].timestamp).toLocaleString(),
            sender: messages[key].sender,
            receiver: messages[key].receiver,
            message: messages[key].message
          })
        }
      }
    }

    if (senderSocket) {
      await messagesRef.orderByChild('receiver').equalTo('ALL').once('value', snapshot => {
        pushToArray(snapshot.val(), messageHistories)
      })
      await messagesRef.orderByChild('sender').equalTo(sender).once('value', snapshot => {
        pushToArray(snapshot.val(), messageHistories)
      })
      await messagesRef.orderByChild('receiver').equalTo(sender).once('value', snapshot => {
        pushToArray(snapshot.val(), messageHistories)
      });

      messageHistories.sort((a, b) => a.timestamp - b.timestamp)
      messageHistories.forEach((val) => {
        io.to(senderSocket).emit('new_message', {
          timestamp: val.datetime,
          sender: val.sender,
          receiver: val.receiver,
          message: val.message
        })
      })
    }
    
  })
  
  // Listen for new messages and DM to both receiver and sender
  socket.on('direct_message', (data) => {
    const { sender, receiver, message } = data;
    const timestamp = admin.database.ServerValue.TIMESTAMP
    const senderSocket = findSocketByUser(sender);
    const receiverSocket = findSocketByUser(receiver);

    // Store message in Firebase Realtime Database
    const newMessageRef = messagesRef.push();
    newMessageRef.set({
      sender,
      receiver,
      message,
      timestamp
    });

    io.to(senderSocket).emit('new_message', { sender, receiver, message, timestamp: new Date().toLocaleString() });
    io.to(receiverSocket).emit('new_message', { sender, receiver, message, timestamp: new Date().toLocaleString() });
  });

  // Listen for new messages and broadcast to all user
  socket.on('broadcast', (data) => {
    const { sender, broadcast } = data;
    const timestamp = admin.database.ServerValue.TIMESTAMP

    // Store message in Firebase Realtime Database
    const newMessageRef = messagesRef.push();
    newMessageRef.set({
      sender,
      receiver: 'ALL',
      message: broadcast,
      timestamp
    });

    io.emit('new_message', {
      sender,
      receiver: 'ALL',
      message: broadcast,
      timestamp: new Date().toLocaleString()
    })
  })

  // Disconnect event
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Endpoint to serve HTML page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
