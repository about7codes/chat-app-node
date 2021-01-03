const socket = io();

// Elements 
const msgform = document.querySelector('#msgform');
const msgformInput = msgform.querySelector('input');
const msgformBtn = msgform.querySelector('button');
const shareLoc = document.querySelector('#shareloc');
const msgBox = document.querySelector('#messages')

// Templates 
const msgTemp = document.querySelector('#message-template').innerHTML;
const locTemp = document.querySelector('#location-template').innerHTML;
const sidebarTemp = document.querySelector('#sidebar-template').innerHTML;

// Options 
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    // new message element 
    const newMessage = msgBox.lastElementChild;

    // height of the new message
    const newMsgStyles = getComputedStyle(newMessage);
    const newMsgMargin = parseInt(newMsgStyles.marginBottom)
    const newMsgHeight = newMessage.offsetHeight + newMsgMargin;

    // visible height
    const visibleHeight = msgBox.offsetHeight;

    // height of messages container
    const containerHeight = msgBox.scrollHeight;

    // how far have I scrolled ?
    const scrollOffset = msgBox.scrollTop + visibleHeight;

    if(containerHeight - newMsgHeight <= scrollOffset){
        msgBox.scrollTop = msgBox.scrollHeight;
    }

}

socket.on('message', (msg)=>{
    const html = Mustache.render(msgTemp, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    });
    msgBox.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', (url)=>{
    console.log(url)
    const html = Mustache.render(locTemp, {
        username : url.username,
        url : url.url,
        createdAt: moment(url.createdAt).format('h:mm a')
    });
    msgBox.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('roomData', ({ room, users })=>{
    console.log(room);
    console.log(users);

    const html = Mustache.render(sidebarTemp, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html;
})

// Msg Form 
msgform.addEventListener('submit', (e)=>{
    e.preventDefault();
    msgformBtn.setAttribute('disabled', 'disabled');

    const inputTxt = e.target.elements.message.value;
    socket.emit('sendMsg', inputTxt, (error)=>{
        msgformBtn.removeAttribute('disabled');
        msgformInput.value = '';
        msgformInput.focus();
        if(error){
            return console.log(error);
        }

        console.log('Message delivered !')
    })
    
})

// Share Location btn 
shareLoc.addEventListener('click', ()=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser');
    }
    shareLoc.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
        const curLoc = {
            lat: position.coords.latitude,
            long: position.coords.longitude
        }

        socket.emit('shareLocation', curLoc, ()=>{
            console.log("Location shared !");
            shareLoc.removeAttribute('disabled');
        });
    })
})


socket.emit('join', { username, room }, (error)=>{
    if(error){
        alert(error);
        location.href = '/'
    }
})