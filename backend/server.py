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


# Start the WebSocket server
start_server = websockets.serve(handle_connection, HOST, PORT)

print("WebSocket server is running on ws://" + HOST + ":" + str(PORT))

# Run the server
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()