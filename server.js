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

const botName = 'Administrator Mette';

//run when client connects
io.on('connection', (socket) => {
   socket.on('joinRoom', ({username, room }) => {
      const user = userJoin(socket.id, username, room);

      socket.join(user.room);

      //Welcome current user
      socket.emit('message', formatMessage(botName, 'Hej du! Velkommen til Chat2chat! Husk den god tone. '));

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

// Parse the cookies from the document.cookie string. Denne kode definerer en parseCookies-funktion,
//der analyserer document.cookie-strengen og returnerer et objekt, der indeholder nøgleværdi-parrene af cookies. 
//Den definerer også funktionerne getCurrentRoom og setCurrentRoom, der bruger funktionen parseCookies til at hente
// og indstille værdien af den aktuelleRoom-cookie. Endelig definerer den en joinRoom-funktion, der indstiller 
//den aktuelleRoom-cookie og udsender en 'join'-begivenhed til serveren med det angivne rum.
//Denne kode kan bruges til at administrere cookies  i en chatapplikation i realtid med flere rum. Du kan bruge
//getCurrentRoom-funktionen til at bestemme, hvilket rum brugeren befinder sig i, og joinRoom-funktionen til 
//at give brugeren mulighed for at skifte mellem rum.
function parseCookies() {
   var cookies = {};
 
   if (document.cookie) {
     var cookieArray = document.cookie.split('; ');
 
     for (var i = 0; i < cookieArray.length; i++) {
       var cookie = cookieArray[i];
       var index = cookie.indexOf('=');
 
       var key = cookie.substring(0, index);
       var value = cookie.substring(index + 1);
 
       cookies[key] = value;
     }
   }
 
   return cookies;
 }
 
 // Get the current room from the cookies
 function getCurrentRoom() {
   var cookies = parseCookies();
   var currentRoom = cookies['currentRoom'];
 
   if (currentRoom) {
     return currentRoom;
   } else {
     return 'default';
   }
 }
 
 // Set the current room in the cookies
 function setCurrentRoom(room) {
   document.cookie = 'currentRoom=' + room;
 }
 
 // Join the specified room
 function joinRoom(room) {
   setCurrentRoom(room);
   socket.emit('join', room);
 }
 


//sqlite ting. Oprettelse af en ny SQLite-database og definere en tabel kaldet "brugere" i den. 
//Tabellen har tre kolonner: "bruger-id", "brugernavn" og "adgangskode". Kolonnen "brugerID" er af typen "heltal" og er 
//indstillet som den primære nøgle, hvilket betyder, at den er unik og ikke kan være null. Kolonnerne "brugernavn" og 
//"adgangskode" er begge af typen "tekst" og er begge sat som "ikke null", hvilket betyder, at de skal have en værdi, der ikke er nul.
const db = new sqlite3.Database('./db.sqlite');


//Denne kode bruger serialiseringsmetoden for sqlite3-modulet for at sikre, at databasehandlingerne udføres på en
//serialiseret måde. Run-metoden bruges derefter til at udføre en SQL-sætning, der opretter 
//"brugere"-tabellen, hvis den ikke allerede eksisterer.
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

//Sletter brugere fra database
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

// a function called hashPassword that takes a password as input and returns a hashed version of the password using 
//the MD5 hashing algorithm. The function uses the createHash method of the crypto module to create a hash object, which 
//is then used to generate the hashed password using the update and digest methods.

const hashPassword = (password) => {
   const md5sum = crypto.createHash('md5');
//Funktionen inkluderer også et salt, som er en tilfældig streng af tegn, der føjes til adgangskoden, før den hashes. 
//Saltet bruges til at gøre det sværere for en angriber at knække adgangskoden ved at tilføje en unik og uforudsigelig
//komponent til hashing-processen.
   const salt = 'Some salt for the hash';
   return md5sum.update(password + salt).digest('hex');
};

app.use(express.static(__dirname + '/public'));

//Sessionsmellemwaren gemmer sessionsinformation i en cookie på klientens browser og giver dig mulighed for at gemme og
//hente data på serveren for hver brugers session.
app.use(
   session({
      secret: 'Keep it secret',
      name: 'uniqueSessionID',
      saveUninitialized: false,
      resave: true,
   })
);

//Den kode, du har angivet, ser ud til at definere en rute i en Express.js-applikation, der håndterer HTTP GET-anmodninger til root path
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
   '/godkendelse',
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

//at definere en rute i en Express.js-applikation, der håndterer HTTP POST-anmodninger til /godkendelsesstien.
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

//definere en rute i en Express.js-applikation, der håndterer HTTP GET-anmodninger til /logout
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


//efinere en rute i en Express.js-applikation, der håndterer HTTP DELETE-anmodninger til /delete-stien.
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


//omslutter sendemetoden i et løfte, så den kan bruges asynkront. Funktionen tager en besked, port og vært som argumenter
//og returnerer et løfte, der enten løses med antallet af sendte bytes eller afvises med et fejlobjekt.
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

//sends a message of 'ping' to the specified server address using the sendMessage function. The time variable is set to the current time before the message is sent.
//This code could be used to implement a simple ping utility that sends a message to a server and measures the round-trip time
// (RTT) of the message. To measure the RTT, you could record the time when the message is sent and the time when the response is received,
//and then subtract the send time from the receive time to get the RTT. You could then display the RTT to the user
//or use it for other purposes, such as determining the availability or performance of the server.
 
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


//importerer Traceroute-klassen fra nodejs-traceroute. Denne kode kunne bruges til at udføre en traceroute-operation fra
//en Node.js-applikation og vise ruten taget af pakker til konsollen.
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
