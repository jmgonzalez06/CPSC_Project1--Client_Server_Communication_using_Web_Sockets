import asyncio
import websockets
import json
from db import authenticate_user  # Import authentication function

# Store connected clients
connected_clients = set()

async def handle_connection(websocket, path):
    # Add the new client to the connected clients set
    connected_clients.add(websocket)
    print(f"New client connected. Total clients: {len(connected_clients)}")

    try:
        async for message in websocket:
            print(f"Received: {message}")

            # Broadcast the message to all connected clients
            for client in connected_clients:
                if client != websocket and client.open:
                    await client.send(message)
    finally:
        # Remove the client when they disconnect
        connected_clients.remove(websocket)
        print(f"Client disconnected. Total clients: {len(connected_clients)}")

# Start the WebSocket server
start_server = websockets.serve(handle_connection, "localhost", 8080)

print("WebSocket server is running on ws://localhost:8080")

# Run the server
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()