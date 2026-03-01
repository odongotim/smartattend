function register() {
  const name = document.getElementById("name").value.trim();
  const regNo = document.getElementById("regNo").value.trim().toUpperCase();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");

  // 1️⃣ Validation
  if (!name || !regNo || !email || !password) {
    msg.style.color = "red";
    msg.innerText = "All fields are required";
    return;
  }

  const regPattern = /^[0-9]{2}\/U\/[0-9]{4}\/[A-Z]{3}(\/PS)?$/;
  if (!regPattern.test(regNo)) {
    msg.style.color = "red";
    msg.innerText = "Invalid Reg No format!";
    return;
  }

  if (!email.endsWith("@edu.lirauni.ac.ug")) {
    msg.style.color = "red";
    msg.innerText = "Use your institutional email";
    return;
  }

  if (password.length < 6) {
    msg.style.color = "red";
    msg.innerText = "Password must be at least 6 characters";
    return;
  }

  // 2️⃣ Send to Google Sheets
  msg.style.color = "blue";
  msg.innerText = "Creating account...";

  registerStudent({
    name,
    regNo,
    email,
    password   // stored only if your teacher allows (see note below)
  })
  .then(res => {
    if (!res.success) throw new Error(res.message || "Registration failed");

    msg.style.color = "green";
    msg.innerText = "Registration successful!";
    setTimeout(() => window.location.href = "login.html", 2000);
  })
  .catch(err => {
    console.error("REG ERROR:", err);
    msg.style.color = "red";
    msg.innerText = err.message;
  });
}