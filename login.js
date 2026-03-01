// login.js (Google Sheets version)

function login() {
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");

  if (!email || !password) {
    msg.style.color = "red";
    msg.innerText = "Enter email and password";
    return;
  }

  if (!email.endsWith("@edu.lirauni.ac.ug")) {
    msg.style.color = "red";
    msg.innerText = "Only institutional emails are allowed";
    return;
  }

  msg.style.color = "blue";
  msg.innerText = "Checking credentials...";

  // Get users from Google Sheets
  getUsers()
    .then(res => {
      if (!res.success) throw new Error("Unable to fetch users");

      const user = res.users.find(
        u => u.email.toLowerCase() === email && u.password === password
      );

      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Save session
      localStorage.setItem("isUserLoggedIn", "true");
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("userName", user.name);
      localStorage.setItem("userRegNo", user.regNo);

      msg.style.color = "green";
      msg.innerText = "Login successful! Redirecting...";

      setTimeout(() => {
        window.location.href = "scan.html";
      }, 1200);
    })
    .catch(err => {
      console.error("LOGIN ERROR:", err);
      msg.style.color = "red";
      msg.innerText = err.message;
    });
}