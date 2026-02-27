// Reference to the correct table body ID from your HTML
const tableBody = document.getElementById("attendanceBody"); 

function loadAttendanceList() {
    db.collection("attendance")
      .orderBy("timestamp", "desc")
      .onSnapshot((querySnapshot) => {
        tableBody.innerHTML = ""; 

        if (querySnapshot.empty) {
            tableBody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>No attendance records found yet.</td></tr>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const timeString = data.timestamp 
                ? data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                : "Processing...";

            // Matches your 5 table headers: Reg No, Name, Email, Date, Time
            const row = `
                <tr>
                    <td><strong>${data.regNo || "N/A"}</strong></td>
                    <td>${data.name || "N/A"}</td>
                    <td>${data.email || "N/A"}</td>
                    <td>${data.date || "N/A"}</td>
                    <td>${timeString}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }, (error) => {
        console.error("Error fetching attendance:", error);
    });
}

// Authentication Check
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        loadAttendanceList();
    } else {
        // Redirect to login, NOT dashboard.html (to avoid loops)
        window.location.href = "login.html"; 
    }
});

// Logout Function
function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = "index.html";
    });
}

// Excel Export Function
function exportToExcel() {
    let csv = [];
    const rows = document.querySelectorAll("table tr");
    
    for (let i = 0; i < rows.length; i++) {
        let row = [], cols = rows[i].querySelectorAll("td, th");
        for (let j = 0; j < cols.length; j++) 
            row.push('"' + cols[j].innerText + '"');
        csv.push(row.join(","));
    }

    const csvFile = new Blob([csv.join("\n")], {type: "text/csv"});
    const downloadLink = document.createElement("a");
    downloadLink.download = `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.click();
}