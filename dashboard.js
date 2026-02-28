// Initialize Firebase (must match config.js)
const firebaseConfig = {
  apiKey: "AIzaSyB0n1GiqGllPKRAKgz9lEgt-6Ac6Jc4MWU",
  authDomain: "scanattend-c07f6.firebaseapp.com",
  projectId: "scanattend-c07f6",
  storageBucket: "scanattend-c07f6.firebasestorage.app",
  messagingSenderId: "352653349762",
  appId: "1:352653349762:web:848065fdb26803f594359b"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

const dash = document.getElementById("dash-content");
const loader = document.getElementById("loader");

// Check if admin is logged in
auth.onAuthStateChanged(user => {
  if (user) {
    loader?.remove();
    dash.style.display = "block";

    loadRegisteredUsers();
    loadSessionDropdown();
    loadAttendanceBySession();
  } else {
    window.location.href = "admin-login.html";
  }
});

// Logout
function logout() {
  auth.signOut().then(() => window.location.href = "admin-login.html");
}

// Load registered users
function loadRegisteredUsers() {
  db.collection("users").orderBy("name").onSnapshot(snapshot => {
    let html = "";
    if (snapshot.empty) html = `<tr><td colspan="3">No registered users</td></tr>`;
    snapshot.forEach(doc => {
      const u = doc.data();
      html += `<tr>
        <td>${u.name || "-"}</td>
        <td>${u.regNo || "-"}</td>
        <td>${u.email || "-"}</td>
      </tr>`;
    });
    document.getElementById("userBody").innerHTML = html;
  }, err => console.error(err));
}

// Load session dropdown
function loadSessionDropdown() {
  db.collection("attendance").onSnapshot(snapshot => {
    const selector = document.getElementById("sessionSelector");
    const sessions = new Set();
    snapshot.forEach(doc => sessions.add(doc.data().session));
    selector.innerHTML = `<option value="">All Sessions</option>`;
    sessions.forEach(s => selector.innerHTML += `<option value="${s}">${s}</option>`);
  });
}

// Load attendance by session
function loadAttendanceBySession() {
  const session = document.getElementById("sessionSelector").value;
  let query = db.collection("attendance").orderBy("time", "desc");

  if (session) query = query.where("session", "==", session);

  query.onSnapshot(snapshot => {
    let html = "";
    if (snapshot.empty) html = `<tr><td colspan="3">No attendance records</td></tr>`;
    snapshot.forEach(doc => {
      const d = doc.data();
      const time = d.time?.toDate ? d.time.toDate().toLocaleString() : "-";
      html += `<tr>
        <td>${d.regNo || "-"}</td>
        <td>${d.email || "-"}</td>
        <td>${time}</td>
      </tr>`;
    });
    document.getElementById("attendanceBody").innerHTML = html;
  });
}