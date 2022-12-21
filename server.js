const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 4000;
const sqlite3 = require('sqlite3').verbose();
var crypto = require('crypto');
const http = require('http');
const socketio = require('socket.io');
const cookieParser = require('cookie-parser');

const server = http.createServer(app);

const io = require('socket.io')(server, {
   cors: {
      origin: '*',
      methods: ['GET', 'POST'],
   },
});

const {
   userJoin,
   getCurrentUser,
   userLeave,
   getRoomUsers,
} = require('./utility/user');

const formatMessage = require('./utility/messages');

app.use(cookieParser());

//set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Admin';

//run when client connects
io.on('connection', (socket) => {
   socket.on('joinRoom', ({username, room }) => {
      const user = userJoin(socket.id, username, room);

      socket.join(user.room);

      //Welcome current user
      socket.emit('message', formatMessage(botName, 'Welcome to LetzChat!'));

      //Broadcast when a user connects. Viser til alle undtagen selve useren som forbinder
      socket.broadcast
         .to(user.room)
         .emit(
            'message',
            formatMessage(botName, `${user.username} has joined the chat`)
         );

      //send users and room info
      io.to(user.room).emit('roomUsers', {
         users: getRoomUsers(user.room),
      });
   });

   //Listen for chat message
   socket.on('chatMessage', (msg) => {
      const user = getCurrentUser(socket.id);

      io.to(user.room).emit('message', formatMessage(user.username, msg));
   });

   //runs when client disconnects
   socket.on('disconnect', () => {
      const user = userLeave(socket.id);

      if (user) {
         io.to(user.room).emit(
            'message',
            formatMessage(botName, `${user.username} left the chat`)
         );

         //send users and room info
         io.to(user.room).emit('roomUsers', {
            users: getRoomUsers(user.room),
         });
      }
   });
});

//sqlite ting
const db = new sqlite3.Database('./db.sqlite');

db.serialize(function () {
   console.log('creating database if they don/t exist');
   db.run(
      'Create table if not exists users(userID interger primary key, username text not null, password text not null)'
   );
});

//Tilføjer bruger til Database

const addUserToDatabase = (username, password) => {
   db.run(
      'insert into users(username, password) values (?,?)',
      [username, password],
      function (err) {
         if (err) {
            console.log(err);
         }
      }
   );
};

const deleteUserfromDatabase = (username, password) => {
   db.run(
      'select * from users where userName=(?)',
      [username, password],
      function(err) {
      if(err){
          winston.error(err);
      }
      else{
          console.log("Successful");
      }

  });
};

const getUserByUsername = (userName) => {
   //smart måde at konvertere fra callback til promise:
   return new Promise((resolve, reject) => {
      db.all(
         'select * from users where userName=(?)',
         [userName],
         (err, rows) => {
            if (err) {
               console.error(err);
               return reject(err);
            }
            return resolve(rows);
         }
      );
   });
};

const hashPassword = (password) => {
   const md5sum = crypto.createHash('md5');
   const salt = 'Some salt for the hash';
   return md5sum.update(password + salt).digest('hex');
};

app.use(express.static(__dirname + '/public'));

app.use(
   session({
      secret: 'Keep it secret',
      name: 'uniqueSessionID',
      saveUninitialized: false,
      resave: true,
   })
);

app.get('/', (req, res) => {
   if (req.session.loggedIn) {
      return res.redirect('/chat.html');
   } else {
      return res.sendFile('login.html', {
         root: path.join(__dirname, 'public'),
      });
   }
});

app.post(
   '/authenticate',
   bodyParser.urlencoded({ extended: true }),
   async (req, res) => {
      const user = await getUserByUsername(req.body.username);
      if (user.length === 0) {
         console.log('no user found');
         return res.redirect('/');
      }

      if (user[0].password === hashPassword(req.body.password)) {
         req.session.loggedIn = true;
         req.session.username = req.body.username;
         res.cookie('room', req.body.room, { maxAge: 99999999 });
         res.cookie('name', req.body.username, { maxAge: 99999999 });
         res.redirect('/chat.html');
      } else {
         // Sender en error 401 (unauthorized) til klienten
         return res.sendStatus(401);
      }
   }
);

app.get('/logout', function(req, res) {
   req.session.destroy(function(err){
      if(err){
         console.log(err);
      }else{
          res.redirect('/login.html');
      }
   });
});

app.get('/signup', (req, res) => {
   if (req.session.loggedIn) {
      return res.redirect('/chat.html');
   } else {
      return res.sendFile('signup.html', {
         root: path.join(__dirname, 'public'),
      });
   }
});

app.post(
   '/signup',
   bodyParser.urlencoded({ extended: true }),
   async (req, res) => {
      const user = await getUserByUsername(req.body.username);
      if (user.length > 0) {
         return res.send('Username already exists');
      }
      addUserToDatabase(req.body.username, hashPassword(req.body.password));
      res.redirect('/');    
   } 
);

app.delete('/delete', async (req, res) => {
    
   const deleteUser = await deleteUserfromDatabase(req.params.username); 
 
   Product.deleteOne({
     _id: productId
   }, (error, result) => {
     if(error) {
       res.json({error: 'Unable to delete product'})
     } else {
       res.json({success: true, message: 'Product deleted successfully!'})
     }
   })
 
 })

//ping pong
/// dgram modulet arbejer med datagram sockets og sender beskeder fra en client/server til en anden 
const dgram = require('dgram');
const client = dgram.createSocket('udp4');

var time = 0 

function sendMessage (message, port, host){
   return new Promise((resolve, reject) => {
      client.send(message, 0, message.length, port, host, (error, bytes) => {
         if (error) {
            return reject(error);
         }
         return resolve(bytes);
      })
   })
}

 function pinging (serverAdress) {

   const message = 'ping'
   sendMessage(message, port, serverAdress).then(() => {
      time = Date.now();
      console.log('Sent', message, 'at time:', time);
   })
 }

 pinging('127.0.0.1')

 //Round trip time 
//



 const Traceroute = require('nodejs-traceroute');

try {
    const tracer = new Traceroute();
    tracer
        .on('pid', (pid) => {
            console.log(`pid: ${pid}`);
        })
        .on('destination', (destination) => {
            console.log(`destination: ${destination}`);
        })
        .on('hop', (hop) => {
            console.log(`hop: ${JSON.stringify(hop)}`);
        })
        .on('close', (code) => {
            console.log(`close: code ${code}`);
        });

    tracer.trace('127.0.0.1');
} catch (ex) {
    console.log(ex);
}


//HTTP ting
app.get('/', function (req, res) {
   res.sendFile(__dirname + '/chat.html');
});

server.listen(4000, function () {
   console.log('Server runs on PORT 4000');
});
