const express = require('express');
const path = require('path');
const http = require('http');

const sockets = require('./sockets');

const app = express();
const server = http.createServer(app);
sockets(server);

app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 1337;
server.listen(PORT, console.log(`Listening on http://localhost:${PORT}`));
