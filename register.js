const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwJPf8bQllCAcha58QRp0qk6c_iCZCVTHBDMDs-6Em85uoIvfMzGDkBzearGH7ZeRosaQ/exec";

function register() {
    const name = document.getElementById("name").value.trim();
    const reg = document.getElementById("reg").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("msg");

    if (!name || !reg || !username || !password) {
        msg.innerText = "All fields are required";
        return;
    }

    fetch(WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: JSON.stringify({
            action: "register",
            name: name,
            reg: reg,
            username: username,
            password: password
        })
    })
    .then(res => res.text())
    .then(res => {
        if (res === "success") {
            msg.innerText = "Registration successful!";
            setTimeout(() => window.location.href = "login.html", 1500);
        } else {
            msg.innerText = res;
        }
    })
    .catch(error => {
        console.error("Error:", error);
        msg.innerText = "Server error. Try again.";
    });
}