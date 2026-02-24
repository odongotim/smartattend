const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwJPf8bQllCAcha58QRp0qk6c_iCZCVTHBDMDs-6Em85uoIvfMzGDkBzearGH7ZeRosaQ/exec";

function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("msg");

    if (!username || !password) {
        msg.innerText = "Please enter username and password";
        return;
    }

    fetch(WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: JSON.stringify({
            action: "login",
            username: username,
            password: password
        })
    })
    .then(res => res.text())
    .then(res => {
        if (res === "success") {
            localStorage.setItem("isUserLoggedIn", "true");
            window.location.href = "scan.html";
        } else {
            msg.innerText = "Invalid username or password";
        }
    })
    .catch(error => {
        console.error("Error:", error);
        msg.innerText = "Server error. Try again.";
    });
}