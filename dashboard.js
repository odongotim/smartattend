// Reference to the table body
const tableBody = document.getElementById("attendanceTableBody");

function loadAttendanceList() {
    // Listen for real-time updates from the 'attendance' collection
    db.collection("attendance")
      .orderBy("timestamp", "desc") // Show latest scans at the top
      .onSnapshot((querySnapshot) => {
        tableBody.innerHTML = ""; // Clear existing rows to prevent duplication

        if (querySnapshot.empty) {
            tableBody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>No attendance records found yet.</td></tr>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Format the Firestore timestamp to a readable time
            const timeString = data.timestamp 
                ? data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                : "Processing...";

            const row = `
                <tr>
                    <td><strong>${data.regNo || "N/A"}</strong></td>
                    <td>${data.name || "N/A"}</td>
                    <td>${data.email || "N/A"}</td>
                    <td>${data.session || "General"}</td>
                    <td>${data.date || "N/A"}</td>
                    <td>${timeString}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }, (error) => {
        console.error("Error fetching attendance:", error);
        if (error.code === 'permission-denied') {
            alert("Permission Denied. Check if you are logged in as an Admin.");
        }
    });
}

// Initialize the list when the page loads and user is verified
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        loadAttendanceList();
    } else {
        window.location.href = "login.html";
    }
});