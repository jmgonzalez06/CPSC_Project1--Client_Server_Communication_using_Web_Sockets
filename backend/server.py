import asyncio
import websockets
import os
from dotenv import load_dotenv
import json
from db import authenticate_user  # Import authentication function
import time
import socket
import http.server
import socketserver
import threading
import ssl
from flask import Flask, request, jsonify
from flask_cors import CORS

# Get local network IP of server Jose needs to hardcode 
def get_local_ip():
    try:
        # Create a socket and connect to an external server (Google DNS)
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))  # Doesn’t send data, just binds to the right interface
        ip = s.getsockname()[0]
        s.close()
        print(f"Selected IP: {ip}")
        return ip
    except Exception as e:
        print(f"Error detecting IP: {e}")
        # Fallback to hostname resolution
        return socket.gethostbyname(socket.gethostname())

# Use it as before
HOST = get_local_ip()

# Store connected clients
connected_clients = set()

# Load environment variables from .env file
load_dotenv()

# Get the port from the environment variable, default to 8080 if not set
HOST = get_local_ip()
PORT = int(os.getenv("PORT", 8080))

# Settings for rate limit
RATE_LIMIT_INTERVAL = 5 # 5 seconds
RATE_LIMIT_THRESHOLD = 5 # 5 messages per interval

# Store each client's message frequency
client_msg_freq = {}

# Heartbeat frequency
HEARTBEAT_FREQ = 10  # 10 seconds

# Create simple HTTP server to serve static files
PORT_HTTP = 8081
httpd = socketserver.TCPServer(("", PORT_HTTP), http.server.SimpleHTTPRequestHandler)
print(f"HTTP server serving on port {PORT_HTTP}")

# Run the HTTP server
http_thread = threading.Thread(target=httpd.serve_forever)
http_thread.daemon = True # Set as daemon to exit with main thread
http_thread.start()


async def handle_connection(websocket, path):
    # Add the new client to the connected clients set
    connected_clients.add(websocket)
    print(f"New client connected. Total clients: {len(connected_clients)}")

    # Get client's id and prepare to track
    client_id = id(websocket)
    client_msg_freq[client_id] = (time.time(), 0)

    # Loop heartbeats
    asyncio.create_task(heartbeat(websocket, client_id))

    try:
        async for message in websocket:
            # Check rate limit
            timestamp, frequency = client_msg_freq[client_id]
            if time.time() - timestamp < RATE_LIMIT_INTERVAL:
                if frequency >= RATE_LIMIT_THRESHOLD:
                    await websocket.send("Please wait to send more messages!")
                    continue
                client_msg_freq[client_id] = (timestamp, frequency + 1)
            else:
                client_msg_freq[client_id] = (time.time(), 1)

            # Handle message
            print(f"Received: {message}")

            # Broadcast the message to all connected clients
            for client in connected_clients:
                if client != websocket and client.open:
                    await client.send(message)
    except websockets.ConnectionClosed:
        print("Client connection has closed.")
          

async def heartbeat(websocket, client_id):
    while True:
        try:
            await websocket.ping()
            await asyncio.sleep(HEARTBEAT_FREQ)
        except websockets.ConnectionClosed:
            del client_msg_freq[client_id]
            connected_clients.remove(websocket)
            print(f"Client disconnected. Total clients: {len(connected_clients)}")
            break

# Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password are required.'}), 400
    if authenticate_user(username, password):  # Use db.py function
        return jsonify({'success': True, 'message': 'Login successful.'}), 200
    return jsonify({'success': False, 'message': 'Invalid username or password.'}), 401

# Start Flask in a separate thread
def run_flask():
    app.run(host='0.0.0.0', port=5000, debug=False)

flask_thread = threading.Thread(target=run_flask)
flask_thread.daemon = True
flask_thread.start()

# Path to SSL/TLS certificate and private key FAILED WILL COME BACK TO THIS OR REPLACE LATER
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Path to backend folder
SSL_CERTFILE = os.path.join(BASE_DIR, "cert.pem")
SSL_KEYFILE = os.path.join(BASE_DIR, "key.pem")

# Verify certificate files exist
if not os.path.exists(SSL_CERTFILE) or not os.path.exists(SSL_KEYFILE):
    raise FileNotFoundError("Certificate files (cert.pem and key.pem) are missing from the backend folder.")

# Create SSL context
ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ssl_context.load_cert_chain(certfile=SSL_CERTFILE, keyfile=SSL_KEYFILE)

# Start WebSocket server without SSL
start_server = websockets.serve(handle_connection, HOST, PORT)
print(f"WebSocket server is running on ws://{HOST}:{PORT}")
    
# Run the server
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()