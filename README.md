# Authentification-Template
Basic authentication template for websites/webapps in HTML/CSS/JS &amp; Python with FastAPI &amp; SQLite.

The example server can be setup and ran by running the 'setup.sh' bash script.

![alt text](https://github.com/HommelWater/Authentification-Template/blob/main/images/auth_example_1.png?raw=true)

Users can enter an invite code initially, which consists of the invitee's username and a HOTP code merged with an underscore: 'username_123456'. 

![alt text](https://github.com/HommelWater/Authentification-Template/blob/main/images/auth_example_2.png?raw=true)

The user then uses the QR code to store the TOTP secret key on their mobile device.

Finally, to log in, the user uses their generated TOTP code to authenticate them selves.

![alt text](https://github.com/HommelWater/Authentification-Template/blob/main/images/auth_example_3.png?raw=true)

The final session token is stored in localStorage under the 'session' key and is valid for 24 hours by default.

To retrieve the key on the client, the following code can be used: const session_key = localStorage.getItem("session");

Example functions available in 'server.py' for getting a user's invite code and user information from a session key.
