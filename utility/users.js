const users = [];

//Tilføjer brugere til chatten 
function userJoin(id, username, room){
    const user = {id, username, room};

    users.push(user);

    return user;
}

//få fat i nuværende bruger
function getCurrentUser(id) {
    return users.find(user => user.id === id);
}

//bruger forlader chatten 
function userLeave(id){
    const index = users.findIndex(user => user.id === id);

    if(index!==-1){
        return users.splice(index,1)[0];
    }
}

//få fat room users
function getRoomUsers(room){
    return users.filter(user => user.room === room);
}

module.exports = {
    userJoin, 
    getCurrentUser,
    userLeave,
    getRoomUsers
};