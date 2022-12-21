//Denne kode eksporterer fire funktioner: userJoin, getCurrentUser, userLeave og getRoomUsers.

const users = [];

//join user to chat. UserJoin tager altså et id, et brugernavn og et rum som argumenter og opretter et nyt brugerobjekt med
//disse egenskaber. Det tilføjer derefter det nye brugerobjekt til brugerarrayet og returnerer brugerobjektet.
function userJoin(id, username, room) {
    const user= {id, username, room};
    
    users.push(user);

    return user;
}

//get current user. GetCurrentUser tager et id som et argument og returnerer brugerobjektet i brugerarrayet, der har samme id.
function getCurrentUser(id) {
    return users.find(user => user.id === id);
}

//User leaves chat. UserLeave tager et id som et argument og fjerner brugerobjektet med det id fra brugerarrayet.
//Det returnerer det fjernede brugerobjekt.
function userLeave(id){
    const index = users.findIndex(user => user.id === id);

    if(index !== -1) {
        return users.splice(index,1)[0];
    }
}

//GetRoomUsers tager et rum som et argument og returnerer et array af brugerobjekter i brugerarrayet, der har den sammerumegenskab.
function getRoomUsers(room) {
    return users.filter(user => user.room === room); 
}

module.exports = {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
};