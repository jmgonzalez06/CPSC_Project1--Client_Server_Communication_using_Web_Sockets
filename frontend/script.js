// Our Websocket DOM element 
// Dynamically retrieves IP address
const host = window.location.hostname;
console.log('host is trying to connect to: ', host);
const wsUrl = `ws://${host}:8080`; //Update to wss when possible
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
const emojiButton = document.getElementById('emoji-button');
const emojiMenu = document.getElementById('emoji-menu');
const closeEmojiMenuButton = document.getElementById('close-emoji-menu-button');
const emojiList = document.getElementById('emoji-list');

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

// Emoji list population
// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    console.log('loginPage:', loginPage);
    console.log('chatScreen:', chatScreen);
    console.log('emojiButton:', emojiButton);
    console.log('emojiMenu:', emojiMenu);
    console.log('emojiList:', emojiList);
    console.log('closeEmojiMenuButton:', closeEmojiMenuButton);
    console.log('sendButton:', sendButton);

    if (!emojiList) {
        console.error('emojiList element not found in DOM');
        return;
    }
    if (!emojiButton) {
        console.error('emojiButton element not found in DOM');
        return;
    }
    if (!emojiMenu) {
        console.error('emojiMenu element not found in DOM');
        return;
    }
    if (!closeEmojiMenuButton) {
        console.error('closeEmojiMenuButton element not found in DOM');
        return;
    }
    if (!sendButton) {
        console.error('sendButton element not found in DOM');
        return;
    }
    if (!messageInput) {
        console.error('messageInput element not found in DOM');
        return;
    }
    if (!logoutButton) {
        console.error('logoutButton element not found in DOM');
        return;
    }

    const emojis = ['🙂', '😀', '😄', '😎', '😍',
        '🙁', '😮', '😲', '😳', '😦',
        '😥', '😢', '😭', '😱', '😓',
        '🥰', '😋', '🤪', '😛', '😜',
        '😂', '🤭', '🤫', '🤨', '😐',
        '😒', '🙄', '😬', '🤢', '🤮',
        '🥶', '🥴', '💀', '🤡', '💩',];
    emojis.forEach((emoji) => {
        const emojiElement = document.createElement('span');
        emojiElement.textContent = emoji;
        emojiElement.className = 'emoji';
        emojiList.appendChild(emojiElement);
    });

    emojiButton.addEventListener('click', () => {
        console.log('Emoji button clicked, current display:', emojiMenu.style.display);
        emojiMenu.style.display = emojiMenu.style.display === 'block' ? 'none' : 'block';
        console.log('New display:', emojiMenu.style.display);
    });
    closeEmojiMenuButton.addEventListener('click', () => {
        emojiMenu.style.display = 'none';
    });
    document.querySelectorAll('.emoji').forEach((emoji) => {
        emoji.addEventListener('click', () => {
            const cursorPosition = messageInput.selectionStart;
            messageInput.value = messageInput.value.substring(0, cursorPosition) + emoji.textContent + messageInput.value.substring(cursorPosition);
            messageInput.focus();
            emojiMenu.style.display = 'none';
        });
    });

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
        if (event.key === 'Enter') {
            const message = event.target.value;
            ws.send(message);
            event.target.value = '';
        }
    });
    logoutButton.addEventListener('click', () => {
        currentUser = null;
        chatHistory.innerHTML = '';
        messageInput.value = '';
        messageInput.disabled = true;
        sendButton.disabled = true;
        chatScreen.style.display = 'none';
        loginPage.style.display = 'block';
    });
});

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onopen = () => {
    console.log('Connected to the WebSocket server');
    console.log(wsUrl)
    // Heartbeat loop
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
