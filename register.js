function register() {
  const name = document.getElementById("name").value.trim();
  const regNo = document.getElementById("regNo").value.trim().toUpperCase();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");

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

  msg.style.color = "blue";
  msg.innerText = "Creating account...";

  auth.createUserWithEmailAndPassword(email, password)
    .then((cred) => {
      console.log("Auth created:", cred.user.uid);

      return db.collection("users").doc(cred.user.uid).set({
        name,
        regNo,
        email,
        role: "student",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .then(() => {
      msg.style.color = "green";
      msg.innerText = "Registration successful!";
      setTimeout(() => window.location.href = "login.html", 2000);
    })
    .catch((error) => {
      console.error("REG ERROR:", error);
      msg.style.color = "red";
      msg.innerText = error.message;
    });
}