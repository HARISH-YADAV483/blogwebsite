const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer();
const io = new Server(server);

io.on("connection", (socket) => {
    socket.join("room1");
    socket.join("room2");
    console.log(socket.rooms);
    console.log(socket.rooms.has("room1"));
    process.exit(0);
});

server.listen(3000, () => {
    const { io: Client } = require("socket.io-client");
    const client = Client("http://localhost:3000");
});
