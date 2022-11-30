const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database('./db.sqlite',(err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the in-memory sqlite database')
});

db.serialize(function() {
    console.log('creating database if they don/t exist');
    db.run('Create table if not exists users(userID interger primary key, username text not null, password text not null)');
}); 

//Tilføjer bruger til Database 
const addUsertoDatabase = (username, password) => {
    db.run(
        'insert into users(username, password) values (?,?)',
        [username, password], 
        function(err) {
            if (err) {
                console.log(err);
            }
        }
    );
}

const getUserByUsername = (userName) => {
    //smart måde at konvertere fra callback til promise: 
    return new Promise((resolve, reject) => {
        db.all(
            'select * from users where userName=(?)', 
            [userName],
            (err, rows) => {
                if(err) {
                    console.log(err);
                    return reject (err);
                }
                return resolve(rows);
            }
        );
    })
}
