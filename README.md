# chat2chat

Er en real-time chat applikation der eksekveres ved at have en server, der er ansvarlig for at holde styr på de forskellige chat-rum og de beskeder, der sendes inden for hvert chat-rum. Når en bruger sender en besked, sendes den til serveren, som derefter sender den videre til alle de andre brugere i det pågældende chat-rum.

For at opnå den "real-time" effekt, anvendes socket.io, der gør det muligt for serveren at sende beskeder til brugerne uden at brugerne selv behøver at foretage et aktivt API-kald til serveren for at hente nye beskeder.

På klientsiden er der netop skrevet JavaScript-kode, der håndterer ind- og udgående beskeder, ved at opdatere brugerens chat-vinduer og sende nye beskeder tilbage til serveren via websockets eller lignende.

