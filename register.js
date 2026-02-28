function register() {
  const name = document.getElementById("name").value.trim();
  const regNo = document.getElementById("regNo").value.trim().toUpperCase();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");

  // 1. Check if all fields are filled
  if (!name || !regNo || !email || !password) {
    msg.style.color = "red";
    msg.innerText = "All fields are required";
    return;
  }

  // 2. Validate Registration Number Format
  // Pattern: 25/U/1508/ICD with optional /PS
  const regPattern = /^[0-9]{2}\/U\/[0-9]{4}\/[A-Z]{3}(\/PS)?$/;
  if (!regPattern.test(regNo)) {
    msg.style.color = "red";
    msg.innerText = "Invalid Reg No format! Use XX/U/XXXX/XXX/PS";
    return;
  }

  // 3. Institutional Email Check
  if (!email.endsWith("@edu.lirauni.ac.ug")) {
    msg.style.color = "red";
    msg.innerText = "Error: Use your institutional email (@edu.lirauni.ac.ug)";
    return;
  }

  // 4. Password Length Check
  if (password.length < 6) {
    msg.style.color = "red";
    msg.innerText = "Password must be at least 6 characters.";
    return;
  }

  // 5. Firebase Auth & Database Storage
  msg.style.color = "blue";
  msg.innerText = "Creating account...";

  auth.createUserWithEmailAndPassword(email, password)
    .then((cred) => {
      // Create user profile in Firestore so the admin can see it
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
      msg.innerText = "Registration successful! Redirecting to login...";
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    })
    .catch((error) => {
      msg.style.color = "red";
      msg.innerText = error.message;
    });
}