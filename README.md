## Needed Commands to get it running
1. python.exe -m pip install --upgrade pip 
2. pip install websockets
3. pip install bcrypt
4. pip install -r backend/requirements.txt

# To run, use terminal to run the following command and open index.html on your browser 
python ./backend/server.py

# CPSC_Project1--Client_Server_Communication_using_Web_Sockets

You are a security tooling analyst working for SecureTech Solutions, a company specializing in software for distributed teams. The company is developing a real-time communication tool called SecureChat, aimed at remote teams that require secure and efficient communication without relying on third-party services like Slack or Teams. Your task is to design and implement the communication system for SecureChat, focusing on secure WebSocket-based communication.

Students will learn how to secure WebSocket connections against potential threats such as man-in-the-middle (MITM) attacks, message tampering, and unauthorized access.

 
-----------------------------------------------------------------------------------------
Project Scope
SecureChat will serve as a foundational product for SecureTech’s offerings. The first version of the system will be a proof-of-concept (POC):

- A client-server WebSocket-based chat system that allows team members to communicate in real time. For the POC, you must have 2 users communicating on the system.
- Bonus: Functionality to transfer files (documents, images, etc.)
	- Hint: Explore other protocols such as FTP
 
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
 
-----------------------------------------------------------------------------------------
Deliverables
- A video presentation showing the following:
	- An explanation of the functionality of the programs
	- Present two clients (simulated on separate browser windows or systems) connected to the WebSocket server.
- Executable(s)
	- Client
	- Server
- Documentation
	-User Guide
- Changelog (Easiest through Github)
	- Document each edit made to the program
	- Show various versions that represent multiple iterations