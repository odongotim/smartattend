function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");

  if (!email || !password) {
    msg.innerText = "Enter email and password";
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(cred => {
      return db.collection("users").doc(cred.user.uid).get();
    })
    .then(doc => {
      if (!doc.exists) {
        throw new Error("User record not found");
      }

      localStorage.setItem("isUserLoggedIn", "true");
      localStorage.setItem("name", doc.data().name);
      localStorage.setItem("regNo", doc.data().regNo);

      window.location.href = "scan.html";
    })
    .catch(error => {
      msg.innerText = error.message;
    });
}