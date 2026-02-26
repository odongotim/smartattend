// Check if user is logged in
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // You can add a check here to see if user.email === "admin@yoursite.com"
        loadAttendance();
    } else {
        window.location.href = "dashboard.html";
    }
});

function loadAttendance() {
    const tableBody = document.getElementById("attendanceBody");

    // Fetch all attendance records sorted by time (latest first)
    db.collection("attendance").orderBy("timestamp", "desc").get().then((querySnapshot) => {
        tableBody.innerHTML = ""; // Clear existing rows
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const row = `
                <tr>
                    <td>${data.regNo || 'N/A'}</td>
                    <td>${data.name || 'N/A'}</td>
                    <td>${data.email || 'N/A'}</td>
                    <td>${data.date || 'N/A'}</td>
                    <td>${data.timestamp ? data.timestamp.toDate().toLocaleTimeString() : 'N/A'}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }).catch((error) => {
        console.error("Error loading attendance: ", error);
    });
}

function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = "index.html";
    });
}