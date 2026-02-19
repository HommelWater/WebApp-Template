document.addEventListener('DOMContentLoaded', load);

async function load(){
    const sk = localStorage.getItem("session");
    document.getElementById("session_key").innerText = `Your session key: ${sk}`;
    if (sk === "" || sk === null){
        location.href = "/auth";
    }
    const json = await apiRequest("/server_data_example", "POST", JSON.stringify({"session":sk}));
    document.getElementById("server_data").innerText = JSON.stringify(json, null, 2);

}