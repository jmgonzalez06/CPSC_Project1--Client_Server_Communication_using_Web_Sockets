import asyncio
from flask import Flask, request, jsonify
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

# Get local network IP of server
def get_local_ip():
    hostname = socket.gethostname()
    return socket.gethostbyname(hostname)

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

# Path to your SSL/TLS certificate and private key
BASE_DIR = os.path.dirname(os.path.abspath(__file__))   # Path to the backend folder
SSL_CERTFILE = os.path.join(BASE_DIR, "cert.pem")      # Path to cert.pem
SSL_KEYFILE = os.path.join(BASE_DIR, "key.pem")        # Path to key.pem

# Verify that the certificate files exist
if not os.path.exists(SSL_CERTFILE) or not os.path.exists(SSL_KEYFILE):
    raise FileNotFoundError("Certificate files (cert.pem and key.pem) are missing from the backend folder.")

# Start the WebSocket server with SSL/TLS
ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ssl_context.load_cert_chain(certfile=SSL_CERTFILE, keyfile=SSL_KEYFILE)

start_server = websockets.serve(
    handle_connection,
    HOST,
    PORT,
    ssl=ssl_context
)

# Start the WebSocket server OUR FIRST ATTEMPT
# start_server = websockets.serve(handle_connection, HOST, PORT)

print(f"WebSocket server is running on wss://{HOST}:{PORT}")

# Run the server
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()

# Initialize Flask app
app = Flask(__name__)

# API endpoint for user login
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password are required.'}), 400

    # Authenticate user using the database
    if authenticate_user(username, password):
        return jsonify({'success': True, 'message': 'Login successful.'}), 200
    else:
        return jsonify({'success': False, 'message': 'Invalid username or password.'}), 401

# Start the Flask server in a separate thread
def run_flask():
    app.run(host='0.0.0.0', port=5000, debug=True)

flask_thread = threading.Thread(target=run_flask)
flask_thread.daemon = True
flask_thread.start()

print(f"Flask server is running on http://{HOST}:5000")