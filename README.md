# Authentification-Template
Basic authentication template for websites/webapps in HTML/CSS/JS &amp; Python with FastAPI &amp; SQLite.

Users can enter an invite code initially, which consists of the invitee's username and a HOTP code merged with an underscore: 'username_123456'. 

The user then uses the QR code to store the TOTP secret key on their mobile device.

Finally, to log in, the user uses their generated TOTP code to authenticate them selves.

The final session token is stored in localStorage under the 'session' key and is valid for 24 hours by default.

To retrieve the key on the client, the following code can be used: const session_key = localStorage.getItem("session");

Example functions available in 'server.py' for getting a user's invite code and user information from a session key.
