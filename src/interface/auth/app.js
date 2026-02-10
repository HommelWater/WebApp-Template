const app_name = "application_name";
document.addEventListener('DOMContentLoaded', load);

function load(){
    document.getElementById('login-button').addEventListener('click', login);
}

async function login(){
    const code = document.getElementById('login-code').value;
	const username = document.getElementById('login-username').value;
    const json = await apiRequest(`/auth`, "POST", JSON.stringify({
        code: code,
        username: username
    }));

    const type = json.type;
    const rdata = json.data;
    if (type == "signup"){
        const username = document.getElementById('login-username').value;
        generateTOTPQRCode(rdata.secret, app_name, username);
        document.getElementById('login-code').value = "";
    } else
    if (type == "login"){
        localStorage.setItem("session", rdata.session_key);
        location.href = "/";
    } else
    if (type == "failure"){
        console.log(rdata.notification);
    }
}

function generateTOTPQRCode(secret, issuer, accountName) {
    document.getElementById("login-code").innerHTML = "";
    const container = document.getElementById("qrcode");
    container.innerHTML = "";
    
    const totpUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}`;
    
    const link = document.createElement("a");
    link.href = totpUri;
    link.style.display = "inline-block";
    link.style.cursor = "pointer";
    link.style.position = "relative";
    link.title = "Click to open authenticator app";
    
    new QRCode(link, {
        text: totpUri,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    
    container.appendChild(link);
    
    setTimeout(() => {
        const badge = document.createElement("div");
        badge.textContent = "🟢 Click to open";
        badge.style.cssText = `
            position: absolute; bottom: 5px; right: 5px;
            background: rgba(255,255,255,0.9); padding: 4px 8px;
            border-radius: 4px; font-size: 10px; pointer-events: none;
        `;
        link.appendChild(badge);
    }, 50);
    
    document.getElementById('qrcode-label').innerHTML = 
        `Scan the QR code or click to open in your authenticator app. You might have to add a new "account" in the case of the apple password manager.`;
}

async function apiRequest(url, method = 'GET', data = null) {
    const options = {
        method: method,
    };

    if (data) {
        if (typeof data === 'string') {
            options.body = data;
            options.headers = { 'Content-Type': 'application/json' };
        } else {options.body = data;}
    }
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return response.json();
}