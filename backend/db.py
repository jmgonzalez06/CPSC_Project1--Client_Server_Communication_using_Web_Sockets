import sqlite3
import bcrypt

# Initialize the database
def init_db():
    conn = sqlite3.connect('securechat.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

# Hash a password
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

# Authenticate a user
def authenticate_user(username, password):
    conn = sqlite3.connect('securechat.db')
    cursor = conn.cursor()
    cursor.execute('SELECT password FROM users WHERE username = ?', (username,))
    row = cursor.fetchone()
    conn.close()
    if row and bcrypt.checkpw(password.encode('utf-8'), row[0]):
        return True
    return False

# Add a user (for testing)
def add_user(username, password):
    conn = sqlite3.connect('securechat.db')
    cursor = conn.cursor()
    # Check if the user already exists
    cursor.execute('SELECT username FROM users WHERE username = ?', (username,))
    if cursor.fetchone() is None:
        # User does not exist, so add them
        cursor.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, hash_password(password)))
        conn.commit()
        print(f"Added user: {username}")
    else:
        print(f"User '{username}' already exists in the database.")
    conn.close()

# Initialize the database and add a test user
init_db()
add_user('user1', 'password123')  # This will now check if the user exists before adding