// ================================
// FIREBASE AUTH GUARD (SAFE)
// ================================
const dashboardContent = document.getElementById("dash-content");
const loader = document.getElementById("loader");

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        console.log("Verified User:", user.email);

        if (loader) loader.style.display = "none";
        if (dashboardContent) dashboardContent.style.display = "block";

        loadRegisteredUsers();
        loadSessionDropdown();
        loadAttendanceBySession();
    } else {
        // Delay redirect to allow Firebase restore session
        setTimeout(() => {
            if (!firebase.auth().currentUser) {
                window.location.href = "admin-login.html";
            }
        }, 1000);
    }
});

// ================================
// LOGOUT
// ================================
function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = "admin-login.html";
    });
}

// ================================
// LOAD REGISTERED USERS
// ================================
function loadRegisteredUsers() {
    db.collection("users")
        .orderBy("name", "asc")
        .onSnapshot((snap) => {
            let html = "";
            snap.forEach((doc) => {
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
// LOAD SESSIONS DROPDOWN
// ================================
function loadSessionDropdown() {
    db.collection("attendance").onSnapshot((snap) => {
        const sessions = new Set();
        snap.forEach((doc) => {
            if (doc.data().session) {
                sessions.add(doc.data().session);
            }
        });

        const selector = document.getElementById("sessionSelector");
        selector.innerHTML = `<option value="">All Sessions</option>`;

        sessions.forEach((s) => {
            selector.innerHTML += `<option value="${s}">${s}</option>`;
        });
    });
}

// ================================
// LOAD ATTENDANCE BY SESSION
// ================================
function loadAttendanceBySession() {
    const selectedSession = document.getElementById("sessionSelector").value;
    let query = db.collection("attendance").orderBy("time", "desc");

    if (selectedSession) {
        query = query.where("session", "==", selectedSession);
    }

    query.onSnapshot((snap) => {
        let html = "";
        snap.forEach((doc) => {
            const d = doc.data();
            const time = d.time
                ? d.time.toDate().toLocaleString()
                : "—";

            html += `
                <tr>
                    <td>${d.regNo || "N/A"}</td>
                    <td>${d.email || "N/A"}</td>
                    <td>${time}</td>
                </tr>
            `;
        });
        document.getElementById("attendanceBody").innerHTML = html;
    });
}