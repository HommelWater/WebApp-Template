document.addEventListener('DOMContentLoaded', load);

async function load(){
    const sk = localStorage.getItem("session");
    document.getElementById("session_key").innerText = `Your session key: ${sk}`;
    if (sk === "" || sk === null){
        location.href = "/auth";
    }
    const json = await apiRequest("/server_data_example", "POST", JSON.stringify({"session":sk}));
    document.getElementById("server_data").innerText = JSON.stringify(json, null, 2);
    loadFiles();
}

async function handleUpload() {
    const fileInput = document.getElementById('fileInput');
    const isPublic = document.getElementById('isPublic').checked;
    
    if (!fileInput.files[0]) {
        showToast('Please select a file', 'error');
        return;
    }

    try {
    await uploadFile(fileInput.files[0], isPublic, (pct) => showToast(`Uploading: ${pct}%`, "info"));
    
    showToast('Upload complete!', 'success');
    fileInput.value = '';
    loadFiles();
    } catch (err) {
        showToast('Upload failed: ' + err.message, 'error');
    }
}

// Load and display file list
async function loadFiles() {
    const listEl = document.getElementById('fileList');
    listEl.innerHTML = 'Loading...';
    
    try {
        const files = await getFilesMetadata();
        if (files.length === 0) {
            listEl.innerHTML = '<p>No files found</p>';
            return;
        }

        listEl.innerHTML = files.map(f => `
            <div class="file-item">
            <span>${f.filename} ${f.is_public ? '(public)' : '(private)'}</span>
            <button onclick="handleDownload(${f.id}, '${f.filename}')">Download</button>
            </div>
        `).join('');
    } catch (err) {
        listEl.innerHTML = 'Error loading files';
        showToast(err.message, 'error');
    }
}

// Handle file download
async function handleDownload(fileId, filename) {
    try {
        showToast(`Starting download: ${filename}`, 'info');
        await downloadFile(fileId, (pct) => {
            if (pct) showToast(`Downloading: ${Math.round(pct * 100)}%`, 'info', 1000);
        });
        showToast('Download complete!', 'success');
    } catch (err) {
        showToast('Download failed: ' + err.message, 'error');
    }
}
