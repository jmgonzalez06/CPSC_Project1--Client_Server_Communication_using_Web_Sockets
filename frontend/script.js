// Our Websocket DOM element 
const host = window.location.hostname;
console.log('host is trying to connect to: ', host);
const wsUrl = `ws://${host}:8080`;  // Using ws:// for now
const ws = new WebSocket(wsUrl);

// Select DOM elements that we need for index.html
const loginPage = document.getElementById('login-page');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('login-button');
const chatHistory = document.getElementById('chat-history');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const logoutButton = document.getElementById('logout-button');

let currentUser = null;

// Login functionality with server-side authentication
loginButton.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }

    try {
        const response = await fetch(`http://${host}:5000/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();

        if (result.success) {
            currentUser = username;
            loginPage.style.display = 'none';
            chatScreen.style.display = 'block';
            messageInput.disabled = false;
            sendButton.disabled = false;
            setTimeout(scrollToBottom, 0);
            alert(`Welcome, ${currentUser}!`);
        } else {
            alert(result.message || 'Invalid username or password.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login. Please try again.');
    }
});

// Send message functionality
function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    ws.send(`${currentUser}: ${message}`);
    messageInput.value = '';
    addMessageToChat(`${currentUser}: ${message}`);
}

// Add a message to the chat history
function addMessageToChat(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    chatHistory.appendChild(messageElement);
    scrollToBottom();
}

// Function to scroll chat history to the bottom
function scrollToBottom() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Event listener for the Send button
sendButton.addEventListener('click', sendMessage);

// Event listener for the Enter key in the message input
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Logout functionality
logoutButton.addEventListener('click', () => {
    currentUser = null;
    chatHistory.innerHTML = '';
    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;
    chatScreen.style.display = 'none';
    loginPage.style.display = 'block';
});

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onopen = () => {
    console.log('Connected to the WebSocket server');
    console.log(wsUrl);
    setInterval(() => {
        ws.send('heartbeat');
    }, 10000); // 10 sec interval
};

ws.onmessage = (event) => {
    if (event.data.startsWith('heartbeat')) {
        return;
    }
    addMessageToChat(event.data);
};

ws.onclose = () => {
    console.log('Disconnected from the WebSocket server');
};