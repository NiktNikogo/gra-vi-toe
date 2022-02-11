const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const morgan = require('morgan');
const {Server} = require('socket.io');
const io = new Server(server);
const mergeImages = require('merge-images');
const { Canvas, Image } = require('canvas');
const Room = require('./roomClass');
const utility = require('./utility');
const rooms = new Set();

const path = 'images_gen/';
const empty = path + 'empty.png';

app.set('view engine', 'ejs');
server.listen(3000, ()=>{
    console.log('http://localhost:3000');
});
app.use(express.static('public'));
app.use(morgan('dev'));

app.get('/', (req, res)=> {
    res.render('index');
});
app.get('/room/:id', (req, res)=> {
    let found = false;
    if(rooms) {
        Array.from(rooms).forEach(room => {
            if(req.params.id == room.id) 
                found = true;
        });
    }
    if(found)
        res.render('room', {id: req.params.id});
    else
        res.render('404');
});

io.on('connection', async (socket)=>{
    let roomID = socket.request.headers.referer;
    roomID = roomID.substr(roomID.length - 5);
    if(rooms) {
        Array.from(rooms).forEach(room => {
            if(roomID == room.id) {
                if(room.playerCount < 3 ){
                    socket.join(room.id);
                    room.playerCount = io.sockets.adapter.rooms.get(room.id).size;
                    io.to(room.id).emit('new user', {count:room.playerCount});  
                    room.timeout = 20;
                    if(room.playerCount == 3) {
                        let players = Array.from(io.sockets.adapter.rooms.get(roomID));
                        io.to(room.id).emit('game starting', {players: players});
                        room.timeout = 100;
                    }     
                } else {
                    io.to(socket.id).emit('room filled', {newUrl: 'http://localhost:3000'});
                }
            }
        });
    }
    socket.on('disconnect', () => {
        let fromUrl = socket.request.headers.referer;
        if(fromUrl.indexOf('localhost:3000/room') !== -1) {
            roomID = fromUrl.substr(fromUrl.length - 5);
            if(!(io.sockets.adapter.rooms.get(roomID) === undefined)) {
                let count = io.sockets.adapter.rooms.get(roomID).size;
                io.to(roomID).emit('user left', {count: count});
            }
            Array.from(rooms).forEach((room) => {
                if(roomID == room.id) {
                    room.playerCount--;
                };
            });
        }
    });
    socket.on('make new room', () => {
        if (rooms.size < 100) {
            let newID =  utility.gen_New_Id(rooms);
            room = new Room(newID, 0, 20);
            rooms.add(room);
            socket.emit('room id', {'roomID' : newID})
        } else {
            socket.emit('rooms filled');
        }
    });
    socket.on('move', async (data) =>{
        data = data.data;
        let [, roomID] = socket.rooms;
        let currRoom = null;
        Array.from(rooms).forEach(room => {
            if(roomID == room.id) {
                currRoom = room;
            }
        });
        currRoom.turn = data.turn;
        currRoom.timeout = 100;
        currRoom.setTile(data, utility.replace);
        const status = currRoom.checkState();
        const boardState = currRoom.boardState();
        const image = await utility.makeImageFromState(boardState);
        io.to(roomID).emit('move',{
            turn: data.turn,
            symbol: data.symbol,
            move: data.move,
            image: image
        });
        if(status != 0) {
            io.to(currRoom.id).emit('game ended', {status : status});
        }
    });
});

setInterval( () => {
    Array.from(rooms).forEach((room) => {
        room.timeout -= 1;
        if(room.timeout <= 0)  {
            rooms.delete(room);
            io.to(room.id).emit('room closed');
            io.sockets.adapter.rooms.delete(room.id);
        }
        //console.log(room.id, room.timeout);
    });
}, 1000);
