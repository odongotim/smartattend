function register() {
  const name = document.getElementById("name").value.trim();
  const regNo = document.getElementById("regNo").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");

  if (!name || !regNo || !email || !password) {
    msg.innerText = "All fields are required";
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then((cred) => {
      return db.collection("users").doc(cred.user.uid).set({
        name: name,
        regNo: regNo,
        email: email,
        createdAt: new Date()
      });
    })
    .then(() => {
      msg.style.color = "green";
      msg.innerText = "Registration successful!";
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    })
    .catch((error) => {
      msg.style.color = "red";
      msg.innerText = error.message;
    });
}