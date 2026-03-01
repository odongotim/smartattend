async function login() {
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");

  if (!email || !password) {
    msg.innerText = "Enter email and password";
    msg.style.color = "red";
    return;
  }

  msg.innerText = "Checking credentials...";
  msg.style.color = "blue";

  try {
    const users = await getUsers();

    const user = users.find(
      u => u.email === email && u.password === password
    );

    if (!user) {
      msg.innerText = "Invalid email or password";
      msg.style.color = "red";
      return;
    }

    // ✅ SAVE SESSION
    localStorage.setItem("isUserLoggedIn", "true");
    localStorage.setItem("userName", user.name);
    localStorage.setItem("userRegNo", user.regNo);
    localStorage.setItem("userEmail", user.email);

    msg.innerText = "Login successful!";
    msg.style.color = "green";

    setTimeout(() => {
      window.location.href = "scan.html";
    }, 1000);

  } catch (err) {
    console.error(err);
    msg.innerText = "Server error. Try again.";
    msg.style.color = "red";
  }
}