const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
    console.log('Connected to the WebSocket server');
};

ws.onmessage = (event) => {
    const messages = document.getElementById('messages');
    const message = document.createElement('div');
    message.textContent = event.data;
    messages.appendChild(message);
};

ws.onclose = () => {
    console.log('Disconnected from the WebSocket server');
};

document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const message = e.target.value;
        ws.send(message);
        e.target.value = '';
    }
});