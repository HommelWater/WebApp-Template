import sqlite3
from datetime import datetime
from contextlib import contextmanager
import pyotp

def get_db_connection():
    conn = sqlite3.connect('data.db')
    conn.row_factory = sqlite3.Row 
    return conn

@contextmanager
def db_cursor():
    """Context manager for database connections."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def setup_db():
    with db_cursor() as c:
        c.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                parent_id INTEGER REFERENCES users(id),
                username TEXT UNIQUE NOT NULL,
                creation_datetime INTEGER,
                secret TEXT,
                invite_secret TEXT,
                invite_counter INTEGER
            )
        ''')

        c.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                key TEXT PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                creation_datetime INTEGER,
                expires_at_datetime INTEGER
            )
        ''')

        c.execute('''
            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hash TEXT UNIQUE NOT NULL,
                filename TEXT NOT NULL,
                creation_datetime INTEGER,
                size INTEGER,
                is_public INTEGER
            )
        ''')

def add_file(hash, filename, size, is_public):
    with db_cursor() as c:
        creation_datetime = int(datetime.now().timestamp())
        c.execute('''
            INSERT INTO files (hash, filename, creation_datetime, size, is_public)
            VALUES (?, ?, ?, ?, ?)
        ''', (hash, filename, creation_datetime, size, is_public))
        idx = c.lastrowid
    return idx

def get_file(id):
    with db_cursor() as c:
        c.execute('SELECT * FROM files WHERE id = ?', (id,))
        file = c.fetchone()
    return dict(file)

def get_files(public_only=True):
    with db_cursor() as c:
        if public_only:
            c.execute('SELECT * FROM files WHERE is_public = ?', (1,))
        else:
            c.execute('SELECT * FROM files')
        files = c.fetchall()
    return [dict(f) for f in files]

def get_session(key):
    with db_cursor() as c:
        c.execute('SELECT * FROM sessions WHERE key = ?', (key,))
        session = c.fetchone()
        if (session and session["expires_at_datetime"] <= int(datetime.now().timestamp())):
            c.execute('DELETE FROM sessions WHERE key = ?', (key,))
            session = None
    return dict(session) if session else None

def add_session(key, user_id, expires_in=86_400):
    with db_cursor() as c:
        creation_datetime = int(datetime.now().timestamp())
        c.execute('''
            INSERT INTO sessions (key, user_id, creation_datetime, expires_at_datetime)
            VALUES (?, ?, ?, ?)
        ''', (key, user_id, creation_datetime, creation_datetime + expires_in))
        idx = c.lastrowid
    return idx

def add_user(username, secret, parent_id=None):
    with db_cursor() as c:
        creation_datetime = int(datetime.now().timestamp())
        invite_secret = pyotp.random_base32()
        c.execute('''
            INSERT INTO users (parent_id, username, creation_datetime, secret, invite_secret, invite_counter)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (parent_id, username, creation_datetime, secret, invite_secret, 0))

def get_user(identifier):
    with db_cursor() as c:
        if isinstance(identifier, int) or (isinstance(identifier, str) and identifier.isdigit()):
            c.execute('SELECT * FROM users WHERE id = ?', (int(identifier),))
        else:
            c.execute('SELECT * FROM users WHERE username = ?', (identifier,))

        user = c.fetchone()
        return dict(user) if user else None

def increment_invite_counter(identifier):
    with db_cursor() as c:
        # Determine field and value
        if isinstance(identifier, int) or (isinstance(identifier, str) and identifier.isdigit()):
            field, value = 'id', int(identifier)
        else:
            field, value = 'username', identifier
        
        # Increment counter directly in SQL (atomic, no race condition)
        c.execute(f'''
            UPDATE users 
            SET invite_counter = COALESCE(invite_counter, 0) + 1 
            WHERE {field} = ?
        ''', (value,))