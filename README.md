## Needed Commands to get it running
1. python.exe -m pip install --upgrade pip 
2. pip install websockets
3. pip install bcrypt
4. pip install flask-cors
5. pip install -r backend/requirements.txt

# Make sure to set IP of WebSocket Server PC in script.js

# To run, use terminal to run the following command and open index.html on your browser 
python ./backend/server.py

# To connect on another device, use the URL
# http://<HOST IP>/frontend/index.html
# Change IP to your network. Need to be connected to same network.

# Test User Login Info
User 1 : user1, password123
User 2 : user2, password456
User 3 : user3, password789

# CPSC_Project1--Client_Server_Communication_using_Web_Sockets

You are a security tooling analyst working for SecureTech Solutions, a company specializing in software for distributed teams. The company is developing a real-time communication tool called SecureChat, aimed at remote teams that require secure and efficient communication without relying on third-party services like Slack or Teams. Your task is to design and implement the communication system for SecureChat, focusing on secure WebSocket-based communication.
 
-----------------------------------------------------------------------------------------
Project Scope

- A client-server WebSocket-based chat system that allows team members to communicate in real time. For the POC, you must have 2 users communicating on the system.

SecureChat will serve as a foundational product for SecureTech’s offerings. The first version of the system has undergone code review & focus groups to determine the following improvements to be made:

- The users of the client-server WebSocket-based chat system were confused on how to communicate to one another. You realize that this communication should be facilitated through the local network.
- The shared passwords got leaked...
- Some of the messages were captured in plain-text by various security tools. 
- The interface was not user-friendly.
- Users were confused as to how to run the program through something called a terminal?
- Can I send files? How about emojis?

-----------------------------------------------------------------------------------------
Key Features
1. Real-Time Messaging:

- Users can log in and send messages to other connected team members.
- Messages should appear instantly in the chat window for all connected clients.

2. Secure Connection:

- All communication must occur over a WebSocket connection (wss://).

3. User Authentication:

- Before accessing the chat, users must authenticate themselves using a basic authentication method (e.g. username and password)

4. Rate Limiting:

- Implement rate limiting to prevent abuse, such as spamming the server with excessive messages.

5. Connection Handling:

- Detect and handle dropped connections gracefully (Join & Disconnect functionality).
- Reconnect clients automatically in case of interruptions (e.g heartbeat functionality).

5. User-Friendly Interface (GUI):
- Replace the terminal-based interface with a desktop GUI.
-  Implement a user selection window to navigate between different users. Users should seamlessly be able to move chats without leaving the application. (e.g. User1 switches chats with User2 to User3)

6. File Sharing Capabilities:
- Implement secure file transfers with encryption. Consider exploring alternative protocols to achieve this.

7. Emoji & Rich Media Support:

- Integrate a Unicode emoji picker into the chat interface.
- Allow basic text formatting (bold, italics, links, etc.)

8. Security Hardening:

- Introduce brute-force protection for login attempts
	- Recall what brute-force is. Once you remember this, implementation should be straight-forward.
- Construct a logging system that preserves chat logs. This should generate a new log file for each session that is opened for chat, for each chat. You may keep these logs as TXT files.
- End-to-End encryption should be explored. As an example, you may utilize either AES-256 for message content and RSA-4096 for key exchange. Libraries are permitted for this component, but take caution in over-reliance.

9. User Authentication: 

- Users will need to create an account prior to using the chat system.
- All data stored should be encrypted. Authentication should utilize a hashing algorithm to compare rather than comparing plain-text. All authentication & authorization should occur on the server, not the client.
 
-----------------------------------------------------------------------------------------
Deliverables
- A video presentation showing the following:
	- An explanation of the functionality of the programs
	- Present two clients (simulated on separate browser windows or systems) connected to the WebSocket server.

- Present three clients (simulated on separate systems on either the same network or via the Internet) connected to the WebSocket server. The server should be hosted on a different system than the ones running the client.
	- Students may "simulate" multiple machines by using virtual machines.

- Show an active chat session between the three clients:
	- User1 & User2
	- User2 & User3
	- User3 & User1

- Updated executable(s)
	- Client (should be an EXE file or opened via browser)
	- Server

- Updated Documentation
	- User Guide

- Updated Changelog (Easiest through Github)
	- Document each edit made to the program
	- Show various versions that represent multiple iterations
