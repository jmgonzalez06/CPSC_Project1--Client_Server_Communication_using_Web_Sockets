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
const boldButton = document.getElementById('bold-button');
const italicsButton = document.getElementById('italics-button');
const underlineButton = document.getElementById('underline-button');

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
    messageElement.innerHTML = parseMarkdown(message); // Parse Markdown after sending
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

// Text formatting functionality

// Event listeners for buttons
boldButton.addEventListener('click', () => {
    formatText('bold');
});

italicsButton.addEventListener('click', () => {
    formatText('italic');
});

underlineButton.addEventListener('click', () => {
    formatText('underline');
});

// Logic to apply text formatting
function formatText(style) {
    const currentValue = messageInput.value;
    let formattedText = '';

    // Check if the text is already formatted
    if (currentValue.startsWith(`**${style}**`) || currentValue.startsWith(`*${style}*`) || currentValue.startsWith(`_${style}_`)) {
        // Remove the formatting
        formattedText = currentValue.replace(`**${style}**`, '').replace(`*${style}*`, '').replace(`_${style}_`, '');
    } else {
        // Add the formatting
        switch (style) {
            case 'bold':
                formattedText = `**${currentValue}**`;
                break;
            case 'italic':
                formattedText = `*${currentValue}*`;
                break;
            case 'underline':
                formattedText = `_${currentValue}_`;
                break;
            default:
                formattedText = currentValue;
        }
    }

    // Update the input field
    messageInput.value = formattedText;
}

// Function to apply Mardkown Syntax
function parseMarkdown(text) {
    return text
        .replace(/(\*\*(.*?)\*\*)/g, '<b>$2</b>')
        .replace(/(\*(.*?)\*)/g, '<i>$2</i>')
        .replace(/(_(.*?)_)/g, '<u>$2</u>');
}

// Emoji functionality
const emojiList = document.getElementById('emoji-list');

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

// Event listeners to display Emoji menu
emojiButton.addEventListener('click', () => {
    emojiMenu.style.display = 'block';
});

closeEmojiMenuButton.addEventListener('click', () => {
    emojiMenu.style.display = 'none';
});

// Add event listener to each emoji
document.querySelectorAll('.emoji').forEach((emoji) => {
    emoji.addEventListener('click', () => {
        const cursorPosition = messageInput.selectionStart;
        messageInput.value = messageInput.value.substring(0, cursorPosition) + emoji.textContent + messageInput.value.substring(cursorPosition);
        messageInput.focus();
        emojiMenu.style.display = 'none';
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

document.getElementById('message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const message = e.target.value;
        ws.send(message);
        e.target.value = '';
    }
});