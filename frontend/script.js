// =============================
// SecureChat Frontend Script
// =============================

const host = window.location.hostname;
console.log('Connecting to host:', host);

let ws = null;
let currentUser = null;

// DOM element references
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
const fileButton = document.getElementById('file-button');
const fileInput = document.getElementById('file-input');
const typingStatus = document.getElementById('typing-status');


// =============================
// Login Handler
// =============================
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
            initializeWebSocket();
        } else {
            alert(result.message || 'Invalid username or password.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login.');
    }
});

// =============================
// WebSocket Setup (Post-login)
// =============================
function initializeWebSocket() {
    console.log("🔥 initializeWebSocket() called");
    // ws = new WebSocket(`ws://${host}:8080?user=${encodeURIComponent(currentUser)}`)
    const wsUrl = `ws://${window.location.hostname}:8080?user=${encodeURIComponent(currentUser)}`;
    console.log("🔌 Connecting to:", wsUrl);
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('Connected to WebSocket');
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "heartbeat" }));
            }
        }, 10000); // Heartbeat every 10s
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
    
            // Ignore heartbeat messages
            if (data.type === "heartbeat") return;
    
            if (data.type === "message") {
                const isLink = data.message.includes("Shared a file:");
                const message = data.user === currentUser
                    ? `<span style="color: orange;">You</span>: ${isLink ? data.message : parseMarkdown(data.message)}`
                    : `<span style="color: blue;">${data.user}</span>: ${isLink ? data.message : parseMarkdown(data.message)}`;
                addMessageToChat(message);
            }
    
            if (data.type === "typing") {
                typingStatus.textContent = `${data.user} is typing...`;
                setTimeout(() => { typingStatus.textContent = ''; }, 3000);
                return; // skip the fallback log
            }
    
            if (data.type === "status") {
                const statusText = `${data.user} is ${data.status}`;
                addMessageToChat(`<i style="color: gray;">${statusText}</i>`);
            }

            if (data.type === "status" && data.status === "cleared the chat history") {
                chatHistory.innerHTML = ''; // Added to attempt to clear the DOM
            }
    
        } catch (e) {
            console.error("Invalid message from server:", event.data);
        }
    };

    ws.onclose = () => console.log('WebSocket disconnected.');
    ws.onerror = (e) => console.error('WebSocket error:', e);
}

// =============================
// Sending Messages
// =============================
function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || !ws) return;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.warn("WebSocket is not open.");
        return;
    }
    
    ws.send(JSON.stringify({
        type: "message",
        user: currentUser,
        message: message
    }));
    messageInput.value = '';
    const isLink = message.includes("Shared a file:");
    addMessageToChat(`<span style="color: orange;">You</span>: ${isLink ? message : parseMarkdown(message)}`);
}

messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') sendMessage();
    else if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "typing", user: currentUser }));
    }
});
sendButton.addEventListener('click', sendMessage);

// =============================
// Logout
// =============================
logoutButton.addEventListener('click', () => {
    if (ws) ws.close();
    currentUser = null;
    chatHistory.innerHTML = '';
    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;
    chatScreen.style.display = 'none';
    loginPage.style.display = 'block';
});

// =============================
// Markdown Parser
// =============================
function parseMarkdown(text) {
    return text
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>') // Markdown link [text](url)
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
        .replace(/\*(.*?)\*/g, '<i>$1</i>')     // Italic
        .replace(/_(.*?)_/g, '<u>$1</u>');      // Underline
}

// =============================
// Chat Display Helpers
// =============================
function addMessageToChat(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    chatHistory.appendChild(div);
    scrollToBottom();
}
function scrollToBottom() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// =============================
// Text Formatting Buttons
// =============================
boldButton.onclick = () => formatText('**');
italicsButton.onclick = () => formatText('*');
underlineButton.onclick = () => formatText('_');

function formatText(symbol) {
    const msg = messageInput.value;
    messageInput.value = `${symbol}${msg}${symbol}`;
}

// =============================
// Emoji Functionality
// =============================

// 1. Add emojis dynamically to #emoji-list
const emojiList = document.getElementById('emoji-list');
const emojis = ['🙂', '😀', '😄', '😎', '😍',
    '🙁', '😮', '😲', '😳', '😦',
    '😥', '😢', '😭', '😱', '😓',
    '🥰', '😋', '🤪', '😛', '😜',
    '😂', '🤭', '🤫', '🤨', '😐',
    '😒', '🙄', '😬', '🤢', '🤮',
    '🥶', '🥴', '💀', '🤡', '💩'];

emojis.forEach((emoji) => {
    const emojiElement = document.createElement('span');
    emojiElement.textContent = emoji;
    emojiElement.className = 'emoji';
    emojiList.appendChild(emojiElement);
});

// 2. Toggle emoji menu visibility
emojiButton.onclick = () => {
    emojiMenu.style.display = emojiMenu.style.display === 'block' ? 'none' : 'block';
};
closeEmojiMenuButton.onclick = () => {
    emojiMenu.style.display = 'none';
};

// 3. Insert clicked emoji into message input
document.querySelectorAll('.emoji').forEach(e => {
    e.onclick = () => {
        const pos = messageInput.selectionStart;
        messageInput.value = messageInput.value.substring(0, pos) + e.textContent + messageInput.value.substring(pos);
        messageInput.focus();
        emojiMenu.style.display = 'none';
    };
});

// =============================
// File Upload Handler
// =============================
fileButton.onclick = () => fileInput.click();
fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(`http://${host}:5000/upload`, {
            method: 'POST',
            body: formData
        });
        const result = await res.json();
        if (result.success) {
            ws.send(JSON.stringify({
                type: "message",
                user: currentUser,
                message: `Shared a file: <a href="${result.url}" target="_blank">${file.name}</a>`
            }));
        } else {
            alert('Upload failed.');
        }
    } catch (err) {
        console.error('Upload error:', err);
        alert('Upload failed.');
    }
};