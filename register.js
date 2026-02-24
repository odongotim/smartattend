// Firebase services already initialized in HTML
const msg = document.getElementById("msg");

function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = "dev-" + crypto.randomUUID();
    localStorage.setItem("deviceId", id);
  }
  return id;
}

function register() {
  const name = document.getElementById("name").value.trim();
  const regNo = document.getElementById("reg").value.trim();
  const email = document.getElementById("username").value.trim();
  
  if (!name || !regNo || !email) {
    msg.innerText = "All fields are required";
    return;
  }

  const password = "ScanAttend@123"; // simple auto password for all users
  const deviceId = getDeviceId();

  // 1️⃣ Create user in Firebase Auth
  auth.createUserWithEmailAndPassword(email, password)
    .then(cred => {
      // 2️⃣ Save user info in Firestore
      return db.collection("users").doc(cred.user.uid).set({
        name,
        regNo,
        email,
        deviceId,
        createdAt: new Date()
      });
    })
    .then(() => {
      msg.innerText = "Registration successful!";
      setTimeout(() => window.location.href = "login.html", 1200);
    })
    .catch(err => {
      console.error(err);
      msg.innerText = err.message;
    });
}