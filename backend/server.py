import asyncio
import websockets
import os
from dotenv import load_dotenv
import json
from db import authenticate_user  # Import authentication function
import time

# Store connected clients
connected_clients = set()

# Load environment variables from .env file
load_dotenv()

# Get the port from the environment variable, default to 8080 if not set
PORT = int(os.getenv("PORT", 8080))

# Settings for rate limit
RATE_LIMIT_INTERVAL = 5 # 5 seconds
RATE_LIMIT_THRESHOLD = 5 # 5 messages per interval

# Store each client's message frequency
client_msg_freq = {}

async def handle_connection(websocket, path):
    # Add the new client to the connected clients set
    connected_clients.add(websocket)
    print(f"New client connected. Total clients: {len(connected_clients)}")

    # Get client's id and prepare to track
    client_id = id(websocket)
    client_msg_freq[client_id] = (time.time(), 0)
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
    finally:
        # Remove the client when they disconnect
        del client_msg_freq[client_id]
        connected_clients.remove(websocket)
        print(f"Client disconnected. Total clients: {len(connected_clients)}")

# Start the WebSocket server
start_server = websockets.serve(handle_connection, "localhost", PORT)

print("WebSocket server is running on ws://localhost:8080")

# Run the server
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()