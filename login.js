const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyADAgCMvtppd5T_buahLW6TRflIVp6_H3jz6_u5qoynoIMyqQTneVGX55naG2yxdZgKg/exec";

// Generate or retrieve a unique device ID for this browser
function getDeviceId() {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
        deviceId = 'dev-' + Math.random().toString(36).substr(2, 12);
        localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
}

function login() {
    const email = document.getElementById("username").value.trim();
    const msg = document.getElementById("msg");

    if (!email) {
        msg.innerText = "Please enter email";
        return;
    }

    const deviceId = getDeviceId();

    fetch(WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "login",
            email: email,
            deviceId: deviceId
        })
    })
    .then(res => res.json())
    .then(res => {
        if (res.success) {
            localStorage.setItem("isUserLoggedIn", "true");
            localStorage.setItem("name", res.name);
            localStorage.setItem("regNo", res.regNo);

            window.location.href = "scan.html";
        } else {
            msg.innerText = res.message;
        }
    })
    .catch(error => {
        console.error("Error:", error);
        msg.innerText = "Server error. Try again.";
    });
}