function register() {
  const name = document.getElementById("name").value.trim();
  const regNo = document.getElementById("regNo").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");

  if (!name || !regNo || !email || !password) {
    msg.innerText = "All fields are required";
    return;
  }

  if (!email.endsWith("@edu.lirauni.ac.ug")) {
        msg.innerText = "Error: Use your institutional email (@edu.lirauni.ac.ug)";
        msg.style.color = "red";
        return; // Stop the function here
  }

  if (password.length < 6) {
        msg.innerText = "Password must be at least 6 characters.";
        return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(cred => {
      return db.collection("users").doc(cred.user.uid).set({
        name: name,
        regNo: regNo,
        email: email,
        role: "student",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .then(() => {
      msg.style.color = "green";
      msg.innerText = "Registration successful!";
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    })
    .catch(error => {
      msg.style.color = "red";
      msg.innerText = error.message;
    });
}