// Firebase already initialized
const db = firebase.firestore();

// Load attendance for selected date
function loadAttendance() {
  const selectedDate = document.getElementById("attendanceDate").value;
  if (!selectedDate) return;

  db.collection("attendance")
    .where("date", "==", selectedDate)
    .orderBy("time")
    .get()
    .then(snapshot => {
      const table = document.getElementById("attendanceTable");
      table.innerHTML = "";

      snapshot.forEach(doc => {
        const data = doc.data();
        const timeStr = new Date(data.time.seconds * 1000).toLocaleTimeString();
        const row = `<tr>
          <td>${data.name}</td>
          <td>${data.regNo}</td>
          <td>${timeStr}</td>
        </tr>`;
        table.innerHTML += row;
      });
    })
    .catch(err => console.error("Error loading attendance:", err));
}

// Optional: Load today's attendance by default
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("attendanceDate").value = today;
  loadAttendance();
});

// Logout function
function logout() {
  window.location.href = "login.html";
}