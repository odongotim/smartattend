const WEB_APP_URL = "/api/proxy";

// Generate or retrieve a unique device ID for this browser
function getDeviceId() {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
        deviceId = 'dev-' + Math.random().toString(36).substr(2, 12);
        localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
}

function register() {
    const name = document.getElementById("name").value.trim();
    const regNo = document.getElementById("reg").value.trim();
    const email = document.getElementById("username").value.trim();
    const msg = document.getElementById("msg");

    if (!name || !regNo || !email) {
        msg.innerText = "All fields are required";
        return;
    }

    const deviceId = getDeviceId();

    fetch(WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "register",
            name: name,
            email: email,
            regNo: regNo,
            deviceId: deviceId
        })
    })
    .then(res => res.json())
    .then(res => {
        if (res.success) {
            msg.innerText = "Registration successful!";
            setTimeout(() => window.location.href = "login.html", 1500);
        } else {
            msg.innerText = res.message;
        }
    })
    .catch(error => {
        console.error("Error:", error);
        msg.innerText = "Server error. Try again.";
    });
}