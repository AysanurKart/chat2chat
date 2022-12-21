/*Denne kode eksporterer en enkelt funktion kaldet formatMessage, som tager et brugernavn og en tekst som argumenter.
Det returnerer et objekt med tre egenskaber: brugernavn, tekst og tid. Tidsegenskaben er det aktuelle tidspunkt,
formateret ved hjælp af momentbibliotekets formatfunktion.

Formatfunktionen tager en streng som et argument, der angiver det format, som tiden skal vises i.
I dette tilfælde angiver strengen 'h:mm a', at tiden skal vises i timer og minutter med am eller pm tilføjet.
*/

const moment = require('moment');

function formatMessage(username, text) {
    return {
        username, 
        text, 
        time: moment().format('h:mm a')
    }
}

module.exports = formatMessage;