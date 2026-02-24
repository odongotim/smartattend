// Firebase already initialized in scan.html
// User info
const userName = localStorage.getItem("name");
const regNo = localStorage.getItem("regNo");

// Logout function
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// Mark attendance function
function markAttendance() {
  db.collection("attendance").add({
    name: userName,
    regNo: regNo,
    time: new Date()
  })
  .then(() => alert("Attendance marked!"))
  .catch(err => console.error(err));
}

// QR scanning (Html5Qrcode)
function onScanSuccess(decodedText, decodedResult) {
  document.getElementById("result").innerText = decodedText;

  // Optional: automatically mark attendance when QR scanned
  markAttendance();
}

// Initialize QR scanner
var html5QrcodeScanner = new Html5QrcodeScanner(
  "reader",       // HTML element ID
  { fps: 10, qrbox: 250 }, 
  false
);
html5QrcodeScanner.render(onScanSuccess);