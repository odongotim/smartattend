// Check if user is logged in ONCE
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        console.log("Admin logged in:", user.email);
        // Only load if the table is currently empty to prevent loops
        const tableBody = document.getElementById("attendanceBody");
        if (tableBody && tableBody.children.length === 0) {
            loadAttendance();
        }
    } else {
        // Only redirect if we aren't already on the login page
        if (!window.location.href.includes("login.html")) {
            window.location.href = "login.html";
        }
    }
});

function loadAttendance() {
    const tableBody = document.getElementById("attendanceBody");
    
    // We use .onSnapshot instead of .get() so the list updates 
    // automatically in real-time WITHOUT refreshing the page.
    db.collection("attendance")
      .orderBy("timestamp", "desc")
      .onSnapshot((querySnapshot) => {
        tableBody.innerHTML = ""; // Clear table for fresh data
        
        if (querySnapshot.empty) {
            tableBody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>No one has scanned yet today.</td></tr>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Format the timestamp safely
            let timeString = "N/A";
            if (data.timestamp) {
                timeString = data.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }

            const row = `
                <tr>
                    <td>${data.regNo || "—"}</td>
                    <td>${data.name || "—"}</td>
                    <td>${data.email || "—"}</td>
                    <td>${data.date || "—"}</td>
                    <td>${timeString}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }, (error) => {
        console.error("Firestore Error:", error);
        if (error.message.includes("index")) {
            alert("Admin: You need to create an index. Check the browser console (F12) for the link.");
        }
    });
}

function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = "login.html";
    });
}