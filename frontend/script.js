// Our Websocket DOM element
const ws = new WebSocket('ws://localhost:8080');

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

// Login functionality
loginButton.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }

    // Simulate authentication (replace with actual API call later)
    if (authenticateUser(username, password)) {
        currentUser = username;
        loginPage.style.display = 'none';
        chatScreen.style.display = 'block';
        messageInput.disabled = false;
        sendButton.disabled = false;

        // Scroll to the bottom of the chat history when entering the chat
        setTimeout(scrollToBottom, 0); // Use setTimeout to ensure rendering is complete

        // Display a warning for the test user
        if (currentUser === 'test') {
            alert(`Welcome, ${currentUser}! (This is a test account for development purposes.)`);
        } else {
            alert(`Welcome, ${currentUser}!`);
        }
    } else {
        alert('Invalid username or password.');
    }
});

// Simulated authentication function
function authenticateUser(username, password) {
    // Hardcoded users for POC (including the test user)
    const users = {
        user1: 'pass1',
        user2: 'pass2',
        test: 'test' // Test user added here to test login page
    };
    return users[username] === password;
}


// Send message functionality
function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    // Send message with WebSocket send
    ws.send(`${currentUser}: ${message}`);
    messageInput.value = '';

    // Add user's message to chat history
    addMessageToChat(`${currentUser}: ${message}`);
}

// Add a message to the chat history
function addMessageToChat(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    chatHistory.appendChild(messageElement); //line 26 in index

    // Scroll to the bottom after adding a new message
    scrollToBottom();
}

// Function to scroll chat history to the bottom, since it was being added to the top at first
function scrollToBottom() {
    // Ensure the chat history scrolls to the bottom. I still need to figure out how to get it to start near the text box
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Event listener for the Send button
sendButton.addEventListener('click', sendMessage);

// Event listener for the Enter key in the message input as this would make it easier to test over only click listener on send button
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Logout functionality
logoutButton.addEventListener('click', () => {
    currentUser = null;
    chatHistory.innerHTML = ''; // Clear chat history for only the user who logged out
    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;
    chatScreen.style.display = 'none';
    loginPage.style.display = 'block';  //to insure login-page is visuable by default
});

ws.onopen = () => {
    console.log('Connected to the WebSocket server');
    // Heartbeat loop
    setInterval(() => {
        ws.send('heartbeat');
    }, 10000); // 10 sec interval
};

ws.onmessage = (event) => {
    // const messages = document.getElementById('messages');
    // const message = document.createElement('div');
    // message.textContent = event.data;
    // messages.appendChild(message);
    if (event.data.startsWith('heartbeat')) {
        return;
    }
    addMessageToChat(event.data);
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