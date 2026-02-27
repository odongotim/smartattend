// login.js
function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("msg");

    console.log("Login attempt for:", email); // Debugging line

    if (!email || !password) {
        msg.innerText = "Enter email and password";
        msg.style.color = "red";
        return;
    }

    // Use the 'auth' variable defined in config.js
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            msg.style.color = "green";
            msg.innerText = "Success! Redirecting...";
            
            // Save login state
            localStorage.setItem("isUserLoggedIn", "true");

            setTimeout(() => {
                window.location.href = "scan.html";
            }, 1200);
        })
        .catch((error) => {
            msg.style.color = "red";
            msg.innerText = error.message;
            console.error("Firebase Auth Error:", error.code, error.message);
        });
}