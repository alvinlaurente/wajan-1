# Coding Test Challenge #1

### All of the source code provided in JavaScript using Express.js

- Sensitive information saved in .env file. To get the reference please refer to .env.example file.
- Database for storing chats between users is using Firebase Realtime Database.
- index.html is used for serving the chat app (and testing purpose).
- Since this is a chat app, I don't use any RESTful API to provide interaction server to client. The server will serve connection using socket (socket.io library) for bidirectional interaction to the client.
- If access the html file from the browser, browser will prompt the user to provide the username. The username will be used to interact in the chat app. User can send direct message to another user and broadcast message to all user. User also can access their chat histories from database.
- The message histories will be given to user after user submit their username. The histories collection are queried with several rules
  - All message that sent by user.
  - All message that received by user.
  - All broadcast message.
  - The message will be sorted by timestamp with ascending order.
- The Direct message will only shown to sender and receiver only and another user can't access the message from their histories.
- The Broadcast message will be seen by everybody that connected in socket server and the message can be accessed to all user from their histories.