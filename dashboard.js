// 1. LOAD ALL REGISTERED USERS
function loadRegisteredUsers() {
    db.collection("users").orderBy("name", "asc").onSnapshot(snap => {
        let html = "";
        snap.forEach(doc => {
            const u = doc.data();
            html += `<tr>
                <td>${u.name || "N/A"}</td>
                <td>${u.regNo || "N/A"}</td>
                <td>${u.email}</td>
            </tr>`;
        });
        document.getElementById("userBody").innerHTML = html;
    });
}

// 2. LOAD SESSIONS INTO DROPDOWN
function loadSessionDropdown() {
    // This gets unique session names from the attendance records
    db.collection("attendance").onSnapshot(snap => {
        const sessions = new Set();
        snap.forEach(doc => sessions.add(doc.data().session));
        
        const selector = document.getElementById("sessionSelector");
        selector.innerHTML = '<option value="">All Sessions</option>';
        sessions.forEach(s => {
            selector.innerHTML += `<option value="${s}">${s}</option>`;
        });
    });
}

// 3. FILTER ATTENDANCE BY SESSION
function loadAttendanceBySession() {
    const selectedSession = document.getElementById("sessionSelector").value;
    let query = db.collection("attendance").orderBy("time", "desc");

    if (selectedSession !== "") {
        query = query.where("session", "==", selectedSession);
    }

    query.onSnapshot(snap => {
        let html = "";
        snap.forEach(doc => {
            const d = doc.data();
            const time = d.time ? d.time.toDate().toLocaleTimeString() : "...";
            html += `<tr>
                <td>${d.regNo || "N/A"}</td>
                <td>${d.email}</td>
                <td>${time}</td>
            </tr>`;
        });
        document.getElementById("attendanceBody").innerHTML = html;
    });
}

// dashboard.js

// 1. First, hide the dashboard content and show a loader in your HTML
const dashboardContent = document.getElementById("dash-content");
const loader = document.getElementById("loader");

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // SUCCESS: Firebase found a session
        console.log("Verified User:", user.email);
        
        // Hide loader, show content
        if (loader) loader.style.display = "none";
        if (dashboardContent) dashboardContent.style.display = "block";
        
        // Now it's safe to load your tables
        loadRegisteredUsers();
        loadAttendanceBySession();
    } else {
        // FAIL: No session found after checking
        console.log("No session. Redirecting...");
        window.location.replace("admin-login.html");
    }
});