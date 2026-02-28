// ================================
// ADMIN ACCESS CHECK (LOCALSTORAGE)
// ================================
const dash = document.getElementById("dash-content");

if (localStorage.getItem("isAdminLoggedIn") === "true") {
    dash.style.display = "block";
    loadRegisteredUsers();
    loadSessionDropdown();
    loadAttendanceBySession();
} else {
    window.location.href = "admin-login.html";
}

// ================================
// LOGOUT
// ================================
function logout() {
    localStorage.removeItem("isAdminLoggedIn");
    window.location.href = "admin-login.html";
}

// ================================
// LOAD REGISTERED USERS
// ================================
function loadRegisteredUsers() {
    db.collection("users").orderBy("name", "asc")
    .onSnapshot(snapshot => {
        let html = "";
        snapshot.forEach(doc => {
            const u = doc.data();
            html += `
                <tr>
                    <td>${u.name || "N/A"}</td>
                    <td>${u.regNo || "N/A"}</td>
                    <td>${u.email || "N/A"}</td>
                </tr>
            `;
        });
        document.getElementById("userBody").innerHTML = html;
    });
}

// ================================
// LOAD SESSION DROPDOWN
// ================================
function loadSessionDropdown() {
    db.collection("attendance").onSnapshot(snapshot => {
        const sessions = new Set();
        snapshot.forEach(doc => sessions.add(doc.data().session));

        const selector = document.getElementById("sessionSelector");
        selector.innerHTML = `<option value="">All Sessions</option>`;

        sessions.forEach(s => {
            selector.innerHTML += `<option value="${s}">${s}</option>`;
        });
    });
}

// ================================
// LOAD ATTENDANCE BY SESSION
// ================================
function loadAttendanceBySession() {
    const session = document.getElementById("sessionSelector").value;
    let query = db.collection("attendance").orderBy("time", "desc");

    if (session) {
        query = query.where("session", "==", session);
    }

    query.onSnapshot(snapshot => {
        let html = "";
        snapshot.forEach(doc => {
            const d = doc.data();
            const time = d.time ? d.time.toDate().toLocaleString() : "-";

            html += `
                <tr>
                    <td>${d.regNo}</td>
                    <td>${d.email}</td>
                    <td>${time}</td>
                </tr>
            `;
        });
        document.getElementById("attendanceBody").innerHTML = html;
    });
}