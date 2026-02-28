document.addEventListener("DOMContentLoaded", () => {

    const dash = document.getElementById("dash-content");

    // ADMIN CHECK
    if (localStorage.getItem("isAdminLoggedIn") !== "true") {
        window.location.href = "admin-login.html";
        return;
    }

    dash.style.display = "block";

    loadRegisteredUsers();
    loadSessionDropdown();
    loadAttendanceBySession();
});

// LOGOUT
function logout() {
    localStorage.removeItem("isAdminLoggedIn");
    window.location.href = "admin-login.html";
}

firebase.auth().signInAnonymously()
  .then(() => {
    console.log("Admin authenticated anonymously");
    loadRegisteredUsers();
    loadSessionDropdown();
    loadAttendanceBySession();
  })
  .catch(err => {
    console.error("Anon auth error:", err);
  });

// REGISTERED USERS
function loadRegisteredUsers() {
    db.collection("users").onSnapshot(snapshot => {
        let html = "";

        if (snapshot.empty) {
            html = `<tr><td colspan="3">No registered users</td></tr>`;
        }

        snapshot.forEach(doc => {
            const u = doc.data();
            html += `
                <tr>
                    <td>${u.name}</td>
                    <td>${u.regNo}</td>
                    <td>${u.email}</td>
                </tr>
            `;
        });

        document.getElementById("userBody").innerHTML = html;
    }, err => console.error(err));
}

// SESSION DROPDOWN
function loadSessionDropdown() {
    db.collection("attendance").onSnapshot(snapshot => {
        const selector = document.getElementById("sessionSelector");
        selector.innerHTML = `<option value="">All Sessions</option>`;

        const sessions = new Set();
        snapshot.forEach(doc => sessions.add(doc.data().session));

        sessions.forEach(s => {
            selector.innerHTML += `<option value="${s}">${s}</option>`;
        });
    });
}

// ATTENDANCE
function loadAttendanceBySession() {
    const session = document.getElementById("sessionSelector").value;
    let query = db.collection("attendance");

    if (session) {
        query = query.where("session", "==", session);
    }

    query.onSnapshot(snapshot => {
        let html = "";

        if (snapshot.empty) {
            html = `<tr><td colspan="3">No attendance records</td></tr>`;
        }

        snapshot.forEach(doc => {
            const d = doc.data();
            html += `
                <tr>
                    <td>${d.regNo}</td>
                    <td>${d.email}</td>
                    <td>${d.time?.toDate().toLocaleString()}</td>
                </tr>
            `;
        });

        document.getElementById("attendanceBody").innerHTML = html;
    });
}