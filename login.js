// Firebase services already initialized in HTML
const msg = document.getElementById("msg");

function getDeviceId() {
  return localStorage.getItem("deviceId");
}

function login() {
  const email = document.getElementById("username").value.trim();
  
  if (!email) {
    msg.innerText = "Please enter email";
    return;
  }

  const password = "ScanAttend@123"; // same password used in registration
  const deviceId = getDeviceId();

  // 1️⃣ Sign in with Firebase Auth
  auth.signInWithEmailAndPassword(email, password)
    .then(cred => {
      // 2️⃣ Fetch user record from Firestore
      return db.collection("users").doc(cred.user.uid).get();
    })
    .then(doc => {
      if (!doc.exists) throw "User record missing";

      // 3️⃣ Check device ID
      if (doc.data().deviceId !== deviceId) {
        auth.signOut();
        throw "Invalid device";
      }

      // 4️⃣ Save session in localStorage
      localStorage.setItem("isUserLoggedIn", "true");
      localStorage.setItem("name", doc.data().name);
      localStorage.setItem("regNo", doc.data().regNo);

      // 5️⃣ Redirect to scan page
      window.location.href = "scan.html";
    })
    .catch(err => {
      console.error(err);
      msg.innerText = err;
    });
}