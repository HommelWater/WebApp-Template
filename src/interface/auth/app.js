const app_name = "application_name";
document.addEventListener('DOMContentLoaded', load);

function load(){
    document.getElementById('login-button').addEventListener('click', login);
    setEnterPressEvent();
}

async function login(){
    const code = document.getElementById('login-code').value;
	let username = document.getElementById('login-username').value;

    let targetHost = window.location.host.replace(/^0\.0\.0\.0/, 'localhost');
    if (username.includes('@')) {
        const parts = username.split('@');
        username = parts[0];
        targetHost = parts[1];
    }

    const json = await apiRequest(`//${targetHost}/auth/`, "POST", JSON.stringify({
        code: code,
        username: username
    }));

    const type = json.type;
    const rdata = json.data;
    if (type == "signup"){
        generateTOTPQRCode(rdata.secret, targetHost, username);
        document.getElementById('login-code').value = "";
    } else
    if (type == "login"){
        localStorage.setItem("session", rdata.session_key);
        location.href = "/";
    } else
    if (type == "failure"){
        console.log(rdata.notification);
        showToast(rdata.notification, "error");
        if (rdata.href){
            location.href = rdata.href;
        }
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

function setEnterPressEvent(){
    const loginCode = document.getElementById('login-code');
    const loginButton = document.getElementById('login-button');
    
    loginCode.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            loginButton.click();
        }
    });
}

function showToast(message, type = 'success', duration = 3000) {
    // Remove existing toasts
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    
    // Colors based on type
    const colors = {
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    // Styles
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${colors[type] || colors.success};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease;
        pointer-events: none;
        max-width: 90vw;
        text-align: center;
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    // Remove after duration
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}