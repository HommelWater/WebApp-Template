async function apiRequest(url, method = 'GET', data = null, json=true) {
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
    if (json){
        return response.json();
    } else {
        return response
    }
    
}

// Displays a toast message to the user.
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
        padding: 5px 8px;
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

// Upload a file to the server, onprogress is a callback function that gets called with the percentage of the upload progress.
// Usage:
// const file_data = await uploadFile(file, (pct)=>showToast(`Upload progress: ${pct}%`, "info", 1000)));
async function uploadFile(file, is_public, onProgress) {
    const session = localStorage.getItem("session");
    const xhr = new XMLHttpRequest();
  
    return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        });
    
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) resolve(JSON.parse(xhr.response));
            else reject(new Error(xhr.responseText));
        });
    
        xhr.addEventListener('error', () => reject(new Error('Upload failed')));

        xhr.open('POST', '/files/upload');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('session', session);
        formData.append('is_public', is_public);
        xhr.send(formData);
  });
}

// Get the metadata for all files accesible to you.
async function getFilesMetadata(){
    const session = localStorage.getItem("session");
    const res = await apiRequest("/files/", "POST", JSON.stringify({session}));
    if (res.type === 'failure') {
        listEl.innerHTML = 'Failed to load files';
        showToast(res.data.notification, "failure");
        return [];
    }
    return res.data.files;
}

// Download a file by file id, onProgress is a callback function that gets passed the percentage of progress.
// Usage:
// const res = await downloadFile(file_id, (pct)=>showToast(`Download progress: ${pct}%`, "info", 1000));
async function downloadFile(file_id, onProgress) {
    const xhr = new XMLHttpRequest();
    
    xhr.onprogress = (e) => {
        if (onProgress && e.lengthComputable) {
            onProgress(e.loaded / e.total);
        }
    };
    
    xhr.responseType = 'blob';
    xhr.open('POST', `/files/download/${file_id}`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ session: localStorage.getItem("session") }));
    
    return new Promise((resolve, reject) => {
        xhr.onload = () => {
            const url = URL.createObjectURL(xhr.response);
            const a = document.createElement('a');
            a.href = url;
            a.download = xhr.getResponseHeader('Content-Disposition')?.match(/filename="?([^"]+)"?/)[1] || 'file';
            a.click();
            URL.revokeObjectURL(url);
            resolve();
        };
        xhr.onerror = reject;
    });
}