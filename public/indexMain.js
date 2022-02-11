var socket = io();

document.getElementById('makeRoom').onclick = () => {
    socket.emit('make new room'); 
}
socket.on('room id', (msg) => {
    let link = document.getElementById('link');
    let linkToSite = 'http://localhost:3000/room/'+msg.roomID;
    link.innerHTML = 
    "<div>" +
        "<a href = '" + `/room/${msg.roomID}` + "'>" +
            "room" +
        "</a>" +
        `<p>${linkToSite}</p>`+
    "</div>";
})
socket.on('rooms filled', () => {
    let link = document.getElementById('link'); 
    link.innerHTML = 
    "<div>" +
        "<p>Wszystkie pokoje zajęte :(</p>"   
    "</div>";
});